import { moneyLocaleForSymbol } from "@florece/shared";

export function formatDate(
  value?: string | null,
  locale: string = "es",
): string {
  if (!value) return "—";
  const tag = locale.startsWith("en") ? "en-US" : "es-NI";
  return new Date(value).toLocaleDateString(tag, { dateStyle: "medium" });
}

export function formatDateTime(
  value?: string | null,
  locale: string = "es",
): string {
  if (!value) return "—";
  const tag = locale.startsWith("en") ? "en-US" : "es-NI";
  return new Date(value).toLocaleString(tag, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Formato según el símbolo: C$1.500,00 · RD$1,500.00 */
export function formatCurrency(amount?: number | null, symbol = "C$"): string {
  if (amount == null) return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  const formatted = n.toLocaleString(moneyLocaleForSymbol(symbol), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

/** Appointment instants are stored as wall-clock UTC (10:00 booked → 10:00Z). */
const WALL_CLOCK = { timeZone: "UTC" } as const;

export function formatAppointmentDateTime(
  value?: string | null,
  locale: string = "es",
): string {
  if (!value) return "—";
  const tag = locale.startsWith("en") ? "en-US" : "es";
  return new Date(value).toLocaleString(tag, {
    dateStyle: "medium",
    timeStyle: "short",
    ...WALL_CLOCK,
  });
}

export function formatAppointmentTime(
  value?: string | null,
  locale: string = "es",
): string {
  if (!value) return "—";
  const tag = locale.startsWith("en") ? "en-US" : "es";
  return new Date(value).toLocaleTimeString(tag, {
    hour: "2-digit",
    minute: "2-digit",
    ...WALL_CLOCK,
  });
}

export const WEEKDAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
] as const;
