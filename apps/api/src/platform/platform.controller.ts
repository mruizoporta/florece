import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { PlatformService } from './platform.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PlatformGuard } from '../common/guards/platform.guard';
import { SkipTenant } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth.types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const featureOverridesSchema = z
  .record(z.string(), z.boolean())
  .nullable()
  .optional();

const createTenantSchema = z.object({
  salonName: z.string().min(2).max(160),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(2).max(120),
  planSlug: z.string().optional(),
  trialDays: z.number().int().min(0).max(365).optional(),
  adminNote: z.string().max(2000).optional(),
  billingRegion: z.enum(['NI', 'US']).optional(),
  locale: z.enum(['es', 'en']).optional(),
  featureOverrides: featureOverridesSchema,
});

const updateTenantSchema = z.object({
  adminNote: z.string().max(2000).nullable().optional(),
  name: z.string().min(2).max(160).optional(),
  billingEmail: z.string().email().nullable().optional(),
  planSlug: z.string().optional(),
  featureOverrides: featureOverridesSchema,
});

const extendTrialSchema = z.object({
  days: z.number().int().min(1).max(365),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['NIO', 'USD']).optional(),
  method: z.enum(['TRANSFER', 'DEPOSIT', 'CASH', 'OTHER']),
  reference: z.string().max(120).optional(),
  paidAt: z.string().optional(),
  months: z.number().int().min(1).max(36).optional(),
  note: z.string().max(2000).optional(),
  planSlug: z.string().optional(),
});

const updatePlanSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  priceUsdMonthly: z.number().min(0).max(10000).optional(),
  priceNioMonthly: z.number().min(0).max(500000).optional(),
  maxEmployees: z.number().int().min(1).max(500).nullable().optional(),
  maxServices: z.number().int().min(1).max(5000).nullable().optional(),
  features: z.array(z.string().min(1).max(120)).max(20).optional(),
  entitlements: z.record(z.string(), z.boolean()).optional(),
  active: z.boolean().optional(),
  trialDays: z.number().int().min(0).max(90).optional(),
});

const createPlanSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(2).max(80),
  priceUsdMonthly: z.number().min(0).max(10000).optional(),
  priceNioMonthly: z.number().min(0).max(500000),
  maxEmployees: z.number().int().min(1).max(500).nullable().optional(),
  maxServices: z.number().int().min(1).max(5000).nullable().optional(),
  features: z.array(z.string().min(1).max(120)).max(20).optional(),
  entitlements: z.record(z.string(), z.boolean()).optional(),
  active: z.boolean().optional(),
  trialDays: z.number().int().min(0).max(90).optional(),
});

@ApiTags('platform')
@ApiBearerAuth()
@Controller('platform')
@SkipTenant()
@UseGuards(JwtAuthGuard, PlatformGuard)
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('overview')
  overview() {
    return this.platform.overview();
  }

  @Get('plans')
  listPlans() {
    return this.platform.listPlans();
  }

  @Post('plans')
  createPlan(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createPlanSchema))
    body: z.infer<typeof createPlanSchema>,
  ) {
    return this.platform.createPlan(user, body);
  }

  @Patch('plans/:slug')
  updatePlan(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(updatePlanSchema))
    body: z.infer<typeof updatePlanSchema>,
  ) {
    return this.platform.updatePlan(user, slug, body);
  }

  @Get('tenants')
  listTenants(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('planSlug') planSlug?: string,
  ) {
    return this.platform.listTenants({ q, status, planSlug });
  }

  @Post('tenants')
  createTenant(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createTenantSchema))
    body: z.infer<typeof createTenantSchema>,
  ) {
    return this.platform.createTenant(user, body);
  }

  @Get('tenants/:id')
  getTenant(@Param('id') id: string) {
    return this.platform.getTenant(id);
  }

  @Patch('tenants/:id')
  updateTenant(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTenantSchema))
    body: z.infer<typeof updateTenantSchema>,
  ) {
    return this.platform.updateTenant(user, id, body);
  }

  @Post('tenants/:id/extend-trial')
  extendTrial(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(extendTrialSchema))
    body: z.infer<typeof extendTrialSchema>,
  ) {
    return this.platform.extendTrial(user, id, body.days);
  }

  @Post('tenants/:id/mark-past-due')
  markPastDue(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.platform.markPastDue(user, id);
  }

  @Post('tenants/:id/suspend')
  suspend(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.platform.suspend(user, id);
  }

  @Post('tenants/:id/reactivate')
  reactivate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.platform.reactivate(user, id);
  }

  @Get('tenants/:id/payments')
  listPayments(@Param('id') id: string) {
    return this.platform.listPayments(id);
  }

  @Post('tenants/:id/payments')
  recordPayment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(paymentSchema))
    body: z.infer<typeof paymentSchema>,
  ) {
    return this.platform.recordPayment(user, id, body);
  }

  @Post('tenants/:id/reset-owner-password')
  resetOwnerPassword(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.platform.resetOwnerPassword(user, id);
  }
}
