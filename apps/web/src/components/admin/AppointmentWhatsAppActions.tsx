"use client";

import { MessageCircle } from "lucide-react";
import {
  appointmentPhone,
  appointmentWhatsAppUrl,
  type AppointmentWaContext,
  type AppointmentWaKind,
} from "@/lib/whatsapp";

type AppointmentLike = {
  name: string;
  phone?: string | null;
  startTime?: string | null;
  employee?: { name?: string | null } | null;
  customer?: { phone?: string | null } | null;
  services?: { name?: string }[] | null;
};

type Props = {
  appointment: AppointmentLike;
  salonName?: string | null;
  locale?: "es" | "en";
  /** compact = icon row for board cards */
  variant?: "compact" | "stack";
  className?: string;
};

function openWa(kind: AppointmentWaKind, ctx: AppointmentWaContext) {
  const url = appointmentWhatsAppUrl(kind, ctx);
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function AppointmentWhatsAppActions({
  appointment,
  salonName,
  locale = "es",
  variant = "stack",
  className = "",
}: Props) {
  const phone = appointmentPhone(appointment);
  const services =
    appointment.services
      ?.map((s) => s.name)
      .filter(Boolean)
      .join(", ") || null;

  const ctx: AppointmentWaContext = {
    clientName: appointment.name,
    phone,
    startTime: appointment.startTime,
    stylistName: appointment.employee?.name,
    services,
    salonName,
    locale,
  };

  if (!phone) {
    if (variant === "compact") return null;
    return (
      <p className={`text-xs text-brand-text-muted ${className}`}>
        Sin teléfono — agregalo a la cita para escribir por WhatsApp.
      </p>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap gap-1.5 ${className}`}>
        <button
          type="button"
          title="Confirmar por WhatsApp"
          aria-label="Confirmar por WhatsApp"
          onClick={() => openWa("confirm", ctx)}
          className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/15 px-2.5 py-1 text-[11px] font-semibold text-[#128C7E] transition hover:bg-[#25D366]/25"
        >
          <MessageCircle size={12} strokeWidth={2.25} />
          Confirmar
        </button>
        <button
          type="button"
          title="Recordar por WhatsApp"
          aria-label="Recordar por WhatsApp"
          onClick={() => openWa("remind", ctx)}
          className="inline-flex items-center gap-1 rounded-full bg-brand-ink/[0.04] px-2.5 py-1 text-[11px] font-medium text-brand-ink/75 transition hover:bg-white"
        >
          Recordar
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-[11px] font-semibold tracking-[0.08em] text-brand-text-muted uppercase">
        WhatsApp
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => openWa("confirm", ctx)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
        >
          <MessageCircle size={16} />
          Confirmar asistencia
        </button>
        <button
          type="button"
          onClick={() => openWa("remind", ctx)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/35 bg-[#25D366]/10 px-4 py-2.5 text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/18"
        >
          <MessageCircle size={16} />
          Enviar recordatorio
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-brand-text-muted">
        Abre WhatsApp con el mensaje listo. Solo tenés que tocar enviar.
      </p>
    </div>
  );
}
