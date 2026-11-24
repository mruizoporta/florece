"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams } from "next/navigation";
import {
  CalendarDays,
  Download,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminPageHeader, LoadingSpinner, MessageBanner } from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { formatDate } from "@/lib/format";

type Kpis = {
  sales: number;
  tickets: number;
  avgTicket: number;
  customers: number;
  servicesSales: number;
  productsSales: number;
  productsCost?: number;
  suppliesCost?: number;
  discounts?: number;
};
type TopRow = { name: string; qty: number; amount: number; cost?: number };
type Report = {
  from: string;
  to: string;
  days: number;
  previous: { from: string; to: string };
  kpis: { current: Kpis; previous: Kpis };
  daily: Array<{ date: string; sales: number; tickets: number }>;
  services: TopRow[];
  products: TopRow[];
  employees: Array<{
    id: number;
    name: string;
    sales: number;
    services: number;
    commission: number;
    tickets: number;
    avgTicket: number;
  }>;
  payments: Array<{ method: string; amount: number }>;
  appointments: {
    total: number;
    previousTotal: number;
    byStatus: Array<{ name: string; color: string | null; count: number }>;
  };
  customers: {
    identified: number;
    anonymousTickets: number;
    new: number;
    returning: number;
    top: Array<{ name: string; visits: number; amount: number }>;
  };
};

const METHOD_LABEL: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
  voucher: "Bono / gift card",
};

// Los estados guardan un tono con nombre (danger, warning…), no un color.
const STATUS_DOT: Record<string, string> = {
  danger: "bg-red-500",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
  info: "bg-sky-500",
  primary: "bg-brand-primary",
  secondary: "bg-slate-500",
};

const ymd = (d: Date) => d.toLocaleDateString("en-CA");
const day = (s: string) => formatDate(`${s}T12:00:00`);

function presets() {
  const now = new Date();
  const today = ymd(now);
  const back = (n: number) => ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n));
  return [
    { key: "today", label: "Hoy", from: today, to: today },
    { key: "7", label: "7 días", from: back(6), to: today },
    { key: "month", label: "Este mes", from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: today },
    {
      key: "last",
      label: "Mes pasado",
      from: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: ymd(new Date(now.getFullYear(), now.getMonth(), 0)),
    },
    { key: "90", label: "90 días", from: back(89), to: today },
  ];
}

