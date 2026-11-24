import { BadRequestException } from '@nestjs/common';
import { marketForRegion } from '@florece/shared';

/** Billing region stored on the organization, when the tenant loader included it. */
export function billingRegionOf(tenant: object): string | null {
  const org = (
    tenant as { organization?: { billingRegion?: string | null } | null }
  ).organization;
  return org?.billingRegion ?? null;
}

export function salonTodayYmd(now = new Date(), region?: string | null): string {
  return now.toLocaleDateString('en-CA', {
    timeZone: marketForRegion(region).timeZone,
  });
}

/** Inclusive start/end for a calendar day in the salon's offset. */
export function salonDayBounds(
  dateYmd: string,
  region?: string | null,
): { start: Date; end: Date } {
  const offset = marketForRegion(region).utcOffset;
  return {
    start: new Date(`${dateYmd}T00:00:00.000${offset}`),
    end: new Date(`${dateYmd}T23:59:59.999${offset}`),
  };
}

/**
 * «Ahora» en hora local del salón, con la misma convención que las citas:
 * start_time guarda la hora de pared (11:00 = 11:00Z), sin zona.
 */
export function salonWallClockNow(now = new Date(), region?: string | null): Date {
  const time = now.toLocaleTimeString('en-GB', {
    timeZone: marketForRegion(region).timeZone,
    hour12: false,
  });
  return new Date(`${salonTodayYmd(now, region)}T${time}.000Z`);
}

/** Fecha y hora de una cita para mostrar (ya está en hora local del salón). */
export function formatWallClock(value: Date, locale = 'es') {
  return value.toLocaleString(locale, {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Local wall-clock time on today's salon calendar day. */
export function salonTodayAt(
  hours: number,
  minutes = 0,
  now = new Date(),
  region?: string | null,
): Date {
  const ymd = salonTodayYmd(now, region);
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return new Date(`${ymd}T${hh}:${mm}:00${marketForRegion(region).utcOffset}`);
}

/**
 * Rango de días en el horario del salón (no del servidor). Acepta YYYY-MM-DD;
 * un ISO completo se lleva al día del salón. Por defecto: del 1 del mes a hoy.
 */
export function salonDateRange(
  from?: string,
  to?: string,
  region?: string | null,
) {
  const toYmd = (value: string | undefined, fallback: string) => {
    if (!value) return fallback;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Rango de fechas inválido');
    }
    return salonTodayYmd(parsed, region);
  };
  const today = salonTodayYmd(new Date(), region);
  const fromYmd = toYmd(from, `${today.slice(0, 8)}01`);
  const endYmd = toYmd(to, today);
  if (endYmd < fromYmd) {
    throw new BadRequestException(
      'La fecha final debe ser igual o posterior a la inicial',
    );
  }
  return {
    from: salonDayBounds(fromYmd, region).start,
    to: salonDayBounds(endYmd, region).end,
    fromYmd,
    toYmd: endYmd,
    days: (Date.parse(endYmd) - Date.parse(fromYmd)) / 86_400_000 + 1,
  };
}
