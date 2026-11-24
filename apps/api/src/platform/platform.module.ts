import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { SupportBridgeController } from './support-bridge.controller';
import { SupportBridgeService } from './support-bridge.service';

@Module({
  imports: [AuthModule, OrganizationsModule],
  controllers: [PlatformController, SupportBridgeController],
  providers: [PlatformService, SupportBridgeService],
})
export class PlatformModule {}
