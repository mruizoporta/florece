import { z } from 'zod';
import type { PrismaService } from '../prisma/prisma.service';

/** Compara "1.2.10" con "1.2.9" número por número. Negativo = a es más vieja. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** "1.0.3"; vacío = no se exige nada. */
const versionField = z
  .union([z.string(), z.null()])
  .transform((v) => v?.trim() || null)
  .refine((v) => v === null || /^\d{1,4}(\.\d{1,4}){0,2}$/.test(v), 'Usá el formato 1.0.3');

const storeSetting = z
  .object({ minimum: versionField, latest: versionField })
  .refine((v) => !v.minimum || !v.latest || compareVersions(v.minimum, v.latest) <= 0, {
    message: 'La mínima no puede ser mayor que la última',
  });

/** Lo que se guarda desde SupportFlow (Productos → Florece → Versiones de la app). */
export const appVersionsSettingSchema = z.object({ ios: storeSetting, android: storeSetting });
export type AppVersionsSetting = z.infer<typeof appVersionsSettingSchema>;

const NO_APP_VERSIONS: AppVersionsSetting = {
  ios: { minimum: null, latest: null },
  android: { minimum: null, latest: null },
};

const KEY = 'appVersions';

export async function readAppVersions(prisma: PrismaService): Promise<AppVersionsSetting> {
  const row = await prisma.platformSetting.findUnique({ where: { key: KEY } });
  const parsed = appVersionsSettingSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : NO_APP_VERSIONS;
}

export async function saveAppVersions(prisma: PrismaService, value: AppVersionsSetting) {
  await prisma.platformSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
  return value;
}
