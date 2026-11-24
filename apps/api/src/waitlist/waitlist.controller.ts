import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { WaitlistService, type WaitlistInput } from './waitlist.service';

@ApiTags('waitlist')
@Controller('v1/waitlist')
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistService) {}

  /** Desde la reserva web: «Avisame si se libera». */
  @Public()
  @Post('public')
  join(@Body() body: WaitlistInput) {
    return this.waitlist.add(body ?? {}, 'web');
  }

  @Post()
  @ApiBearerAuth()
  @Roles('Admin', 'Recepcionista')
  add(@Body() body: WaitlistInput) {
    return this.waitlist.add(body ?? {}, 'panel');
  }

  @Get()
  @ApiBearerAuth()
  @Roles('Admin', 'Recepcionista')
  list() {
    return this.waitlist.list();
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles('Admin', 'Recepcionista')
  setStatus(@Param('id') id: string, @Body() body: { status?: string }) {
    return this.waitlist.setStatus(BigInt(id), String(body?.status ?? ''));
  }
}
