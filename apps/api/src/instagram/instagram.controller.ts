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
import { InstagramService } from './instagram.service';

@ApiTags('instagram')
@ApiBearerAuth()
@Controller('v1/instagram-feeds')
@Roles('Admin')
@UseGuards(FeatureGuard)
@RequireFeature('instagram')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get()
  list() {
    return this.instagramService.list();
  }

  @Get(':id')
  show(@Param('id') id: string) {
    return this.instagramService.get(BigInt(id));
  }

  @Post()
  create(@Body() body: { content: string }) {
    return this.instagramService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { content?: string },
  ) {
    return this.instagramService.update(BigInt(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.instagramService.softDelete(BigInt(id));
  }
}
