/** Default salon calendar timezone (Nicaragua, no DST). */
export const SALON_TIMEZONE = "America/Managua";
export const SALON_UTC_OFFSET = "-06:00";

/** YYYY-MM-DD in salon timezone. */
export function salonTodayYmd(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: SALON_TIMEZONE });
}

/** Inclusive start/end instants for a calendar day in salon timezone. */
export function salonDayBounds(dateYmd: string): { start: Date; end: Date } {
  return {
    start: new Date(`${dateYmd}T00:00:00.000${SALON_UTC_OFFSET}`),
    end: new Date(`${dateYmd}T23:59:59.999${SALON_UTC_OFFSET}`),
  };
}

/** Local wall-clock time on today's salon calendar day. */
export function salonTodayAt(hours: number, minutes = 0, now = new Date()): Date {
  const ymd = salonTodayYmd(now);
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return new Date(`${ymd}T${hh}:${mm}:00${SALON_UTC_OFFSET}`);
}
