import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { SponsorsService } from './sponsors.service';

@ApiTags('sponsors')
@ApiBearerAuth()
@Controller('v1/sponsors')
@Roles('Admin')
@UseGuards(FeatureGuard)
@RequireFeature('sponsors')
export class SponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  @Get()
  list() {
    return this.sponsorsService.list();
  }

  @Get(':id')
  show(@Param('id') id: string) {
    return this.sponsorsService.get(BigInt(id));
  }

  @Post()
  create(@Body() body: { name: string; image: string }) {
    return this.sponsorsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; image?: string },
  ) {
    return this.sponsorsService.update(BigInt(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sponsorsService.softDelete(BigInt(id));
  }
}
