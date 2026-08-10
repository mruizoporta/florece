/** Keep in sync with API `America/Managua` day bounds. */
export const SALON_TIMEZONE = "America/Managua";

export function salonTodayYmd(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: SALON_TIMEZONE });
}
