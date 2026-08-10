import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { ImagesService } from './images.service';

@ApiTags('images')
@ApiBearerAuth()
@Controller('v1/images')
@Roles('Admin')
@UseGuards(FeatureGuard)
@RequireFeature('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get()
  list(@Query('product_id') productId?: string) {
    return this.imagesService.list(
      productId ? BigInt(productId) : undefined,
    );
  }

  @Get(':id')
  show(@Param('id') id: string) {
    return this.imagesService.get(BigInt(id));
  }

  @Post()
  create(
    @Body()
    body: { product_id: number; image: string; order: number },
  ) {
    return this.imagesService.create({
      productId: body.product_id,
      image: body.image,
      order: body.order,
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { image?: string; order?: number },
  ) {
    return this.imagesService.update(BigInt(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.imagesService.remove(BigInt(id));
  }
}
