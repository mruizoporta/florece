import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [TenantModule, WaitlistModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
