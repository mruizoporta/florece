import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TenantModule } from '../tenant/tenant.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_TTL', '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
    TenantModule,
    forwardRef(() => OrganizationsModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OnboardingService],
  exports: [AuthService, JwtModule, OnboardingService],
})
export class AuthModule {}
