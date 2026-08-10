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
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('v1/orders')
@Roles('Admin', 'Cajero')
@UseGuards(FeatureGuard)
@RequireFeature('pos')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('reports/summary')
  reportSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ordersService.reportSummary(from, to);
  }

  @Get('reports/payments')
  reportPayments(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ordersService.reportPayments(from, to);
  }

  @Get('reports/products')
  reportProducts(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ordersService.reportProducts(from, to);
  }

  @Get()
  index(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.listOrders(
      search,
      status,
      limit ? Number(limit) : 50,
    );
  }

  @Post()
  create(
    @Body()
    body: {
      customer_id?: number;
      employee_id?: number;
      name: string;
    },
  ) {
    return this.ordersService.createOrder({
      customerId: body.customer_id,
      employeeId: body.employee_id,
      name: body.name,
    });
  }

  @Get(':id')
  show(@Param('id') id: string) {
    return this.ordersService.getOrder(BigInt(id));
  }

  @Post(':id/items')
  addItem(
    @Param('id') id: string,
    @Body()
    body: {
      item_id?: number;
      product_id?: number;
      quantity: number;
    },
  ) {
    return this.ordersService.addItem(BigInt(id), {
      itemId: body.item_id,
      productId: body.product_id,
      quantity: body.quantity,
    });
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { quantity: number; line_discount?: number },
  ) {
    return this.ordersService.updateItem(
      BigInt(id),
      BigInt(itemId),
      body,
    );
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.ordersService.removeItem(BigInt(id), BigInt(itemId));
  }

  @Patch(':id/payments')
  syncPayments(
    @Param('id') id: string,
    @Body()
    body: {
      payments: Array<{
        method: string;
        amount: number;
        reference?: string;
        paid_at?: string;
      }>;
    },
  ) {
    return this.ordersService.syncPayments(BigInt(id), body.payments ?? []);
  }

  @Patch(':id/finalize')
  finalize(@Param('id') id: string) {
    return this.ordersService.finalize(BigInt(id));
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.ordersService.cancel(BigInt(id), body.reason);
  }
}
