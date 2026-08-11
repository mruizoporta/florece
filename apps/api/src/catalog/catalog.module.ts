import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [TenantModule, EntitlementsModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
