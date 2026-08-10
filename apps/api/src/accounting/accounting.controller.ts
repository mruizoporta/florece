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
import { RoleName } from '@florece/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import type { AuthUser } from '../common/types/auth.types';
import { AccountingService } from './accounting.service';

@ApiTags('accounting')
@ApiBearerAuth()
@Controller('v1/accounting')
@UseGuards(FeatureGuard)
@RequireFeature('accounting')
export class AccountingController {
  constructor(private readonly accounting: AccountingService) {}

  @Get('expense-categories')
  @Roles(RoleName.Admin, RoleName.Cajero)
  listCategories() {
    return this.accounting.listCategories();
  }

  @Post('expense-categories')
  @Roles(RoleName.Admin)
  createCategory(@Body() body: { name: string; slug?: string }) {
    return this.accounting.createCategory(body);
  }

  @Get('expenses')
  @Roles(RoleName.Admin, RoleName.Cajero)
  listExpenses(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accounting.listExpenses(
      from,
      to,
      limit ? Number(limit) : 100,
    );
  }

  @Post('expenses')
  @Roles(RoleName.Admin, RoleName.Cajero)
  createExpense(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      categoryId: number;
      amount: number;
      currency?: string;
      method: string;
      spentAt?: string;
      note?: string;
      receiptUrl?: string;
    },
  ) {
    return this.accounting.createExpense(user.id, body);
  }

  @Patch('expenses/:id')
  @Roles(RoleName.Admin)
  updateExpense(
    @Param('id') id: string,
    @Body()
    body: {
      categoryId?: number;
      amount?: number;
      currency?: string;
      method?: string;
      spentAt?: string;
      note?: string | null;
      receiptUrl?: string | null;
    },
  ) {
    return this.accounting.updateExpense(BigInt(id), body);
  }

  @Delete('expenses/:id')
  @Roles(RoleName.Admin)
  deleteExpense(@Param('id') id: string) {
    return this.accounting.deleteExpense(BigInt(id));
  }

  @Get('cash-sessions/current')
  @Roles(RoleName.Admin, RoleName.Cajero)
  currentSession() {
    return this.accounting.getCurrentCashSession();
  }

  @Get('cash-sessions')
  @Roles(RoleName.Admin, RoleName.Cajero)
  listSessions(@Query('limit') limit?: string) {
    return this.accounting.listCashSessions(limit ? Number(limit) : 30);
  }

  @Post('cash-sessions/open')
  @Roles(RoleName.Admin, RoleName.Cajero)
  openSession(
    @CurrentUser() user: AuthUser,
    @Body() body: { openingFloat?: number; note?: string },
  ) {
    return this.accounting.openCashSession(
      user.id,
      body.openingFloat ?? 0,
      body.note,
    );
  }

  @Post('cash-sessions/:id/close')
  @Roles(RoleName.Admin, RoleName.Cajero)
  closeSession(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { countedCash: number; note?: string },
  ) {
    return this.accounting.closeCashSession(
      user.id,
      BigInt(id),
      body.countedCash,
      body.note,
    );
  }

  @Get('profit-summary')
  @Roles(RoleName.Admin, RoleName.Cajero)
  profitSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.accounting.profitSummary(from, to);
  }
}
