"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";

/** Crea el enlace de encuesta y lo abre en WhatsApp; sin teléfono, lo copia. */
export function RequestFeedbackButton({
  slug,
  target,
  phone,
  className = "btn-secondary inline-flex items-center gap-2 text-sm",
}: {
  slug: string;
  target: { appointment_id: number } | { order_id: number };
  phone?: string | null;
  className?: string;
}) {
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function request() {
    setBusy(true);
    setNote(null);
    const wa = normalizeWhatsAppPhone(phone);
    // Se abre ya (en el clic) para que el navegador no la bloquee como popup.
    const win = wa ? window.open("", "_blank") : null;
    try {
      const res = await api<{ path: string; answered: boolean; customerName: string | null; phone: string | null }>(
        "/v1/feedback/request",
        { method: "POST", tenantSlug: slug, auth: true, body: target },
      );
      const url = `${window.location.origin}${res.path}`;
      if (res.answered) {
        win?.close();
        setNote("Ya respondió esta encuesta. La ves en Opiniones.");
        return;
      }
      const name = res.customerName?.trim().split(/\s+/)[0];
      const text = `¡Hola${name ? ` ${name}` : ""}! Gracias por visitarnos 💖 ¿Nos contás cómo te fue? Te lleva un minuto: ${url}`;
      if (win && wa) {
        win.location.href = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
      } else {
        await navigator.clipboard.writeText(url).catch(() => undefined);
        setNote(`Enlace copiado: ${url}`);
      }
    } catch (err) {
      win?.close();
      setNote(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" className={className} onClick={request} disabled={busy}>
        <Star size={15} />
        {phone ? "Pedir opinión por WhatsApp" : "Copiar enlace de opinión"}
      </button>
      {note ? <p className="mt-1.5 break-all text-xs text-brand-text-muted" role="status">{note}</p> : null}
    </div>
  );
}
