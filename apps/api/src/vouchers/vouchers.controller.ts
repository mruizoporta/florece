import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireFeature } from '../common/decorators/feature.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import type { AuthUser } from '../common/types/auth.types';
import { VouchersService, type SellVoucherInput } from './vouchers.service';

@ApiTags('vouchers')
@ApiBearerAuth()
@Controller('v1/vouchers')
@Roles('Admin', 'Cajero')
@UseGuards(FeatureGuard)
@RequireFeature('pos')
export class VouchersController {
  constructor(private readonly vouchers: VouchersService) {}

  @Get()
  list() {
    return this.vouchers.list();
  }

  /** Antes de `:id` para que «code» no se lea como id. */
  @Get('code/:code')
  @Roles('Admin', 'Cajero', 'Estilista')
  lookup(@Param('code') code: string) {
    return this.vouchers.lookup(code);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.vouchers.get(BigInt(id));
  }

  @Post()
  sell(@Body() body: SellVoucherInput, @CurrentUser() user: AuthUser) {
    return this.vouchers.sell(body ?? {}, BigInt(user.id));
  }

  @Patch(':id/cancel')
  @Roles('Admin')
  cancel(@Param('id') id: string) {
    return this.vouchers.cancel(BigInt(id));
  }
}
