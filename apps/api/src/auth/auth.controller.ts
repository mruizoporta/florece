import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  loginSchema,
  registerSalonSchema,
  type LoginInput,
  type RegisterSalonInput,
} from '@florece/shared';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public, SkipTenant } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../common/types/auth.types';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @SkipTenant()
  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body);
    res.cookie(
      this.authService.getRefreshCookieName(),
      result.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );
    const { refreshToken: _rt, ...rest } = result;
    return rest;
  }

  @Public()
  @SkipTenant()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[this.authService.getRefreshCookieName()] as
      | string
      | undefined;
    const result = await this.authService.refresh(token);
    res.cookie(
      this.authService.getRefreshCookieName(),
      result.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );
    const { refreshToken: _rt, ...rest } = result;
    return rest;
  }

  @Public()
  @SkipTenant()
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[this.authService.getRefreshCookieName()] as
      | string
      | undefined;
    await this.authService.logout(token);
    res.clearCookie(this.authService.getRefreshCookieName(), {
      path: '/',
    });
    return { message: 'Logged out' };
  }

  @Get('me')
  @ApiBearerAuth()
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id, user.tenantId);
  }

  @Get('branches')
  @ApiBearerAuth()
  async branches(@CurrentUser() user: AuthUser) {
    return this.authService.listBranches(user.id);
  }

  @Post('switch-branch')
  @ApiBearerAuth()
  async switchBranch(
    @CurrentUser() user: AuthUser,
    @Body() body: { slug?: string; tenantId?: number },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.switchBranch(user, body);
    res.cookie(
      this.authService.getRefreshCookieName(),
      result.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );
    const { refreshToken: _rt, ...rest } = result;
    return rest;
  }

  @Public()
  @SkipTenant()
  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string; tenantSlug: string }) {
    return this.authService.forgotPassword(body.email, body.tenantSlug);
  }

  @Public()
  @SkipTenant()
  @Post('reset-password')
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Public()
  @SkipTenant()
  @Post('register-customer')
  registerCustomer(
    @Body()
    body: {
      tenantSlug: string;
      name: string;
      email: string;
      password: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.registerCustomer(body).then((result) => {
      res.cookie(
        this.authService.getRefreshCookieName(),
        result.refreshToken,
        this.authService.getRefreshCookieOptions(),
      );
      const { refreshToken: _rt, ...rest } = result;
      return rest;
    });
  }

  @Public()
  @SkipTenant()
  @Post('register-salon')
  @UsePipes(new ZodValidationPipe(registerSalonSchema))
  async registerSalon(
    @Body() body: RegisterSalonInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerSalon(body);
    res.cookie(
      this.authService.getRefreshCookieName(),
      result.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );
    const { refreshToken: _rt, ...rest } = result;
    return rest;
  }
}
