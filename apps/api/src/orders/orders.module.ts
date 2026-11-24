import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { VouchersController } from '../vouchers/vouchers.controller';
import { VouchersService } from '../vouchers/vouchers.service';

@Module({
  imports: [TenantModule, EntitlementsModule],
  controllers: [OrdersController, VouchersController],
  providers: [OrdersService, VouchersService],
})
export class OrdersModule {}
