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
  forgotPasswordSchema,
  loginSchema,
  registerSalonSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterSalonInput,
  type ResetPasswordInput,
} from '@florece/shared';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public, SkipTenant } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../common/types/auth.types';
import { AuthService } from './auth.service';

/** La app móvil no usa cookies: recibe y manda el refresh token en el cuerpo. */
function esMovil(req: Request): boolean {
  return req.headers['x-florece-client'] === 'mobile';
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private entregar<T extends { refreshToken: string }>(req: Request, res: Response, result: T) {
    if (esMovil(req)) return result;
    res.cookie(
      this.authService.getRefreshCookieName(),
      result.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );
    const { refreshToken: _rt, ...rest } = result;
    return rest;
  }

  private tokenDe(req: Request): string | undefined {
    if (esMovil(req)) {
      const token = (req.body as { refreshToken?: unknown } | undefined)?.refreshToken;
      return typeof token === 'string' ? token : undefined;
    }
    return req.cookies?.[this.authService.getRefreshCookieName()] as string | undefined;
  }

  @Public()
  @SkipTenant()
  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body);
    if ('needsSalon' in result) return result;
    return this.entregar(req, res, result);
  }

  @Public()
  @SkipTenant()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.tokenDe(req);
    const result = await this.authService.refresh(token);
    return this.entregar(req, res, result);
  }

  @Public()
  @SkipTenant()
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.tokenDe(req);
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
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.switchBranch(user, body);
    return this.entregar(req, res, result);
  }

  @Public()
  @SkipTenant()
  @Post('forgot-password')
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  forgotPassword(@Body() body: ForgotPasswordInput) {
    return this.authService.forgotPassword(body.email, body.tenantSlug);
  }

  @Public()
  @SkipTenant()
  @Post('reset-password')
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  resetPassword(@Body() body: ResetPasswordInput) {
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
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerSalon(body);
    return this.entregar(req, res, result);
  }
}
