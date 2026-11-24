import { marketForRegion } from "@florece/shared";

/** Default when the salon has not loaded a currency yet (Nicaragua). */
export const SALON_TIMEZONE = marketForRegion("NI").timeZone;

export function salonTodayYmd(
  now = new Date(),
  timeZone = SALON_TIMEZONE,
): string {
  return now.toLocaleDateString("en-CA", { timeZone });
}
