import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { InstagramController } from './instagram.controller';
import { InstagramService } from './instagram.service';

@Module({
  imports: [TenantModule],
  controllers: [InstagramController],
  providers: [InstagramService],
})
export class InstagramModule {}
