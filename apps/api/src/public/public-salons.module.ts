import { Module } from '@nestjs/common';
import { AppVersionBridgeController, AppVersionController } from './app-version.controller';
import { PublicSalonsController } from './public-salons.controller';
import { PublicSalonsService } from './public-salons.service';

@Module({
  controllers: [PublicSalonsController, AppVersionController, AppVersionBridgeController],
  providers: [PublicSalonsService],
})
export class PublicSalonsModule {}