/** Variación contra el período anterior; null cuando antes no hubo nada con qué comparar. */
function delta(current: number, previous: number) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function Delta({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-brand-text-muted">sin datos previos</span>;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        up ? "text-emerald-700" : "text-red-700"
      }`}
    >
      <Icon size={13} strokeWidth={2.4} />
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(0)}%
    </span>
  );
}

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ReportsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { formatMoney } = useSalonMoney();
  const ranges = useMemo(presets, []);
  const [from, setFrom] = useState(ranges[2].from);
  const [to, setTo] = useState(ranges[2].to);
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<Report>(`/v1/reports/overview?from=${from}&to=${to}`, { tenantSlug: slug, auth: true })
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Error"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, from, to]);

  const activePreset = ranges.find((r) => r.from === from && r.to === to)?.key;

  function exportCsv() {
    if (!data) return;
    const rows: Array<Array<string | number>> = [
      [`Reporte del ${data.from} al ${data.to}`],
      [],
      ["Resumen", "Período", "Período anterior"],
      ["Ventas", data.kpis.current.sales, data.kpis.previous.sales],
      ["Tickets", data.kpis.current.tickets, data.kpis.previous.tickets],
      ["Ticket promedio", data.kpis.current.avgTicket, data.kpis.previous.avgTicket],
      ["Citas", data.appointments.total, data.appointments.previousTotal],
      [],
      ["Fecha", "Ventas", "Tickets"],
      ...data.daily.map((d) => [d.date, d.sales, d.tickets]),
      [],
      ["Servicio", "Cantidad", "Monto"],
      ...data.services.map((s) => [s.name, s.qty, s.amount]),
      [],
      ["Producto", "Cantidad", "Monto", "Costo", "Ganancia"],
      ...data.products.map((s) => [s.name, s.qty, s.amount, s.cost ?? 0, s.amount - (s.cost ?? 0)]),
      [],
      ["Profesional", "Servicios", "Ventas", "Ticket promedio", "Comisión"],
      ...data.employees.map((e) => [e.name, e.services, e.sales, e.avgTicket, e.commission]),
      [],
      ["Forma de pago", "Monto"],
      ...data.payments.map((p) => [METHOD_LABEL[p.method] ?? p.method, p.amount]),
    ];
    // BOM para que Excel abra bien los acentos.
    const blob = new Blob(["﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${data.from}-al-${data.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cur = data?.kpis.current;
  const prev = data?.kpis.previous;
  const tiles: Array<{
    label: string;
    value: string;
    delta: number | null;
    icon: LucideIcon;
    accent: string;
    light: string;
  }> =
    cur && prev && data
      ? [
          { label: "Ventas", value: formatMoney(cur.sales), delta: delta(cur.sales, prev.sales), icon: Wallet, accent: "5, 150, 105", light: "110, 231, 183" },
          { label: "Tickets", value: String(cur.tickets), delta: delta(cur.tickets, prev.tickets), icon: Receipt, accent: "124, 58, 237", light: "196, 181, 253" },
          { label: "Ticket promedio", value: formatMoney(cur.avgTicket), delta: delta(cur.avgTicket, prev.avgTicket), icon: TrendingUp, accent: "2, 132, 199", light: "125, 211, 252" },
          { label: "Citas", value: String(data.appointments.total), delta: delta(data.appointments.total, data.appointments.previousTotal), icon: CalendarDays, accent: "217, 119, 6", light: "252, 211, 77" },
        ]
      : [];

  const maxDaily = Math.max(1, ...(data?.daily.map((d) => d.sales) ?? [1]));
  const hovered = hover != null ? data?.daily[hover] : null;

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="Reportes"
        subtitle="Cómo le fue al salón: ventas, servicios, equipo, citas y clientas."
        action={
          <button
            type="button"
            onClick={exportCsv}
            disabled={!data}
            className="btn-secondary inline-flex items-center gap-2 py-2.5 text-sm disabled:opacity-50"
          >
            <Download size={15} />
            Exportar a Excel
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl bg-brand-ink/[0.05] p-1 text-sm">
          {ranges.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => {
                setFrom(r.from);
                setTo(r.to);
              }}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                activePreset === r.key
                  ? "bg-brand-elevated text-brand-ink shadow-sm"
                  : "text-brand-text-muted hover:text-brand-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            aria-label="Desde"
            className="input-field !w-auto !py-2"
            value={from}
            max={to}
            onChange={(e) => e.target.value && setFrom(e.target.value)}
          />
          <span className="text-brand-text-muted">a</span>
          <input
            type="date"
            aria-label="Hasta"
            className="input-field !w-auto !py-2"
            value={to}
            min={from}
            onChange={(e) => e.target.value && setTo(e.target.value)}
          />
        </div>
      </div>

      {error ? <MessageBanner message={error} type="error" /> : null}
      {loading && !data ? <LoadingSpinner /> : null}

      {data && cur ? (
        <div className={`space-y-5 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {tiles.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.label}
                  className="admin-stat-card"
                  style={{ "--accent": t.accent, "--accent-light": t.light } as CSSProperties}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">
                      {t.label}
                    </p>
                    <span className="admin-stat-icon">
                      <Icon size={17} strokeWidth={2} />
                    </span>
                  </div>
                  <p className="mt-3 font-serif text-[1.6rem] leading-none font-semibold tracking-tight text-brand-ink sm:text-[1.8rem]">
                    {t.value}
                  </p>
                  <p className="mt-2">
                    <Delta value={t.delta} />
                  </p>
                </div>
              );
            })}
          </div>
          <p className="-mt-2 text-xs text-brand-text-muted">
            Comparado con {day(data.previous.from)} – {day(data.previous.to)}.
          </p>

          <section className="admin-card">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-xl text-brand-ink">Ventas por día</h2>
              <p className="text-sm text-brand-text-muted" aria-live="polite">
                {hovered
                  ? `${day(hovered.date)} · ${formatMoney(hovered.sales)} · ${hovered.tickets} ticket${hovered.tickets === 1 ? "" : "s"}`
                  : `Servicios ${formatMoney(cur.servicesSales)}${
                      cur.suppliesCost ? ` (insumos ${formatMoney(cur.suppliesCost)})` : ""
                    } · Productos ${formatMoney(cur.productsSales)}${
                      cur.productsCost ? ` (ganancia ${formatMoney(cur.productsSales - cur.productsCost)})` : ""
                    }${cur.discounts ? ` · Descuentos dados ${formatMoney(cur.discounts)}` : ""}`}
              </p>
            </div>
            {cur.sales === 0 ? (
              <p className="py-10 text-center text-sm text-brand-text-muted">
                No hubo ventas cobradas en este período.
              </p>
            ) : (
              <>
                <div
                  className="flex h-44 items-end gap-[2px] border-b border-brand-ink/10"
                  onMouseLeave={() => setHover(null)}
                >
                  {data.daily.map((d, i) => (
                    <button
                      key={d.date}
                      type="button"
                      onMouseEnter={() => setHover(i)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      aria-label={`${day(d.date)}: ${formatMoney(d.sales)}`}
                      className="group relative flex h-full min-w-0 flex-1 items-end"
                    >
                      <span
                        className={`w-full rounded-t-[4px] transition-colors ${
                          hover === i ? "bg-brand-ink" : "bg-brand-primary"
                        } ${d.sales === 0 ? "opacity-0" : ""}`}
                        style={{ height: `${Math.max((d.sales / maxDaily) * 100, d.sales ? 2 : 0)}%` }}
                      />
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-brand-text-muted">
                  <span>{day(data.from)}</span>
                  <span>Máx. {formatMoney(maxDaily)}</span>
                  <span>{day(data.to)}</span>
                </div>
              </>
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <TopList title="Servicios más vendidos" rows={data.services} empty="Sin servicios cobrados." formatMoney={formatMoney} />
            <TopList title="Productos más vendidos" rows={data.products} empty="Sin productos vendidos." formatMoney={formatMoney} />
          </div>

          <section className="admin-card">
            <h2 className="mb-4 font-serif text-xl text-brand-ink">Equipo</h2>
            {data.employees.length === 0 ? (
              <p className="text-sm text-brand-text-muted">Ningún servicio con profesional asignado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-ink/[0.06] text-[11px] font-bold tracking-[0.1em] text-brand-text-muted uppercase">
                      <th className="py-2.5 pr-3">Profesional</th>
                      <th className="py-2.5 pr-3 text-right">Servicios</th>
                      <th className="py-2.5 pr-3 text-right">Ventas</th>
                      <th className="py-2.5 pr-3 text-right">Ticket prom.</th>
                      <th className="py-2.5 text-right">Comisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.employees.map((e) => (
                      <tr key={e.id} className="border-b border-brand-ink/[0.04] last:border-0">
                        <td className="py-3 pr-3 font-medium text-brand-ink">{e.name}</td>
                        <td className="py-3 pr-3 text-right tabular-nums">{e.services}</td>
                        <td className="py-3 pr-3 text-right font-semibold tabular-nums text-brand-ink">{formatMoney(e.sales)}</td>
                        <td className="py-3 pr-3 text-right tabular-nums text-brand-text-muted">{formatMoney(e.avgTicket)}</td>
                        <td className="py-3 text-right tabular-nums text-brand-text-muted">{formatMoney(e.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-3">
            <section className="admin-card">
              <h2 className="mb-4 font-serif text-xl text-brand-ink">Citas</h2>
              {data.appointments.total === 0 ? (
                <p className="text-sm text-brand-text-muted">Sin citas en el período.</p>
              ) : (
                <ul className="space-y-3">
                  {data.appointments.byStatus.map((s) => (
                    <li key={s.name}>
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2 text-brand-ink">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[s.color ?? ""] ?? "bg-brand-ink/30"}`}
                          />
                          {s.name}
                        </span>
                        <span className="tabular-nums text-brand-text-muted">
                          {s.count} · {Math.round((s.count / data.appointments.total) * 100)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-ink/[0.07]">
                        <div
                          className="h-full rounded-full bg-brand-primary"
                          style={{ width: `${(s.count / data.appointments.total) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="admin-card">
              <h2 className="mb-4 font-serif text-xl text-brand-ink">Clientas</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-brand-warm/70 p-3">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-brand-text-muted uppercase">Nuevas</p>
                  <p className="font-serif text-2xl text-brand-ink">{data.customers.new}</p>
                </div>
                <div className="rounded-2xl bg-brand-warm/70 p-3">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-brand-text-muted uppercase">Volvieron</p>
                  <p className="font-serif text-2xl text-brand-ink">{data.customers.returning}</p>
                </div>
              </div>
              {data.customers.top.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm">
                  {data.customers.top.map((c, i) => (
                    <li key={`${c.name}-${i}`} className="flex justify-between gap-3">
                      <span className="truncate text-brand-ink">
                        {c.name}
                        <span className="text-brand-text-muted"> · {c.visits} visita{c.visits === 1 ? "" : "s"}</span>
                      </span>
                      <span className="tabular-nums text-brand-ink">{formatMoney(c.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {data.customers.anonymousTickets > 0 ? (
                <p className="mt-3 text-xs text-brand-text-muted">
                  {data.customers.anonymousTickets} ticket{data.customers.anonymousTickets === 1 ? "" : "s"} sin clienta registrada.
                </p>
              ) : null}
            </section>

            <section className="admin-card">
              <h2 className="mb-4 font-serif text-xl text-brand-ink">Formas de pago</h2>
              {data.payments.length === 0 ? (
                <p className="text-sm text-brand-text-muted">Sin pagos en el período.</p>
              ) : (
                <ul className="space-y-3">
                  {data.payments.map((p) => {
                    const total = data.payments.reduce((s, x) => s + x.amount, 0) || 1;
                    return (
                      <li key={p.method}>
                        <div className="flex justify-between gap-2 text-sm">
                          <span className="text-brand-ink">{METHOD_LABEL[p.method] ?? p.method}</span>
                          <span className="tabular-nums text-brand-text-muted">
                            {formatMoney(p.amount)} · {Math.round((p.amount / total) * 100)}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-ink/[0.07]">
                          <div className="h-full rounded-full bg-brand-primary" style={{ width: `${(p.amount / total) * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TopList({
  title,
  rows,
  empty,
  formatMoney,
}: {
  title: string;
  rows: TopRow[];
  empty: string;
  formatMoney: (n?: number | null) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.amount));
  return (
    <section className="admin-card">
      <h2 className="mb-4 font-serif text-xl text-brand-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-brand-text-muted">{empty}</p>
      ) : (
        <ol className="space-y-3">
          {rows.map((r, i) => (
            <li key={`${r.name}-${i}`}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-brand-ink">
                  <span className="mr-2 text-brand-text-muted tabular-nums">{i + 1}.</span>
                  {r.name}
                  <span className="text-brand-text-muted"> · {r.qty}</span>
                  {r.cost && r.amount > 0 ? (
                    <span className="text-emerald-700">
                      {" "}
                      · margen {Math.round(((r.amount - r.cost) / r.amount) * 100)}%
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-brand-ink">{formatMoney(r.amount)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-ink/[0.07]">
                <div className="h-full rounded-full bg-brand-primary" style={{ width: `${(r.amount / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
