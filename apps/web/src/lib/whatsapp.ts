/** WhatsApp deep links (wa.me) — no Meta API required. */

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

/** Digits only for wa.me. Assumes Nicaragua (+505) when given a local 8-digit number. */
export function normalizeWhatsAppPhone(
  raw?: string | null,
  defaultCountry = "505",
): string | null {
  if (!raw?.trim()) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 8) digits = `${defaultCountry}${digits}`;
  if (digits.length < 10) return null;
  return digits;
}

function formatAppointmentWhen(
  startTime?: string | null,
  locale: "es" | "en" = "es",
): { date: string; time: string } {
  if (!startTime) {
    return locale === "en"
      ? { date: "the scheduled day", time: "the scheduled time" }
      : { date: "el día agendado", time: "la hora agendada" };
  }
  const d = new Date(startTime);
  const tag = locale === "en" ? "en-US" : "es-NI";
  return {
    date: d.toLocaleDateString(tag, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    time: d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" }),
  };
}

export function buildAppointmentWhatsAppText(
  kind: AppointmentWaKind,
  ctx: AppointmentWaContext,
): string {
  const locale = ctx.locale ?? "es";
  const name = ctx.clientName?.trim() || (locale === "en" ? "there" : "hola");
  const stylist = ctx.stylistName?.trim();
  const services = ctx.services?.trim();
  const salon = ctx.salonName?.trim();
  const { date, time } = formatAppointmentWhen(ctx.startTime, locale);

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
    return `Hola ${name} 👋 Te confirmamos tu cita el ${date} a las ${time}${conQuien}${svc}. ¿Nos confirmás tu asistencia?${lugar}`;
  }
  return `Hola ${name} 👋 Te recordamos tu cita el ${date} a las ${time}${conQuien}${svc}. ¡Te esperamos!${lugar}`;
}

export function appointmentWhatsAppUrl(
  kind: AppointmentWaKind,
  ctx: AppointmentWaContext,
): string | null {
  const phone = normalizeWhatsAppPhone(ctx.phone);
  if (!phone) return null;
  const text = buildAppointmentWhatsAppText(kind, ctx);
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
