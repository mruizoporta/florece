"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Scissors, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import type { Appointment, AppointmentStatus, PublicEmployee } from "@/lib/types";
import {
  AdminPill,
  AdminSection,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { ModernSelect } from "@/components/ui/ModernSelect";
import { formatDateTime } from "@/lib/format";
import { employeeImageUrl } from "@/lib/images";

type AppointmentServiceRow =
  | { id: number; name: string; durationTime?: number }
  | {
      id: number;
      service?: {
        durationTime?: number;
        item?: { name?: string; price?: number };
      };
    };

function statusTone(name?: string | null) {
  if (!name) return "muted" as const;
  const n = name.toLowerCase();
  if (n.includes("conclu") || n.includes("final")) return "success" as const;
  if (n.includes("cancel")) return "danger" as const;
  if (n.includes("atend")) return "primary" as const;
  return "primary" as const;
}

function serviceLines(services?: AppointmentServiceRow[] | null) {
  if (!services?.length) return [];
  return services
    .map((row) => {
      if ("name" in row && row.name) {
        return {
          id: row.id,
          name: row.name,
          duration: row.durationTime,
        };
      }
      const nested = row as {
        id: number;
        service?: {
          durationTime?: number;
          item?: { name?: string };
        };
      };
      return {
        id: nested.id,
        name: nested.service?.item?.name ?? "Servicio",
        duration: nested.service?.durationTime,
      };
    })
    .filter((s) => s.name);
}

export default function AdminAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [statuses, setStatuses] = useState<AppointmentStatus[]>([]);
  const [employees, setEmployees] = useState<PublicEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [statusId, setStatusId] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const load = useCallback(async () => {
    try {
      const [appt, statusRows, empRows] = await Promise.all([
        api<Appointment>(`/v1/appointments/${id}`, {
          tenantSlug: slug,
          auth: true,
        }),
        api<AppointmentStatus[]>("/v1/appointments/statuses", {
          tenantSlug: slug,
          auth: true,
        }).catch(() => []),
        api<PublicEmployee[]>("/v1/employees", {
          tenantSlug: slug,
          auth: true,
        }).catch(() => []),
      ]);
      setAppointment(appt);
      setStatuses(statusRows);
      setEmployees(empRows);
      setStatusId(String(appt.status?.id ?? appt.statusId ?? ""));
      setEmployeeId(String(appt.employee?.id ?? appt.employeeId ?? ""));
    } catch {
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [slug, id]);

  useEffect(() => {
    load();
  }, [load]);

  const services = useMemo(
    () => serviceLines(appointment?.services as AppointmentServiceRow[] | undefined),
    [appointment?.services],
  );

  const isCancelled = (appointment?.status?.name ?? "")
    .toLowerCase()
    .includes("cancel");

  async function saveStatus() {
    if (!statusId) return;
    setBusy(true);
    setMessage(null);
    try {
      await api(`/v1/appointments/${id}/status`, {
        method: "PATCH",
        tenantSlug: slug,
        auth: true,
        body: { status_id: Number(statusId) },
      });
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function saveEmployee() {
    if (!employeeId) return;
    setBusy(true);
    setMessage(null);
    try {
      await api(`/v1/appointments/${id}/employee`, {
        method: "PATCH",
        tenantSlug: slug,
        auth: true,
        body: { employee_id: Number(employeeId) },
      });
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function cancelAppointment() {
    if (!window.confirm("¿Cancelar esta cita?")) return;
    setBusy(true);
    setMessage(null);
    try {
      await api(`/v1/appointments/${id}/cancel`, {
        method: "PATCH",
        tenantSlug: slug,
        auth: true,
      });
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!appointment) {
    return (
      <div className="space-y-4">
        <Link
          href={`/s/${slug}/admin/appointments`}
          className="inline-flex items-center gap-1.5 text-sm text-brand-text-muted transition hover:text-brand-ink"
        >
          <ArrowLeft size={16} />
          Volver a citas
        </Link>
        <p className="text-brand-text-muted">No se encontró la cita.</p>
      </div>
    );
  }

  const photo = employeeImageUrl(appointment.employee?.image);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Link
          href={`/s/${slug}/admin/appointments`}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-brand-text-muted transition hover:text-brand-ink"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Volver a citas
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-[2.15rem] font-semibold tracking-tight text-brand-ink sm:text-4xl">
            {appointment.name}
          </h1>
          {appointment.status?.name ? (
            <AdminPill tone={statusTone(appointment.status.name)}>
              {appointment.status.name}
            </AdminPill>
          ) : null}
        </div>
        <p className="mt-2 text-[15px] text-brand-text-muted">
          {formatDateTime(appointment.startTime)}
          {appointment.endTime
            ? ` → ${new Date(appointment.endTime).toLocaleTimeString("es", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : ""}
        </p>
      </div>

      {message ? <MessageBanner message={message} type="error" /> : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <AdminSection title="Cliente" description="Datos de contacto de la cita.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-brand-warm px-4 py-3">
                <p className="text-[11px] font-semibold tracking-wide text-brand-text-muted uppercase">
                  Nombre
                </p>
                <p className="mt-1 font-medium text-brand-ink">{appointment.name}</p>
              </div>
              <div className="rounded-2xl bg-brand-warm px-4 py-3">
                <p className="text-[11px] font-semibold tracking-wide text-brand-text-muted uppercase">
                  Teléfono
                </p>
                <p className="mt-1 flex items-center gap-2 font-medium text-brand-ink">
                  <Phone size={14} className="text-brand-text-muted" />
                  {appointment.phone ?? appointment.customer?.phone ?? "—"}
                </p>
              </div>
            </div>
          </AdminSection>

          <AdminSection title="Servicios" description="Tratamientos de esta cita.">
            {services.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-ink/12 bg-brand-warm px-4 py-8 text-center">
                <Scissors
                  size={24}
                  className="mx-auto mb-2 text-brand-ink/25"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-brand-text-muted">Sin servicios asignados</p>
              </div>
            ) : (
              <ul className="divide-y divide-brand-ink/6 overflow-hidden rounded-2xl border border-brand-ink/8">
                {services.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 bg-white px-4 py-3.5"
                  >
                    <p className="font-medium text-brand-ink">{s.name}</p>
                    {s.duration ? (
                      <p className="text-sm tabular-nums text-brand-text-muted">
                        {s.duration} min
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </AdminSection>
        </div>

        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="admin-card">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-brand-text-muted uppercase">
              Profesional
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eceae6]">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt=""
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <UserRound size={20} className="text-brand-ink/35" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-brand-ink">
                  {appointment.employee?.name ?? "Sin asignar"}
                </p>
                <p className="text-xs text-brand-text-muted">Cita #{appointment.id}</p>
              </div>
            </div>
          </div>

          {!isCancelled ? (
            <>
              <AdminSection title="Estado" description="Mové la cita en el flujo del día.">
                <ModernSelect
                  value={statusId}
                  options={statuses.map((s) => ({
                    value: String(s.id),
                    label: s.name,
                  }))}
                  onChange={setStatusId}
                />
                <button
                  type="button"
                  disabled={busy || !statusId}
                  onClick={saveStatus}
                  className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
                >
                  Actualizar estado
                </button>
              </AdminSection>

              <AdminSection title="Reasignar" description="Cambiá la profesional de la cita.">
                <ModernSelect
                  placeholder="Elegir profesional"
                  value={employeeId}
                  options={employees.map((e) => ({
                    value: String(e.id),
                    label: e.name,
                  }))}
                  onChange={setEmployeeId}
                />
                <button
                  type="button"
                  disabled={busy || !employeeId}
                  onClick={saveEmployee}
                  className="btn-secondary w-full py-2.5 text-sm disabled:opacity-50"
                >
                  Guardar profesional
                </button>
              </AdminSection>

              <button
                type="button"
                disabled={busy}
                onClick={cancelAppointment}
                className="btn-secondary w-full py-2.5 text-sm text-red-600 disabled:opacity-50"
              >
                Cancelar cita
              </button>
            </>
          ) : (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              Esta cita está cancelada.
            </p>
          )}

          <button
            type="button"
            onClick={() => router.push(`/s/${slug}/admin/board`)}
            className="text-sm text-brand-text-muted underline-offset-2 hover:text-brand-ink hover:underline"
          >
            Ver en el tablero →
          </button>
        </div>
      </div>
    </div>
  );
}
