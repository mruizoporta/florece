import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [TenantModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
