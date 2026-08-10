import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';

@Module({
  imports: [TenantModule],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}
