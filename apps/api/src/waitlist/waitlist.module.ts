import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { TenantModule } from '../tenant/tenant.module';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';

@Module({
  imports: [TenantModule, MailModule],
  controllers: [WaitlistController],
  providers: [WaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}
