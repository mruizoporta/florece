import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  createBranchSchema,
  RoleName,
  type CreateBranchInput,
} from '@florece/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../common/types/auth.types';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Post('branches')
  @Roles(RoleName.Admin)
  @UseGuards(FeatureGuard)
  @RequireFeature('branches')
  createBranch(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createBranchSchema)) body: CreateBranchInput,
  ) {
    return this.organizations.createBranch(user, body);
  }

  @Get('sales-summary')
  @Roles(RoleName.Admin)
  @UseGuards(FeatureGuard)
  @RequireFeature('branches')
  salesSummary(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.organizations.salesSummary(
      user,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('profit-summary')
  @Roles(RoleName.Admin)
  @UseGuards(FeatureGuard)
  @RequireFeature('branches')
  profitSummary(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.organizations.profitSummary(
      user,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
