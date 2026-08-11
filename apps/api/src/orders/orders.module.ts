import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [TenantModule, EntitlementsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
