import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readdir, stat, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** Fotos que no se sirven públicamente (ficha técnica): van fuera de la carpeta que publica nginx. */
export const PRIVATE_KINDS = new Set(['customers']);
export const PRIVATE_FILE = /^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/;

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

  privateRoot() {
    return this.config.get<string>('STORAGE_PRIVATE_ROOT') || `${this.root().replace(/\/+$/, '')}-private`;
  }

  /** Ruta en disco de una foto privada del salón, o null si el nombre no es válido. */
  privateFile(slug: string, kind: string, file: string) {
    if (!PRIVATE_KINDS.has(kind) || !PRIVATE_FILE.test(file)) return null;
    return join(this.privateRoot(), slug, kind, file);
  }

  async onModuleInit() {
    const root = this.root();
    await mkdir(root, { recursive: true });
    await mkdir(this.privateRoot(), { recursive: true });
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
    if (!looksLikeImage(input.buffer)) {
      throw new BadRequestException('El archivo no es una imagen JPG, PNG, WEBP o GIF.');
    }

    const kind = this.normalizeKind(input.kind);
    const ext = this.extFor(mime, input.originalName);
    const filename = `${randomUUID()}${ext}`;
    const isPrivate = PRIVATE_KINDS.has(kind);
    const dir = join(isPrivate ? this.privateRoot() : this.root(), slug, kind);
    await mkdir(dir, { recursive: true });
    await this.assertQuota(slug, input.buffer.length);
    await writeFile(join(dir, filename), input.buffer);

    // Las privadas se leen solo con sesión, por GET v1/storage/private/{kind}/{archivo}.
    const publicPath = `/${isPrivate ? 'private' : 'storage'}/${slug}/${kind}/${filename}`;
    return {
      path: publicPath,
      filename,
      kind,
      bytes: input.buffer.length,
    };
  }

  /** Tope de espacio por salón (públicas + privadas) para que nadie llene el disco del servidor. */
  private async assertQuota(slug: string, incoming: number) {
    const limitMb = Number(this.config.get<string>('STORAGE_QUOTA_MB') ?? 1024);
    const used = (await dirSize(join(this.root(), slug))) + (await dirSize(join(this.privateRoot(), slug)));
    if (used + incoming > limitMb * 1024 * 1024) {
      throw new BadRequestException('El salón llegó al límite de espacio para imágenes. Borrá fotos viejas o escribinos.');
    }
  }
}

async function dirSize(dir: string): Promise<number> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  let total = 0;
  for (const e of entries) {
    const full = join(dir, e.name);
    total += e.isDirectory() ? await dirSize(full) : (await stat(full).catch(() => ({ size: 0 }))).size;
  }
  return total;
}

/** Firma de los primeros bytes: el tipo que manda el navegador no alcanza. */
export function looksLikeImage(b: Buffer) {
  const hex = b.subarray(0, 12).toString('hex');
  return (
    hex.startsWith('ffd8ff') || // jpg
    hex.startsWith('89504e47') || // png
    hex.startsWith('47494638') || // gif
    (hex.startsWith('52494646') && b.subarray(8, 12).toString('ascii') === 'WEBP')
  );
}
