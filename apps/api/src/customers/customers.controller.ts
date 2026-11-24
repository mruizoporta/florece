import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth.types';
import { CustomersService, type RecordInput } from './customers.service';

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

  /** Antes de `customers/:id` para que «inactive» no se lea como id. */
  @Get('customers/inactive')
  @Roles('Admin', 'Recepcionista')
  inactive(@Query('days') days?: string) {
    const n = Number(days);
    return this.customersService.inactiveCustomers(
      Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 730) : 60,
    );
  }

  @Patch('customers/:id/contacted')
  @Roles('Admin', 'Recepcionista')
  contacted(@Param('id') id: string) {
    return this.customersService.markContacted(BigInt(id));
  }

  @Get('customers/:id')
  @Roles('Admin', 'Recepcionista', 'Cajero')
  show(@Param('id') id: string) {
    return this.customersService.getCustomer(BigInt(id));
  }

  // Ficha técnica: la llenan recepción y las profesionales.
  @Patch('customers/:id/allergies')
  @Roles('Admin', 'Recepcionista', 'Estilista')
  allergies(@Param('id') id: string, @Body() body: { allergies?: string | null }) {
    return this.customersService.setAllergies(BigInt(id), body?.allergies);
  }

  @Get('customers/:id/records')
  @Roles('Admin', 'Recepcionista', 'Estilista')
  records(@Param('id') id: string) {
    return this.customersService.listRecords(BigInt(id));
  }

  @Post('customers/:id/records')
  @Roles('Admin', 'Recepcionista', 'Estilista')
  createRecord(
    @Param('id') id: string,
    @Body() body: RecordInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.saveRecord(BigInt(id), body ?? {}, BigInt(user.id));
  }

  @Patch('customers/:id/records/:recordId')
  @Roles('Admin', 'Recepcionista', 'Estilista')
  updateRecord(
    @Param('id') id: string,
    @Param('recordId') recordId: string,
    @Body() body: RecordInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.saveRecord(
      BigInt(id),
      body ?? {},
      BigInt(user.id),
      BigInt(recordId),
    );
  }

  @Delete('customers/:id/records/:recordId')
  @Roles('Admin', 'Recepcionista')
  deleteRecord(@Param('id') id: string, @Param('recordId') recordId: string) {
    return this.customersService.deleteRecord(BigInt(id), BigInt(recordId));
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
