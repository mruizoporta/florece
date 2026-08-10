import { Module } from '@nestjs/common';
import { TenantContext } from './tenant.context';
import { TenantService } from './tenant.service';

@Module({
  providers: [TenantService, TenantContext],
  exports: [TenantService, TenantContext],
})
export class TenantModule {}
