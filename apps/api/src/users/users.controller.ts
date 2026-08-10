import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('v1/users')
@Roles('Admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query('search') search?: string, @Query('limit') limit?: string) {
    return this.usersService.listUsers(search, limit ? Number(limit) : 50);
  }

  @Get(':id')
  show(@Param('id') id: string) {
    return this.usersService.getUser(BigInt(id));
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      roles?: string[];
      employee_id?: number | null;
      employeeId?: number | null;
    },
  ) {
    return this.usersService.createUser({
      name: body.name,
      email: body.email,
      password: body.password,
      roles: body.roles,
      employeeId: body.employee_id ?? body.employeeId,
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      image?: string;
      employee_id?: number | null;
      employeeId?: number | null;
    },
  ) {
    return this.usersService.updateUser(BigInt(id), {
      name: body.name,
      email: body.email,
      image: body.image,
      employeeId:
        body.employee_id !== undefined
          ? body.employee_id
          : body.employeeId,
    });
  }

  @Patch(':id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    return this.usersService.resetPassword(BigInt(id), body.password);
  }

  @Patch(':id/roles')
  syncRoles(
    @Param('id') id: string,
    @Body() body: { roles: string[] },
  ) {
    return this.usersService.syncUserRoles(BigInt(id), body.roles ?? []);
  }
}
