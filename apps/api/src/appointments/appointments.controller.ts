import {
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  createAppointmentSchema,
  RoleName,
  type CreateAppointmentInput,
} from '@florece/shared';
import { Public, SkipTenant } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireFeature } from '../common/decorators/feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AppointmentsService } from './appointments.service';
import type { AuthUser } from '../common/types/auth.types';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('v1/appointments')
@UseGuards(FeatureGuard)
@RequireFeature('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Public()
  @Get('available-slots')
  availableSlots(
    @Query('employee_id') employeeId: string,
    @Query('date') date: string,
    @Query('duration_minutes') durationMinutes: string,
  ) {
    return this.appointmentsService.getAvailableSlots(
      BigInt(employeeId),
      date,
      Number(durationMinutes),
    );
  }

  @Roles('Admin', 'Recepcionista', 'Cajero', 'Estilista')
  @Get('statuses')
  listStatuses() {
    return this.appointmentsService.listStatuses();
  }

  @Roles('Admin', 'Recepcionista')
  @Get('stats')
  stats(@Query('date') date?: string) {
    return this.appointmentsService.getStats(date);
  }

  @Roles('Admin', 'Recepcionista')
  @Get('range')
  range(@Query('from') from: string, @Query('to') to: string) {
    return this.appointmentsService.listByRange(from, to);
  }

  @Roles('Admin', 'Recepcionista')
  @Get('search')
  search(@Query('q') q: string, @Query('limit') limit?: string) {
    return this.appointmentsService.search(q, limit ? Number(limit) : 50);
  }

  @Roles('Admin', 'Recepcionista', 'Cajero', 'Estilista')
  @Get()
  index(
    @CurrentUser() user: AuthUser,
    @Query('date') date?: string,
    @Query('status_ids') statusIds?: string,
    @Query('employee_id') employeeId?: string,
  ) {
    const ids = statusIds
      ? statusIds.split(',').map((value) => Number(value.trim()))
      : undefined;

    let scopedEmployeeId: number | undefined;
    const propio = soloSusCitas(user);
    if (propio != null) {
      scopedEmployeeId = propio;
    } else if (employeeId) {
      scopedEmployeeId = Number(employeeId);
    }

    return this.appointmentsService.listByDate(date, ids, scopedEmployeeId);
  }

  @Public()
  @SkipTenant()
  @Get('view/:token')
  viewByToken(@Param('token') token: string) {
    return this.appointmentsService.viewByToken(token);
  }

  @Roles('Admin', 'Recepcionista', 'Cajero', 'Estilista')
  @Get(':id')
  async show(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const detalle = await this.appointmentsService.getAppointmentDetail(
      BigInt(id),
    );
    const propio = soloSusCitas(user);
    if (propio != null && Number(detalle.employeeId) !== propio) {
      throw new NotFoundException('Cita no encontrada');
    }
    return detalle;
  }

  @Public()
  @Post()
  @UsePipes(new ZodValidationPipe(createAppointmentSchema))
  create(@Body() body: CreateAppointmentInput) {
    return this.appointmentsService.create(body);
  }

  @Roles('Admin', 'Recepcionista')
  @Post('simple')
  createSimple(
    @Body()
    body: {
      name: string;
      phone?: string;
      employee_id?: number;
      service_ids: number[];
    },
  ) {
    return this.appointmentsService.createSimple({
      name: body.name,
      phone: body.phone,
      employeeId: body.employee_id,
      serviceIds: body.service_ids,
    });
  }

  @Roles('Admin', 'Recepcionista')
  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body()
    body: { employee_id: number; date: string; time: string },
  ) {
    return this.appointmentsService.reschedule(BigInt(id), {
      employeeId: body.employee_id,
      date: body.date,
      time: body.time,
    });
  }

  @Roles('Admin', 'Recepcionista')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status_id: number },
  ) {
    return this.appointmentsService.updateStatus(
      BigInt(id),
      BigInt(body.status_id),
    );
  }

  @Roles('Admin', 'Recepcionista')
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(BigInt(id));
  }

  @Roles('Admin', 'Recepcionista')
  @Patch(':id/employee')
  changeEmployee(
    @Param('id') id: string,
    @Body() body: { employee_id: number },
  ) {
    return this.appointmentsService.changeEmployee(
      BigInt(id),
      BigInt(body.employee_id),
    );
  }
}

/** Estilista sin rol de agenda: solo ve sus citas. Devuelve su profesional, o null si ve todo. */
function soloSusCitas(user: AuthUser): number | null {
  const soloEstilista =
    user.roles.includes(RoleName.Estilista) &&
    !user.roles.includes(RoleName.Admin) &&
    !user.roles.includes(RoleName.Recepcionista);
  if (!soloEstilista) return null;
  if (user.employeeId == null) {
    throw new ForbiddenException(
      'Tu usuario no está vinculado a un profesional del equipo',
    );
  }
  return Number(user.employeeId);
}
