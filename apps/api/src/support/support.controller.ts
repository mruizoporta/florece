import { Body, Controller, Get, Post } from '@nestjs/common';
import { z } from 'zod';
import { SupportService } from './support.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public, SkipTenant } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../common/types/auth.types';

const createTicketSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(5).max(5000),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
});

const createPublicTicketSchema = createTicketSchema.extend({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional(),
});

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get('status')
  @Public()
  @SkipTenant()
  status() {
    return { configured: this.support.isConfigured() };
  }

  /** Ticket desde usuario logueado (admin / panel). */
  @Post('tickets')
  @SkipTenant()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createTicketSchema))
    body: z.infer<typeof createTicketSchema>,
  ) {
    return this.support.createTicket(user, body);
  }

  /** Ticket desde la web pública (landing). */
  @Post('tickets/public')
  @Public()
  @SkipTenant()
  createPublic(
    @Body(new ZodValidationPipe(createPublicTicketSchema))
    body: z.infer<typeof createPublicTicketSchema>,
  ) {
    return this.support.createPublicTicket(body);
  }
}
