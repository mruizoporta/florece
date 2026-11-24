/** WhatsApp deep links (wa.me) — no Meta API required. */

import { normalizeWaDigits } from "@florece/shared";

export type AppointmentWaKind = "confirm" | "remind";

export type AppointmentWaContext = {
  clientName: string;
  phone?: string | null;
  startTime?: string | null;
  stylistName?: string | null;
  services?: string | null;
  salonName?: string | null;
  locale?: "es" | "en";
};

/** Digits only for wa.me. 8 digits → +505. 10 digits (809/829/849) → +1. */
export function normalizeWhatsAppPhone(
  raw?: string | null,
  defaultCountry = "505",
): string | null {
  return normalizeWaDigits(raw, defaultCountry);
}

function formatAppointmentWhen(
  startTime?: string | null,
  locale: "es" | "en" = "es",
  tu = false,
): { date: string; time: string } {
  if (!startTime) {
    return locale === "en"
      ? { date: "the scheduled day", time: "the scheduled time" }
      : { date: "el día agendado", time: "la hora agendada" };
  }
  const d = new Date(startTime);
  const tag = locale === "en" ? "en-US" : tu ? "es-DO" : "es-NI";
  const wall = { timeZone: "UTC" } as const;
  return {
    date: d.toLocaleDateString(tag, {
      weekday: "long",
      day: "numeric",
      month: "long",
      ...wall,
    }),
    time: d.toLocaleTimeString(tag, {
      hour: "2-digit",
      minute: "2-digit",
      ...wall,
    }),
  };
}

export function buildAppointmentWhatsAppText(
  kind: AppointmentWaKind,
  ctx: AppointmentWaContext,
  phoneDigits?: string | null,
): string {
  const locale = ctx.locale ?? "es";
  const name = ctx.clientName?.trim() || (locale === "en" ? "there" : "hola");
  const stylist = ctx.stylistName?.trim();
  const services = ctx.services?.trim();
  const salon = ctx.salonName?.trim();
  const tu = Boolean(phoneDigits?.startsWith("1"));
  const { date, time } = formatAppointmentWhen(ctx.startTime, locale, tu);

  if (locale === "en") {
    const withWho = stylist ? ` with ${stylist}` : "";
    const svc = services ? ` (${services})` : "";
    const place = salon ? ` — ${salon}` : "";
    if (kind === "confirm") {
      return `Hi ${name}! Confirming your appointment on ${date} at ${time}${withWho}${svc}. Can you confirm you'll make it?${place}`;
    }
    return `Hi ${name}! Reminder: your appointment is on ${date} at ${time}${withWho}${svc}. See you soon!${place}`;
  }

  const conQuien = stylist ? ` con ${stylist}` : "";
  const svc = services ? ` (${services})` : "";
  const lugar = salon ? ` — ${salon}` : "";

  if (kind === "confirm") {
    const ask = tu
      ? "¿Nos confirmas tu asistencia?"
      : "¿Nos confirmás tu asistencia?";
    return `Hola ${name} 👋 Te confirmamos tu cita el ${date} a las ${time}${conQuien}${svc}. ${ask}${lugar}`;
  }
  return `Hola ${name} 👋 Te recordamos tu cita el ${date} a las ${time}${conQuien}${svc}. ¡Te esperamos!${lugar}`;
}

export function appointmentWhatsAppUrl(
  kind: AppointmentWaKind,
  ctx: AppointmentWaContext,
): string | null {
  const phone = normalizeWhatsAppPhone(ctx.phone);
  if (!phone) return null;
  const text = buildAppointmentWhatsAppText(kind, ctx, phone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function appointmentPhone(
  appointment: {
    phone?: string | null;
    customer?: { phone?: string | null } | null;
  },
): string | null {
  return appointment.phone || appointment.customer?.phone || null;
}
