import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import type { AuthUser } from '../common/types/auth.types';
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
  @Roles('Admin', 'Cajero', 'Estilista', 'Recepcionista')
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
      duration_time?: number;
      durationTime?: number;
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
      durationTime: body.duration_time ?? body.durationTime ?? 30,
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
      duration_time?: number;
      durationTime?: number;
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
      durationTime: body.duration_time ?? body.durationTime ?? 30,
    });
  }

  @Patch('services/:id/archive')
  @ApiBearerAuth()
  @Roles('Admin')
  archiveService(@Param('id') id: string) {
    return this.catalogService.archiveService(BigInt(id));
  }

  @Get('services/:id/consumables')
  @ApiBearerAuth()
  @Roles('Admin', 'Cajero')
  @UseGuards(FeatureGuard)
  @RequireFeature('service_consumables')
  listConsumables(@Param('id') id: string) {
    return this.catalogService.listServiceConsumables(BigInt(id));
  }

  @Put('services/:id/consumables')
  @ApiBearerAuth()
  @Roles('Admin')
  @UseGuards(FeatureGuard)
  @RequireFeature('service_consumables')
  setConsumables(
    @Param('id') id: string,
    @Body()
    body: {
      items?: Array<{
        product_id?: number;
        productId?: number;
        quantity: number;
      }>;
    },
  ) {
    const items = (body.items ?? []).map((row) => ({
      productId: Number(row.product_id ?? row.productId),
      quantity: Number(row.quantity),
    }));
    return this.catalogService.setServiceConsumables(BigInt(id), items);
  }

  @Get('products/low-stock')
  @ApiBearerAuth()
  @Roles('Admin', 'Cajero')
  lowStock(@Query('limit') limit?: string) {
    return this.catalogService.listLowStock(limit ? Number(limit) : 50);
  }

  @Get('products')
  @ApiBearerAuth()
  @Roles('Admin', 'Cajero')
  listProducts(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('low') low?: string,
    @Query('for') forUse?: string,
  ) {
    const scope =
      forUse === 'sale' || forUse === 'recipe' || forUse === 'all'
        ? forUse
        : 'all';
    return this.catalogService.listProducts(
      search,
      limit ? Number(limit) : 50,
      low === '1' || low === 'true',
      scope,
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
      min_stock?: number;
      minStock?: number;
      usage?: string;
      unit?: string;
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
      minStock: body.min_stock ?? body.minStock,
      usage: body.usage,
      unit: body.unit,
    });
  }

  @Patch('products/:id')
  @ApiBearerAuth()
  @Roles('Admin')
  updateProduct(
    @CurrentUser() user: AuthUser,
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
      stock?: number;
      min_stock?: number;
      minStock?: number;
      usage?: string;
      unit?: string;
    },
  ) {
    return this.catalogService.updateProduct(
      BigInt(id),
      {
        categoryId: body.category_id,
        name: body.name,
        slug: body.slug,
        price: body.price,
        description: body.description,
        image: body.image,
        status: body.status,
        stock: body.stock,
        minStock: body.min_stock ?? body.minStock,
        usage: body.usage,
        unit: body.unit,
      },
      user.id,
    );
  }

  @Patch('products/:id/archive')
  @ApiBearerAuth()
  @Roles('Admin')
  archiveProduct(@Param('id') id: string) {
    return this.catalogService.archiveProduct(BigInt(id));
  }

  @Post('products/:id/adjust')
  @ApiBearerAuth()
  @Roles('Admin', 'Cajero')
  adjustStock(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      delta: number;
      reason?: string;
      type?: string;
    },
  ) {
    return this.catalogService.adjustProductStock(
      BigInt(id),
      {
        delta: body.delta,
        reason: body.reason,
        type: body.type,
      },
      user.id,
    );
  }

  @Get('products/:id/movements')
  @ApiBearerAuth()
  @Roles('Admin', 'Cajero')
  productMovements(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.listProductMovements(
      BigInt(id),
      limit ? Number(limit) : 40,
    );
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
