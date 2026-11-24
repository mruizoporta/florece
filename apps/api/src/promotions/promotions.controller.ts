import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RequireFeature } from '../common/decorators/feature.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { PromotionsService, type PromotionInput, type QuoteInput } from './promotions.service';

/** Reserva web: promociones que el salón decidió mostrar (sin sesión; el salón va en X-Tenant-Slug). */
@ApiTags('promotions')
@Controller('v1/promotions/public')
export class PublicPromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  @Public()
  publicList() {
    return this.promotions.publicList();
  }
}

@ApiTags('promotions')
@ApiBearerAuth()
@Controller('v1/promotions')
@Roles('Admin')
@UseGuards(FeatureGuard)
@RequireFeature('pos')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Post('quote')
  @Roles('Admin', 'Cajero', 'Estilista')
  quote(@Body() body: QuoteInput) {
    return this.promotions.quote(body ?? {});
  }

  @Get()
  list() {
    return this.promotions.list();
  }

  @Post()
  create(@Body() body: PromotionInput) {
    return this.promotions.save(body ?? {});
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: PromotionInput) {
    return this.promotions.save(body ?? {}, BigInt(id));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotions.remove(BigInt(id));
  }
}
