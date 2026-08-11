import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const KIND_FOLDERS: Record<string, string> = {
  logo: 'logo',
  banner: 'banners',
  banners: 'banners',
  parallax: 'parallax',
  imageParallax: 'parallax',
  left: 'left',
  imageLeft: 'left',
  right: 'right',
  imageRight: 'right',
  items: 'items',
  item: 'items',
  employees: 'employees',
  employee: 'employees',
  general: 'general',
};

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly log = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {}

  root() {
    return (
      this.config.get<string>('STORAGE_ROOT') ||
      join(process.cwd(), 'storage')
    );
  }

  async onModuleInit() {
    const root = this.root();
    await mkdir(root, { recursive: true });
    this.log.log(`Storage root: ${root}`);
  }

  normalizeKind(kind: string | undefined): string {
    const raw = (kind || 'general').trim();
    const mapped = KIND_FOLDERS[raw] || KIND_FOLDERS[raw.replace(/[^a-zA-Z]/g, '')];
    if (mapped) return mapped;
    const safe = raw.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!safe || safe.length > 40) {
      throw new BadRequestException('Tipo de imagen inválido');
    }
    return safe;
  }

  private extFor(mime: string, originalName: string): string {
    if (mime === 'image/png') return '.png';
    if (mime === 'image/webp') return '.webp';
    if (mime === 'image/gif') return '.gif';
    if (mime === 'image/jpeg' || mime === 'image/jpg') return '.jpg';
    const fromName = extname(originalName || '').toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fromName)) {
      return fromName === '.jpeg' ? '.jpg' : fromName;
    }
    return '.jpg';
  }

  /**
   * Guarda un archivo bajo STORAGE_ROOT/{tenantSlug}/{kind}/{uuid}.ext
   * Devuelve ruta pública `/storage/...` para guardar en DB.
   */
  async saveTenantImage(input: {
    tenantSlug: string;
    kind: string;
    buffer: Buffer;
    originalName: string;
    mime: string;
  }) {
    const slug = input.tenantSlug
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 64);
    if (!slug) throw new BadRequestException('Salón inválido');

    const mime = (input.mime || '').toLowerCase();
    if (!ALLOWED_MIME.has(mime)) {
      throw new BadRequestException(
        'Formato no permitido. Usá JPG, PNG, WEBP o GIF.',
      );
    }
    if (!input.buffer?.length) {
      throw new BadRequestException('Archivo vacío');
    }
    if (input.buffer.length > 8 * 1024 * 1024) {
      throw new BadRequestException('Máximo 8 MB por imagen');
    }

    const kind = this.normalizeKind(input.kind);
    const ext = this.extFor(mime, input.originalName);
    const filename = `${randomUUID()}${ext}`;
    const dir = join(this.root(), slug, kind);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), input.buffer);

    const publicPath = `/storage/${slug}/${kind}/${filename}`;
    return {
      path: publicPath,
      filename,
      kind,
      bytes: input.buffer.length,
    };
  }
}
