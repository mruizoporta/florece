import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public, SkipTenant } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth.types';
import { BillingService } from './billing.service';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('account-status')
  @ApiBearerAuth()
  @Roles('Admin', 'Recepcionista', 'Cajero')
  accountStatus(@CurrentUser() user: AuthUser) {
    return this.billingService.accountStatus(user.tenantId);
  }

  @Get()
  @ApiBearerAuth()
  @Roles('Admin')
  getBilling(@CurrentUser() user: AuthUser) {
    return this.billingService.getBillingInfo(user.tenantId);
  }

  @Get('plans')
  @ApiBearerAuth()
  @Roles('Admin')
  listPlans() {
    return this.billingService.listPlans();
  }

  @Get('payments')
  @ApiBearerAuth()
  @Roles('Admin')
  listPayments(@CurrentUser() user: AuthUser) {
    return this.billingService.listTenantPayments(user.tenantId);
  }

  @Post('checkout')
  @ApiBearerAuth()
  @Roles('Admin')
  checkout(
    @CurrentUser() user: AuthUser,
    @Body() body: { plan_slug: string; billing_email?: string },
  ) {
    return this.billingService.createCheckoutSession(
      user.tenantId,
      body.plan_slug,
      body.billing_email,
    );
  }

  @Post('upgrade')
  @ApiBearerAuth()
  @Roles('Admin')
  upgrade(
    @CurrentUser() user: AuthUser,
    @Body() body: { planSlug: string },
  ) {
    return this.billingService.upgrade(user.tenantId, body.planSlug);
  }

  @Post('downgrade')
  @ApiBearerAuth()
  @Roles('Admin')
  downgrade(
    @CurrentUser() user: AuthUser,
    @Body() body: { planSlug: string },
  ) {
    return this.billingService.downgrade(user.tenantId, body.planSlug);
  }

  @Post('portal')
  @ApiBearerAuth()
  @Roles('Admin')
  portal(@CurrentUser() user: AuthUser) {
    return this.billingService.createPortalSession(user.tenantId);
  }

  @Public()
  @SkipTenant()
  @Post('webhook')
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.from('');
    return this.billingService.handleWebhook(rawBody, signature);
  }
}
