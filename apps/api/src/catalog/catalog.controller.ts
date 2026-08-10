import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller('v1/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get('public')
  getPublic() {
    return this.catalogService.getPublicCatalog();
  }

  @Get('services')
  @ApiBearerAuth()
  @Roles('Admin')
  listServices(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.listServices(
      search,
      limit ? Number(limit) : 50,
    );
  }

  @Post('services')
  @ApiBearerAuth()
  @Roles('Admin')
  createService(
    @Body()
    body: {
      category_id: number;
      name: string;
      slug: string;
      price: number;
      description: string;
      image?: string;
      status?: boolean;
      duration_time: number;
    },
  ) {
    return this.catalogService.createService({
      categoryId: body.category_id,
      name: body.name,
      slug: body.slug,
      price: body.price,
      description: body.description,
      image: body.image,
      status: body.status,
      durationTime: body.duration_time,
    });
  }

  @Patch('services/:id')
  @ApiBearerAuth()
  @Roles('Admin')
  updateService(
    @Param('id') id: string,
    @Body()
    body: {
      category_id: number;
      name: string;
      slug: string;
      price: number;
      description: string;
      image?: string;
      status: boolean;
      duration_time: number;
    },
  ) {
    return this.catalogService.updateService(BigInt(id), {
      categoryId: body.category_id,
      name: body.name,
      slug: body.slug,
      price: body.price,
      description: body.description,
      image: body.image,
      status: body.status,
      durationTime: body.duration_time,
    });
  }

  @Patch('services/:id/archive')
  @ApiBearerAuth()
  @Roles('Admin')
  archiveService(@Param('id') id: string) {
    return this.catalogService.archiveService(BigInt(id));
  }

  @Get('products')
  @ApiBearerAuth()
  @Roles('Admin')
  listProducts(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.listProducts(
      search,
      limit ? Number(limit) : 50,
    );
  }

  @Post('products')
  @ApiBearerAuth()
  @Roles('Admin')
  createProduct(
    @Body()
    body: {
      category_id: number;
      name: string;
      slug: string;
      price: number;
      description: string;
      image?: string;
      status?: boolean;
      stock?: number;
    },
  ) {
    return this.catalogService.createProduct({
      categoryId: body.category_id,
      name: body.name,
      slug: body.slug,
      price: body.price,
      description: body.description,
      image: body.image,
      status: body.status,
      stock: body.stock,
    });
  }

  @Patch('products/:id')
  @ApiBearerAuth()
  @Roles('Admin')
  updateProduct(
    @Param('id') id: string,
    @Body()
    body: {
      category_id: number;
      name: string;
      slug: string;
      price: number;
      description: string;
      image?: string;
      status: boolean;
      stock: number;
    },
  ) {
    return this.catalogService.updateProduct(BigInt(id), {
      categoryId: body.category_id,
      name: body.name,
      slug: body.slug,
      price: body.price,
      description: body.description,
      image: body.image,
      status: body.status,
      stock: body.stock,
    });
  }

  @Patch('products/:id/archive')
  @ApiBearerAuth()
  @Roles('Admin')
  archiveProduct(@Param('id') id: string) {
    return this.catalogService.archiveProduct(BigInt(id));
  }

  @Patch('products/:id/stock')
  @ApiBearerAuth()
  @Roles('Admin')
  updateStock(@Param('id') id: string, @Body() body: { stock: number }) {
    return this.catalogService.updateProductStock(BigInt(id), body.stock);
  }

  @Get('categories')
  @ApiBearerAuth()
  @Roles('Admin')
  listCategories() {
    return this.catalogService.listCategories();
  }

  @Post('categories')
  @ApiBearerAuth()
  @Roles('Admin')
  createCategory(@Body() body: { name: string; slug?: string }) {
    return this.catalogService.createCategory(body);
  }

  @Patch('categories/:id')
  @ApiBearerAuth()
  @Roles('Admin')
  updateCategory(
    @Param('id') id: string,
    @Body() body: { name: string; slug?: string },
  ) {
    return this.catalogService.updateCategory(BigInt(id), body);
  }

  @Delete('categories/:id')
  @ApiBearerAuth()
  @Roles('Admin')
  deleteCategory(@Param('id') id: string) {
    return this.catalogService.deleteCategory(BigInt(id));
  }
}
