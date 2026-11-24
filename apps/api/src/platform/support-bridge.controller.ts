import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { Public, SkipTenant } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SupportBridgeService } from './support-bridge.service';

const patchSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  planCode: z.string().min(1).max(40).optional(),
  adminNote: z.string().max(2000).nullable().optional(),
});

const createSchema = z.object({
  name: z.string().min(2).max(160),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(2).max(120),
  planCode: z.string().min(1).max(40).optional(),
  adminNote: z.string().max(2000).optional(),
});

const planPatchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  priceUsd: z.number().min(0).max(10000).optional(),
  active: z.boolean().optional(),
});

const actionSchema = z.object({
  action: z.enum(['suspend', 'reactivate', 'past-due', 'extend-trial', 'reset-password']),
  days: z.number().int().min(1).max(365).optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['NIO', 'USD']).optional(),
  method: z.enum(['TRANSFER', 'DEPOSIT', 'CASH', 'OTHER']),
  reference: z.string().max(120).optional(),
  paidAt: z.string().optional(),
  months: z.number().int().min(1).max(36).optional(),
  note: z.string().max(2000).optional(),
  planCode: z.string().min(1).max(40).optional(),
});

@Controller('platform/bridge/clients')
@Public()
@SkipTenant()
export class SupportBridgeController {
  constructor(
    private readonly bridge: SupportBridgeService,
    private readonly config: ConfigService,
  ) {}

  @Get('overview')
  overview(@Headers('x-platform-key') key?: string) {
    this.assertKey(key);
    return this.bridge.overview();
  }

  @Get('plans')
  plans(@Headers('x-platform-key') key?: string) {
    this.assertKey(key);
    return this.bridge.plans();
  }

  @Patch('plans/:code')
  updatePlan(
    @Headers('x-platform-key') key: string | undefined,
    @Param('code') code: string,
    @Body(new ZodValidationPipe(planPatchSchema)) body: z.infer<typeof planPatchSchema>,
  ) {
    this.assertKey(key);
    return this.bridge.updatePlan(code, body);
  }

  @Get()
  list(@Headers('x-platform-key') key?: string) {
    this.assertKey(key);
    return this.bridge.list();
  }

  @Post()
  create(
    @Headers('x-platform-key') key: string | undefined,
    @Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>,
  ) {
    this.assertKey(key);
    return this.bridge.createClient(body);
  }

  @Get(':id')
  getOne(@Headers('x-platform-key') key: string | undefined, @Param('id') id: string) {
    this.assertKey(key);
    return this.bridge.getOne(id);
  }

  @Patch(':id')
  update(
    @Headers('x-platform-key') key: string | undefined,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(patchSchema)) body: z.infer<typeof patchSchema>,
  ) {
    this.assertKey(key);
    return this.bridge.updateClient(id, body);
  }

  @Post(':id/actions')
  action(
    @Headers('x-platform-key') key: string | undefined,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actionSchema)) body: z.infer<typeof actionSchema>,
  ) {
    this.assertKey(key);
    return this.bridge.runAction(id, body.action, body.days);
  }

  @Post(':id/payments')
  payment(
    @Headers('x-platform-key') key: string | undefined,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(paymentSchema)) body: z.infer<typeof paymentSchema>,
  ) {
    this.assertKey(key);
    return this.bridge.recordPayment(id, body);
  }

  private assertKey(provided: string | undefined) {
    const expected = this.config.get<string>('SUPPORT_BRIDGE_KEY')?.trim();
    if (!expected) {
      throw new ServiceUnavailableException('Puente de plataforma sin configurar');
    }
    const got = (provided ?? '').trim();
    const a = Buffer.from(expected);
    const b = Buffer.from(got);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Clave de plataforma inválida');
    }
  }
}
