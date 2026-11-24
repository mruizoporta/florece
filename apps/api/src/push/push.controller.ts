import { BadRequestException, Body, Controller, NotFoundException, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, SkipTenant } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { isPushToken, PushService } from './push.service';

function token(body: { token?: unknown }): string {
  if (!isPushToken(body?.token)) throw new BadRequestException('Token push inválido');
  return body.token;
}

@ApiTags('push')
@ApiBearerAuth()
@Controller('v1/push')
export class PushController {
  constructor(
    private readonly push: PushService,
    private readonly prisma: PrismaService,
  ) {}

  /** Cualquier usuario del salón con sesión: recibe los avisos de su rol. */
  @Post('staff')
  async registerStaff(@CurrentUser() user: AuthUser, @Body() body: { token?: string }) {
    await this.push.registerUser(token(body), user.id, user.tenantId);
    return { ok: true };
  }

  @Post('staff/remove')
  async removeStaff(@CurrentUser() user: AuthUser, @Body() body: { token?: string }) {
    await this.push.unregisterUser(token(body), user.id);
    return { ok: true };
  }

  /** La clienta no tiene cuenta: el token de la cita (que solo ella recibió) la identifica. */
  @Public()
  @SkipTenant()
  @Post('appointment')
  async registerAppointment(@Body() body: { token?: string; viewToken?: string }) {
    const viewToken = typeof body?.viewToken === 'string' ? body.viewToken.trim() : '';
    const appt = viewToken
      ? await this.prisma.appointment.findFirst({ where: { viewToken }, select: { id: true, tenantId: true } })
      : null;
    if (!appt) throw new NotFoundException('Cita no encontrada');
    await this.push.registerAppointment(token(body), appt.id, appt.tenantId);
    return { ok: true };
  }
}
