import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  imports: [TenantModule],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}
