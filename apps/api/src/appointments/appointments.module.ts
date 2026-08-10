import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsGateway } from './appointments.gateway';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsGateway],
})
export class AppointmentsModule {}
