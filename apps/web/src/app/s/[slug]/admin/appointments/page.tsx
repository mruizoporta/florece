"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Appointment } from "@/lib/types";
import {
  AdminIconButton,
  AdminPageHeader,
  AdminPill,
  AdminTable,
  LoadingSpinner,
} from "@/components/admin/AdminUi";
import { formatDateTime } from "@/lib/format";
import { useLocale } from "@/components/LocaleProvider";
import { MessageCircle } from "lucide-react";
import { appointmentPhone, appointmentWhatsAppUrl } from "@/lib/whatsapp";
import { getMe } from "@/lib/auth";

function statusTone(name?: string | null) {
  if (!name) return "muted" as const;
  const n = name.toLowerCase();
  if (n.includes("conclu") || n.includes("final")) return "success" as const;
  if (n.includes("cancel")) return "danger" as const;
  return "primary" as const;
}

export default function AdminAppointmentsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr, locale } = useLocale();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonName, setSalonName] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then((me) => setSalonName(me?.tenant?.name ?? null))
      .catch(() => setSalonName(null));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<Appointment[]>("/v1/appointments", {
          tenantSlug: slug,
          auth: true,
        });
        setAppointments(data);
      } catch {
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.appointments")}
        subtitle="Listado de citas del día."
        actionHref={`/s/${slug}/admin/appointments/create`}
        actionLabel={tr("admin.appointmentsCreate")}
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <AdminTable
          headers={["Cliente", "Fecha", "Profesional", "Estado", ""]}
          empty={appointments.length === 0}
          emptyTitle="Sin citas"
          emptyDescription="Creá una o esperá reservas desde el sitio público."
        >
          {appointments.map((a) => (
            <tr key={a.id} className="transition hover:bg-brand-warm/80">
              <td className="px-5 py-4 font-medium text-brand-ink">{a.name}</td>
              <td className="px-5 py-4 text-brand-text-muted">
                {formatDateTime(a.startTime)}
              </td>
              <td className="px-5 py-4 text-brand-text-muted">
                {a.employee?.name ?? "—"}
              </td>
              <td className="px-5 py-4">
                {a.status ? (
                  <AdminPill tone={statusTone(a.status.name)}>
                    {a.status.name}
                  </AdminPill>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-1.5">
                  {(() => {
                    const phone = appointmentPhone(a);
                    const wa = phone
                      ? appointmentWhatsAppUrl("confirm", {
                          clientName: a.name,
                          phone,
                          startTime: a.startTime,
                          stylistName: a.employee?.name,
                          services: a.services
                            ?.map((s) => s.name)
                            .filter(Boolean)
                            .join(", "),
                          salonName,
                          locale: locale === "en" ? "en" : "es",
                        })
                      : null;
                    return wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp"
                        title="Confirmar por WhatsApp"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C7E] transition hover:bg-[#25D366]/25"
                      >
                        <MessageCircle size={15} strokeWidth={2.25} />
                      </a>
                    ) : null;
                  })()}
                  <AdminIconButton
                    action="view"
                    label="Ver detalle"
                    href={`/s/${slug}/admin/appointments/${a.id}`}
                  />
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
