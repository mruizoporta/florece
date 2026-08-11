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
@Roles('Admin', 'Cajero', 'Estilista')
@UseGuards(FeatureGuard)
@RequireFeature('pos')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('reports/summary')
  @Roles('Admin', 'Cajero')
  reportSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ordersService.reportSummary(from, to);
  }

  @Get('reports/payments')
  @Roles('Admin', 'Cajero')
  reportPayments(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ordersService.reportPayments(from, to);
  }

  @Get('reports/products')
  @Roles('Admin', 'Cajero')
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

  @Get('open-sheets')
  openSheets(@Query('limit') limit?: string) {
    return this.ordersService.listOpenSheetsToday(
      limit ? Number(limit) : 40,
    );
  }

  @Post('open-sheet')
  openSheet(
    @Body()
    body: {
      name: string;
      customer_id?: number;
      employee_id?: number;
      customerId?: number;
      employeeId?: number;
    },
  ) {
    return this.ordersService.findOrOpenSheet({
      name: body.name,
      customerId: body.customer_id ?? body.customerId,
      employeeId: body.employee_id ?? body.employeeId,
    });
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

  @Get(':id/consumables')
  @Roles('Admin', 'Cajero')
  previewConsumables(@Param('id') id: string) {
    return this.ordersService.previewConsumables(BigInt(id));
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
      employee_id?: number;
      employeeId?: number;
    },
  ) {
    return this.ordersService.addItem(BigInt(id), {
      itemId: body.item_id,
      productId: body.product_id,
      quantity: body.quantity,
      employeeId: body.employee_id ?? body.employeeId,
    });
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body()
    body: {
      quantity?: number;
      line_discount?: number;
      employee_id?: number | null;
      employeeId?: number | null;
    },
  ) {
    return this.ordersService.updateItem(BigInt(id), BigInt(itemId), {
      quantity: body.quantity,
      line_discount: body.line_discount,
      employeeId:
        body.employee_id !== undefined
          ? body.employee_id
          : body.employeeId,
    });
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.ordersService.removeItem(BigInt(id), BigInt(itemId));
  }

  @Patch(':id/payments')
  @Roles('Admin', 'Cajero')
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
  @Roles('Admin', 'Cajero')
  finalize(
    @Param('id') id: string,
    @Body()
    body: {
      consumables?: Array<{
        product_id?: number;
        productId?: number;
        quantity: number;
      }>;
      consumables_reason?: string;
      consumablesReason?: string;
    },
  ) {
    const consumables = body.consumables?.map((row) => ({
      productId: Number(row.product_id ?? row.productId),
      quantity: Number(row.quantity),
    }));
    return this.ordersService.finalize(BigInt(id), {
      consumables,
      consumablesReason: body.consumables_reason ?? body.consumablesReason,
    });
  }

  @Patch(':id/cancel')
  @Roles('Admin', 'Cajero')
  cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.ordersService.cancel(BigInt(id), body.reason);
  }
}
