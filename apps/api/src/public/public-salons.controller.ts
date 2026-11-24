import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipTenant } from '../common/decorators/public.decorator';
import { PublicSalonsService } from './public-salons.service';

@ApiTags('public')
@Controller('public/salons')
export class PublicSalonsController {
  constructor(private readonly publicSalons: PublicSalonsService) {}

  @Public()
  @SkipTenant()
  @Get()
  search(@Query('q') q?: string) {
    return this.publicSalons.search(q);
  }
}
