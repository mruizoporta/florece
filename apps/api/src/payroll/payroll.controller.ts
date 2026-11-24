import {
  UseGuards,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@florece/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireFeature } from '../common/decorators/feature.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import type { AuthUser } from '../common/types/auth.types';
import { PayrollService } from './payroll.service';

@ApiTags('payroll')
@ApiBearerAuth()
@Controller('v1/payroll')
@UseGuards(FeatureGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  /** Stylist floor: what I logged today + running commission. */
  @Roles('Admin', 'Cajero', 'Estilista')
  @Get('my-day')
  myDay(@CurrentUser() user: AuthUser, @Query('date') date?: string) {
    if (user.employeeId == null) {
      throw new ForbiddenException(
        'Tu usuario no está vinculado a un profesional del equipo',
      );
    }
    return this.payrollService.myDay(user.employeeId, date);
  }

  @Roles('Admin', 'Cajero')
  @RequireFeature('accounting')
  @Get('summary')
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.payrollService.summary(from, to);
  }

  @Roles('Admin', 'Cajero', 'Estilista')
  @RequireFeature('accounting')
  @Get('employees/:id')
  employeeDetail(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const employeeId = BigInt(id);
    const stylistOnly =
      user.roles.includes(RoleName.Estilista) &&
      !user.roles.includes(RoleName.Admin) &&
      !user.roles.includes(RoleName.Cajero);

    if (stylistOnly) {
      if (user.employeeId == null || user.employeeId !== employeeId) {
        throw new ForbiddenException('Solo podés ver tu propia comisión');
      }
    }

    return this.payrollService.employeeDetail(employeeId, from, to);
  }

  @Roles('Admin')
  @RequireFeature('accounting')
  @Get('employees/:id/payments')
  listPayments(@Param('id') id: string) {
    return this.payrollService.listPayments(BigInt(id));
  }

  @Roles('Admin')
  @RequireFeature('accounting')
  @Post('employees/:id/payments')
  createPayment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      from: string;
      to: string;
      bonus?: number;
      deduction?: number;
      method: string;
      note?: string;
    },
  ) {
    return this.payrollService.createPayment(user.id, BigInt(id), body);
  }

  @Roles('Admin')
  @RequireFeature('accounting')
  @Post('employees/:id/advances')
  createAdvance(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { amount: number; method: string; note?: string },
  ) {
    return this.payrollService.createAdvance(user.id, BigInt(id), body);
  }

  @Roles('Admin')
  @RequireFeature('accounting')
  @Get('payments/:paymentId')
  getPayment(@Param('paymentId') paymentId: string) {
    return this.payrollService.getPayment(BigInt(paymentId));
  }

  @Roles('Admin')
  @RequireFeature('accounting')
  @Patch('payments/:paymentId/cancel')
  cancelPayment(@Param('paymentId') paymentId: string) {
    return this.payrollService.cancelPayment(BigInt(paymentId));
  }
}
