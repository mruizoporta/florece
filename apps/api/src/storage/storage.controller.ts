import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantContext } from '../tenant/tenant.context';
import { StorageService } from './storage.service';
import type { Response } from 'express';
import { existsSync } from 'fs';

type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@ApiTags('storage')
@Controller('v1/storage')
export class StorageController {
  constructor(
    private readonly storage: StorageService,
    private readonly tenantContext: TenantContext,
  ) {}

  @Post('upload')
  @ApiBearerAuth()
  // Recepción y profesionales suben fotos de antes/después a la ficha técnica.
  @Roles('Admin', 'Recepcionista', 'Estilista')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        kind: {
          type: 'string',
          example: 'logo',
          description:
            'logo | banner | parallax | left | right | items | employees | general',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: UploadedImage | undefined,
    @Body('kind') kind?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Adjuntá una imagen (campo file)');
    }
    const tenant = this.tenantContext.getTenant();
    const saved = await this.storage.saveTenantImage({
      tenantSlug: tenant.slug,
      kind: kind || 'general',
      buffer: file.buffer,
      originalName: file.originalname || 'upload.jpg',
      mime: file.mimetype || 'image/jpeg',
    });
    return {
      path: saved.path,
      filename: saved.filename,
      kind: saved.kind,
      bytes: saved.bytes,
    };
  }

  /** Fotos de la ficha técnica: solo con sesión del mismo salón. */
  @Get('private/:kind/:file')
  @ApiBearerAuth()
  @Roles('Admin', 'Recepcionista', 'Estilista')
  privateFile(@Param('kind') kind: string, @Param('file') file: string, @Res() res: Response) {
    const path = this.storage.privateFile(this.tenantContext.getTenant().slug, kind, file);
    if (!path || !existsSync(path)) throw new NotFoundException('Foto no encontrada');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.sendFile(path);
  }
}
