import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { TenantModule } from '../tenant/tenant.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [TenantModule, MailModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
