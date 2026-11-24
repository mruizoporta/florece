import { Module } from '@nestjs/common';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { TenantModule } from '../tenant/tenant.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentRemindersService } from './appointment-reminders.service';
import { AppointmentsGateway } from './appointments.gateway';
import { AppointmentsService } from './appointments.service';
import { AppointmentPushService } from './appointment-push.service';
import { PushModule } from '../push/push.module';

@Module({
  imports: [TenantModule, AuthModule, MailModule, WaitlistModule, PushModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsGateway, AppointmentRemindersService, AppointmentPushService],
})
export class AppointmentsModule {}
