import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('v1/reports')
@UseGuards(FeatureGuard)
@RequireFeature('pos')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** Ventas, servicios, productos, equipo, citas y clientas del período, comparado con el anterior. */
  @Roles('Admin')
  @Get('overview')
  overview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.overview(from, to);
  }
}
