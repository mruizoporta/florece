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
  const { tr } = useLocale();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

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
                <div className="flex justify-end">
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
