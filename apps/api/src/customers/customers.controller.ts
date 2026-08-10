import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth.types';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('v1')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('customers')
  @Roles('Admin', 'Recepcionista', 'Cajero')
  list(@Query('search') search?: string, @Query('limit') limit?: string) {
    return this.customersService.listCustomers(search, limit ? Number(limit) : 50);
  }

  @Get('customers/:id')
  @Roles('Admin', 'Recepcionista', 'Cajero')
  show(@Param('id') id: string) {
    return this.customersService.getCustomer(BigInt(id));
  }

  @Get('me/appointments')
  @Roles('Customer', 'Admin')
  myAppointments(@CurrentUser() user: AuthUser) {
    return this.customersService.getMyAppointments(user.id);
  }

  @Patch('me/appointments/:id/cancel')
  @Roles('Customer', 'Admin')
  cancelMyAppointment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.customersService.cancelMyAppointment(user.id, BigInt(id));
  }
}
