import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, SkipTenant } from '../common/decorators/public.decorator';
import { RequireFeature } from '../common/decorators/feature.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { billingRegionOf } from '../common/date';
import { TenantContext } from '../tenant/tenant.context';
import { FeedbackService } from './feedback.service';

@ApiTags('feedback')
@Controller()
@UseGuards(FeatureGuard)
export class FeedbackController {
  constructor(
    private readonly feedback: FeedbackService,
    private readonly tenantContext: TenantContext,
  ) {}

  @RequireFeature('pos')
  @Get('v1/feedback')
  @ApiBearerAuth()
  @Roles('Admin')
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    const tenant = this.tenantContext.getTenant();
    return this.feedback.summary(tenant.id, billingRegionOf(tenant), from, to);
  }

  /** Link de encuesta para mandar por WhatsApp desde la cita o el ticket. */
  @RequireFeature('pos')
  @Post('v1/feedback/request')
  @ApiBearerAuth()
  @Roles('Admin', 'Recepcionista', 'Cajero')
  async request(@Body() body: { appointment_id?: number; order_id?: number }) {
    const tenant = this.tenantContext.getTenant();
    const { feedback, phone } = await this.feedback.requestFor(
      tenant.id,
      {
        appointmentId: body?.appointment_id ? BigInt(body.appointment_id) : undefined,
        orderId: body?.order_id ? BigInt(body.order_id) : undefined,
      },
      'whatsapp',
    );
    return {
      path: `/s/${tenant.slug}/opinion/${feedback.token}`,
      answered: feedback.answeredAt != null,
      customerName: feedback.customerName,
      phone,
    };
  }

  @Public()
  @SkipTenant()
  @Get('public/feedback/:token')
  getPublic(@Param('token') token: string) {
    return this.feedback.getPublic(token);
  }

  @Public()
  @SkipTenant()
  @Post('public/feedback/:token')
  answer(@Param('token') token: string, @Body() body: { rating?: number; comment?: string | null }) {
    return this.feedback.answer(token, body ?? {});
  }

  @Public()
  @SkipTenant()
  @Post('public/feedback/:token/review-click')
  reviewClick(@Param('token') token: string) {
    return this.feedback.markReviewClick(token);
  }
}
