"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, Phone, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import type { Appointment, Customer } from "@/lib/types";
import {
  AdminIconButton,
  AdminPill,
  AdminTable,
  LoadingSpinner,
} from "@/components/admin/AdminUi";
import { formatDateTime } from "@/lib/format";

function statusTone(name?: string | null) {
  if (!name) return "muted" as const;
  const n = name.toLowerCase();
  if (n.includes("conclu") || n.includes("final")) return "success" as const;
  if (n.includes("cancel")) return "danger" as const;
  return "primary" as const;
}

function serviceLabel(a: Appointment) {
  const list = a.services ?? [];
  if (!list.length) return null;
  return list
    .map((s) => {
      if ("name" in s && s.name) return s.name;
      const nested = s as {
        service?: { item?: { name?: string } };
      };
      return nested.service?.item?.name;
    })
    .filter(Boolean)
    .join(" · ");
}

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const c = await api<
          Customer & {
            appointments?: Appointment[];
            user?: { name?: string; email?: string };
          }
        >(`/v1/customers/${id}`, { tenantSlug: slug, auth: true });
        setCustomer({
          ...c,
          name: c.name ?? c.user?.name ?? "Cliente",
          email: c.email ?? null,
          phone: c.phone ?? null,
        });
        setAppointments(c.appointments ?? []);
      } catch {
        setCustomer(null);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, id]);

  if (loading) return <LoadingSpinner />;
  if (!customer) {
    return (
      <div className="space-y-4">
        <Link
          href={`/s/${slug}/admin/customers`}
          className="inline-flex items-center gap-1.5 text-sm text-brand-text-muted transition hover:text-brand-ink"
        >
          <ArrowLeft size={16} />
          Volver a clientes
        </Link>
        <p className="text-brand-text-muted">No se encontró el cliente.</p>
      </div>
    );
  }

  const initial = (customer.name ?? "?").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Link
          href={`/s/${slug}/admin/customers`}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-brand-text-muted transition hover:text-brand-ink"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Volver a clientes
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-warm font-serif text-2xl text-brand-ink">
            {initial}
          </span>
          <div>
            <h1 className="font-serif text-[2.15rem] font-semibold tracking-tight text-brand-ink sm:text-4xl">
              {customer.name}
            </h1>
            <p className="mt-1 text-[15px] text-brand-text-muted">
              {appointments.length}{" "}
              {appointments.length === 1 ? "cita" : "citas"} en el historial
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="admin-card">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-brand-text-muted uppercase">
            Teléfono
          </p>
          <p className="mt-2 flex items-center gap-2 font-medium text-brand-ink">
            <Phone size={15} className="text-brand-text-muted" />
            {customer.phone ?? "—"}
          </p>
        </div>
        <div className="admin-card">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-brand-text-muted uppercase">
            Email
          </p>
          <p className="mt-2 flex items-center gap-2 font-medium text-brand-ink">
            <Mail size={15} className="text-brand-text-muted" />
            <span className="truncate">{customer.email ?? "—"}</span>
          </p>
        </div>
        <div className="admin-card">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-brand-text-muted uppercase">
            Citas
          </p>
          <p className="mt-2 flex items-center gap-2 font-medium text-brand-ink">
            <UserRound size={15} className="text-brand-text-muted" />
            {appointments.length}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-sm font-semibold text-brand-ink">
          Historial de citas
        </h2>
        <p className="mb-4 text-sm text-brand-text-muted">
          Tocá el ojo para ver el detalle de cada cita.
        </p>
        <AdminTable
          headers={["Fecha", "Servicios", "Profesional", "Estado", ""]}
          empty={appointments.length === 0}
          emptyTitle="Sin citas registradas"
        >
          {appointments.map((a) => (
            <tr key={a.id} className="transition hover:bg-brand-warm/80">
              <td className="px-5 py-4 text-brand-ink">
                {formatDateTime(a.startTime)}
              </td>
              <td className="px-5 py-4 text-sm text-brand-text-muted">
                {serviceLabel(a) ?? a.name ?? "—"}
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
                <AdminIconButton
                  action="view"
                  label="Ver cita"
                  href={`/s/${slug}/admin/appointments/${a.id}`}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
}
