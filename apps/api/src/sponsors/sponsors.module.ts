import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { SponsorsController } from './sponsors.controller';
import { SponsorsService } from './sponsors.service';

@Module({
  imports: [TenantModule],
  controllers: [SponsorsController],
  providers: [SponsorsService],
})
export class SponsorsModule {}
