import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { PromotionsController, PublicPromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
  imports: [TenantModule, EntitlementsModule],
  controllers: [PublicPromotionsController, PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
