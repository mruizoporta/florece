"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import {
  AdminPageHeader,
  AdminSection,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { formatDateTime } from "@/lib/format";

type PayrollLine = {
  id: number;
  orderId: number;
  orderName: string | null;
  customerName: string | null;
  finalizedAt: string | null;
  serviceName: string;
  quantity: number;
  lineTotal: number;
  commissionRate: number;
  commission: number;
};

type EmployeePayrollDetail = {
  from: string;
  to: string;
  days: number;
  employee: {
    id: number;
    name: string;
    baseSalaryMonthly: number;
    commissionRate: number;
  };
  baseProrated: number;
  serviceSales: number;
  commission: number;
  lineCount: number;
  total: number;
  lines: PayrollLine[];
};

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

export default function EmployeePayrollDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const employeeId = params.employeeId as string;
  const { formatMoney } = useSalonMoney();

  const initialFrom =
    searchParams.get("from") ??
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  const initialTo =
    searchParams.get("to") ?? new Date().toISOString().slice(0, 10);

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [data, setData] = useState<EmployeePayrollDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (from) q.set("from", new Date(from).toISOString());
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      q.set("to", end.toISOString());
    }
    return q.toString();
  }, [from, to]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<EmployeePayrollDetail>(
      `/v1/payroll/employees/${employeeId}?${query}`,
      { auth: true, tenantSlug: slug },
    )
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, employeeId, query]);

  const backHref = `/s/${slug}/admin/payroll?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-brand-text-muted transition hover:text-brand-ink"
        >
          <ArrowLeft size={16} />
          Volver a comisiones
        </Link>
        <AdminPageHeader
          title={data?.employee.name ?? "Liquidación"}
          subtitle="Lo que corresponde pagar a este profesional en el período."
        />
      </div>

      <AdminSection title="Período" description="Mismo rango que el listado general.">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label-field">Desde</label>
            <input
              type="date"
              className="input-field !rounded-2xl"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field">Hasta</label>
            <input
              type="date"
              className="input-field !rounded-2xl"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          {data ? (
            <p className="pb-2 text-sm text-brand-text-muted">
              {data.days} día{data.days === 1 ? "" : "s"} · base mes{" "}
              {formatMoney(data.employee.baseSalaryMonthly)} · comisión actual{" "}
              {data.employee.commissionRate}%
            </p>
          ) : null}
        </div>
      </AdminSection>

      {error ? <MessageBanner message={error} type="error" /> : null}
      {loading ? <LoadingSpinner /> : null}

      {!loading && data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Base prorrateada", value: data.baseProrated },
              { label: "Ventas servicio", value: data.serviceSales },
              { label: "Comisión", value: data.commission },
              { label: "Total a pagar", value: data.total },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-[1.25rem] border border-brand-ink/[0.06] bg-white/90 px-4 py-4"
              >
                <p className="text-[11px] font-semibold tracking-[0.08em] text-brand-text-muted uppercase">
                  {card.label}
                </p>
                <p className="mt-1 font-serif text-2xl tracking-tight text-brand-ink">
                  {formatMoney(card.value)}
                </p>
              </div>
            ))}
          </div>

          <AdminSection
            title="Servicios del período"
            description="Cada línea usa el % congelado al cobrar el ticket."
          >
            {data.lines.length === 0 ? (
              <p className="text-sm text-brand-text-muted">
                No hay servicios atribuidos en este rango. Solo aplica la base
                prorrateada.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-ink/[0.06] text-[11px] font-bold tracking-[0.1em] text-brand-text-muted uppercase">
                      <th className="px-2 py-3 font-bold">Fecha</th>
                      <th className="px-2 py-3 font-bold">Servicio</th>
                      <th className="px-2 py-3 font-bold">Ticket</th>
                      <th className="px-2 py-3 text-right font-bold">Monto</th>
                      <th className="px-2 py-3 text-right font-bold">%</th>
                      <th className="px-2 py-3 text-right font-bold">
                        Comisión
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lines.map((line) => (
                      <tr
                        key={line.id}
                        className="border-b border-brand-ink/[0.04] last:border-0"
                      >
                        <td className="px-2 py-3 text-brand-text-muted">
                          {line.finalizedAt
                            ? formatDateTime(line.finalizedAt)
                            : "—"}
                        </td>
                        <td className="px-2 py-3">
                          <p className="font-medium text-brand-ink">
                            {line.serviceName}
                          </p>
                          <p className="text-xs text-brand-text-muted">
                            Cant. {line.quantity}
                          </p>
                        </td>
                        <td className="px-2 py-3">
                          <Link
                            href={`/s/${slug}/admin/orders/${line.orderId}`}
                            className="font-medium text-brand-ink underline-offset-2 hover:underline"
                          >
                            #{line.orderId}
                          </Link>
                          <p className="text-xs text-brand-text-muted">
                            {line.customerName ?? line.orderName ?? "Cliente"}
                          </p>
                        </td>
                        <td className="px-2 py-3 text-right tabular-nums">
                          {formatMoney(line.lineTotal)}
                        </td>
                        <td className="px-2 py-3 text-right tabular-nums text-brand-text-muted">
                          {line.commissionRate}%
                        </td>
                        <td className="px-2 py-3 text-right tabular-nums font-semibold text-brand-ink">
                          {formatMoney(line.commission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminSection>

          <div className="rounded-[1.25rem] border border-brand-ink/[0.08] bg-brand-warm/70 px-5 py-4">
            <p className="text-sm text-brand-text-muted">
              Período {toDateInput(data.from)} → {toDateInput(data.to)}
            </p>
            <p className="mt-1 font-serif text-3xl tracking-tight text-brand-ink">
              {formatMoney(data.total)}
            </p>
            <p className="mt-1 text-sm text-brand-text-muted">
              Base {formatMoney(data.baseProrated)} + comisión{" "}
              {formatMoney(data.commission)}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
