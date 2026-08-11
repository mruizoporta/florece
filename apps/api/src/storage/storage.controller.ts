import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantContext } from '../tenant/tenant.context';
import { StorageService } from './storage.service';

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
  @Roles('Admin')
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
}
