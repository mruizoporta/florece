import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TenantModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
