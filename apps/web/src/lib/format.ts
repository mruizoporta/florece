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

/** Formato nicaragüense: C$23.270,00 (punto miles, coma decimales). */
export function formatCurrency(amount?: number | null, symbol = "C$"): string {
  if (amount == null) return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  const formatted = n.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
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
