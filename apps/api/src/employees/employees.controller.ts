import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { EmployeesService } from './employees.service';

@ApiTags('employees')
@Controller('v1/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Public()
  @Get('public')
  getPublic() {
    return this.employeesService.getPublicEmployees();
  }

  @Get()
  @ApiBearerAuth()
  @Roles('Admin', 'Recepcionista', 'Cajero')
  list(
    @Query('search') search?: string,
    @Query('include_archived') includeArchived?: string,
    @Query('limit') limit?: string,
  ) {
    return this.employeesService.listEmployees(
      search,
      includeArchived === 'true',
      limit ? Number(limit) : 50,
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles('Admin', 'Recepcionista', 'Cajero')
  show(@Param('id') id: string) {
    return this.employeesService.getEmployee(BigInt(id));
  }

  @Post()
  @ApiBearerAuth()
  @Roles('Admin')
  create(
    @Body()
    body: {
      name: string;
      description: string;
      image: string;
      status?: boolean;
      phone?: string;
      email?: string;
    },
  ) {
    return this.employeesService.createEmployee(body);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles('Admin')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name: string;
      description: string;
      image: string;
      status: boolean;
      phone?: string;
      email?: string;
    },
  ) {
    return this.employeesService.updateEmployee(BigInt(id), body);
  }

  @Patch(':id/archive')
  @ApiBearerAuth()
  @Roles('Admin')
  archive(@Param('id') id: string) {
    return this.employeesService.archiveEmployee(BigInt(id));
  }

  @Get(':id/schedule')
  @ApiBearerAuth()
  @Roles('Admin')
  getSchedule(@Param('id') id: string) {
    return this.employeesService.getSchedule(BigInt(id));
  }

  @Patch(':id/socials')
  @ApiBearerAuth()
  @Roles('Admin')
  syncSocials(
    @Param('id') id: string,
    @Body()
    body: {
      socials: Array<{ socialId: number; href: string }>;
    },
  ) {
    return this.employeesService.syncSocials(
      BigInt(id),
      body.socials ?? [],
    );
  }

  @Put(':id/schedule')
  @ApiBearerAuth()
  @Roles('Admin')
  replaceSchedule(
    @Param('id') id: string,
    @Body()
    body: {
      schedule: Array<{
        weekday: number;
        start_time: string;
        end_time: string;
        status?: boolean;
      }>;
    },
  ) {
    return this.employeesService.replaceSchedule(
      BigInt(id),
      body.schedule ?? [],
    );
  }
}
