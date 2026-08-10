import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SerializeInterceptor } from './common/interceptors/serialize.interceptor';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { EmployeesModule } from './employees/employees.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { OrdersModule } from './orders/orders.module';
import { BillingModule } from './billing/billing.module';
import { SettingsModule } from './settings/settings.module';
import { DemoModule } from './demo/demo.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { SponsorsModule } from './sponsors/sponsors.module';
import { InstagramModule } from './instagram/instagram.module';
import { ImagesModule } from './images/images.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PlatformModule } from './platform/platform.module';
import { EntitlementsModule } from './entitlements/entitlements.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AccountingModule } from './accounting/accounting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EntitlementsModule,
    TenantModule,
    OrganizationsModule,
    AuthModule,
    CatalogModule,
    EmployeesModule,
    AppointmentsModule,
    OrdersModule,
    BillingModule,
    SettingsModule,
    DemoModule,
    UsersModule,
    CustomersModule,
    SponsorsModule,
    InstagramModule,
    ImagesModule,
    DashboardModule,
    PlatformModule,
    AccountingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: SubscriptionGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SerializeInterceptor },
  ],
})
export class AppModule {}
