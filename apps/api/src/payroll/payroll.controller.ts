import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@florece/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth.types';
import { PayrollService } from './payroll.service';

@ApiTags('payroll')
@ApiBearerAuth()
@Controller('v1/payroll')
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
  @Get('summary')
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.payrollService.summary(from, to);
  }

  @Roles('Admin', 'Cajero', 'Estilista')
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
}
