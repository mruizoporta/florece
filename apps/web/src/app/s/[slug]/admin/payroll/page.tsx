"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import {
  AdminPageHeader,
  AdminSection,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { useLocale } from "@/components/LocaleProvider";

type PayrollRow = {
  employeeId: number;
  name: string;
  baseSalaryMonthly: number;
  commissionRate: number;
  baseProrated: number;
  serviceSales: number;
  commission: number;
  lineCount: number;
  total: number;
};

type PayrollSummary = {
  from: string;
  to: string;
  days: number;
  employees: PayrollRow[];
  totals: {
    baseProrated: number;
    serviceSales: number;
    commission: number;
    total: number;
  };
};

function monthStartIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function PayrollPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const { formatMoney } = useSalonMoney();
  const { tr } = useLocale();
  const [from, setFrom] = useState(
    searchParams.get("from") ?? monthStartIso(),
  );
  const [to, setTo] = useState(searchParams.get("to") ?? todayIso());
  const [data, setData] = useState<PayrollSummary | null>(null);
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
    const next = new URLSearchParams();
    next.set("from", from);
    next.set("to", to);
    router.replace(`/s/${slug}/admin/payroll?${next.toString()}`, {
      scroll: false,
    });
  }, [from, to, router, slug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<PayrollSummary>(`/v1/payroll/summary?${query}`, {
      auth: true,
      tenantSlug: slug,
    })
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
  }, [slug, query]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={tr("admin.payroll")}
        subtitle="Tocá un profesional para ver exactamente qué se le debe pagar."
      />

      <AdminSection title="Período" description="Elegí el rango a liquidar.">
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
              {data.days} día{data.days === 1 ? "" : "s"}
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
              { label: "Base prorrateada", value: data.totals.baseProrated },
              { label: "Ventas servicio", value: data.totals.serviceSales },
              { label: "Comisiones", value: data.totals.commission },
              { label: "Total a pagar", value: data.totals.total },
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
            title="Por profesional"
            description="Abrí el detalle para ver cada servicio y el total a pagar."
          >
            {data.employees.length === 0 ? (
              <p className="text-sm text-brand-text-muted">
                No hay empleados activos.
              </p>
            ) : (
              <ul className="divide-y divide-brand-ink/[0.06] overflow-hidden rounded-2xl border border-brand-ink/[0.08]">
                {data.employees.map((row) => (
                  <li key={row.employeeId}>
                    <Link
                      href={`/s/${slug}/admin/payroll/${row.employeeId}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
                      className="flex items-center gap-3 bg-white/90 px-4 py-3.5 transition hover:bg-brand-warm/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-brand-ink">{row.name}</p>
                        <p className="text-xs text-brand-text-muted">
                          Base {formatMoney(row.baseProrated)} · comisión{" "}
                          {formatMoney(row.commission)} · {row.commissionRate}%
                          · {row.lineCount} servicio
                          {row.lineCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold tracking-[0.08em] text-brand-text-muted uppercase">
                          A pagar
                        </p>
                        <p className="font-serif text-xl tracking-tight text-brand-ink tabular-nums">
                          {formatMoney(row.total)}
                        </p>
                      </div>
                      <ChevronRight
                        size={18}
                        className="shrink-0 text-brand-text-muted"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminSection>
        </>
      ) : null}
    </div>
  );
}
