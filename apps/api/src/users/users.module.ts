import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TenantModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
