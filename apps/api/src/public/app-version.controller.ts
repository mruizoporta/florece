import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { timingSafeEqual } from 'crypto';
import { Public, SkipTenant } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PrismaService } from '../prisma/prisma.service';
import {
  appVersionsSettingSchema,
  readAppVersions,
  saveAppVersions,
  type AppVersionsSetting,
} from './app-versions';

/** Tiendas de Florece (la app abre estas páginas para actualizar). */
const STORE_URL = {
  ios: 'https://apps.apple.com/app/id6831328690',
  android: 'https://play.google.com/store/apps/details?id=com.florece.app',
} as const;

/**
 * Qué versión de la app móvil se exige en cada tienda.
 * - `minimum`: por debajo, la app se bloquea hasta que actualicen.
 * - `latest`: por debajo, la app sugiere actualizar (se puede cerrar).
 * Se cambian desde SupportFlow (Productos → Florece → Versiones de la app).
 */
@ApiTags('public')
@Controller('public/app-version')
export class AppVersionController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @SkipTenant()
  @Get()
  async get() {
    const v = await readAppVersions(this.prisma);
    return {
      ios: { ...v.ios, storeUrl: STORE_URL.ios },
      android: { ...v.android, storeUrl: STORE_URL.android },
    };
  }
}

/** Lo mismo, pero para que SupportFlow lo lea y lo cambie (X-Platform-Key). */
@Controller('platform/bridge/app-version')
@Public()
@SkipTenant()
export class AppVersionBridgeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  get(@Headers('x-platform-key') key?: string) {
    this.assertKey(key);
    return readAppVersions(this.prisma);
  }

  @Post()
  @HttpCode(200)
  save(
    @Headers('x-platform-key') key: string | undefined,
    @Body(new ZodValidationPipe(appVersionsSettingSchema)) body: AppVersionsSetting,
  ) {
    this.assertKey(key);
    return saveAppVersions(this.prisma, body);
  }

  private assertKey(provided: string | undefined) {
    const expected = this.config.get<string>('SUPPORT_BRIDGE_KEY')?.trim();
    if (!expected) throw new ServiceUnavailableException('Puente de plataforma sin configurar');
    const a = Buffer.from(expected);
    const b = Buffer.from((provided ?? '').trim());
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Clave de plataforma inválida');
    }
  }
}
