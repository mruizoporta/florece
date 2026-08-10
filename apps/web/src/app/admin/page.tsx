"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CircleDollarSign,
  Receipt,
  Wallet,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";
import {
  PlatformPageHeader,
  PlatformSurface,
  StatusBadge,
} from "@/components/platform/PlatformUi";

type Overview = {
  totalTenants: number;
  statusCounts: Record<string, number>;
  revenueThisMonth: number;
  paymentsThisMonth: number;
  totalPayments: number;
  expiringSoon: Array<{
    tenantId: number;
    name: string;
    slug: string;
    status: string;
    plan: string | null;
    periodEnd: string | null;
  }>;
};

export default function PlatformOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    platformApi<Overview>("/overview")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  if (error) {
    return (
      <PlatformSurface className="text-sm text-red-700">{error}</PlatformSurface>
    );
  }
  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-brand-ink/8" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-[1.35rem] bg-brand-ink/6"
            />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Salones",
      value: data.totalTenants,
      icon: Building2,
      hint: "Tenants activos en plataforma",
    },
    {
      label: "Ingresos del mes",
      value: `C$ ${data.revenueThisMonth.toLocaleString("es-NI")}`,
      icon: CircleDollarSign,
      hint: "Pagos registrados este mes",
    },
    {
      label: "Pagos del mes",
      value: data.paymentsThisMonth,
      icon: Wallet,
      hint: "Cantidad de cobros",
    },
    {
      label: "Pagos totales",
      value: data.totalPayments,
      icon: Receipt,
      hint: "Histórico",
    },
  ];

  return (
    <div className="space-y-8">
      <PlatformPageHeader
        eyebrow="Operación"
        title="Overview"
        description="Cobro manual NI: trial, pagos y salones por vencer."
        actions={
          <Link href="/admin/tenants/new" className="btn-primary !rounded-2xl !py-2.5">
            Nuevo salón
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <PlatformSurface key={c.label} className="!p-4 sm:!p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-bold tracking-[0.14em] text-brand-text-muted uppercase">
                  {c.label}
                </p>
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-primary/20 text-brand-ink">
                  <Icon size={17} />
                </span>
              </div>
              <p className="mt-4 font-serif text-[2.15rem] leading-none tracking-tight text-brand-ink">
                {c.value}
              </p>
              <p className="mt-2 text-xs text-brand-text-muted">{c.hint}</p>
            </PlatformSurface>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PlatformSurface>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-brand-ink">
            Por estado
          </h2>
          <ul className="mt-5 space-y-3">
            {Object.entries(data.statusCounts).map(([status, count]) => {
              const total = data.totalTenants || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <li key={status}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <StatusBadge status={status} />
                    <span className="text-sm font-semibold text-brand-ink">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-brand-ink/6">
                    <div
                      className="h-full rounded-full bg-brand-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
            {Object.keys(data.statusCounts).length === 0 ? (
              <li className="text-sm text-brand-text-muted">Sin salones aún.</li>
            ) : null}
          </ul>
        </PlatformSurface>

        <PlatformSurface>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-brand-ink">
              Por vencer
            </h2>
            <Link
              href="/admin/tenants"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-text-muted hover:text-brand-ink"
            >
              Ver todos
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <ul className="mt-5 divide-y divide-brand-ink/[0.06]">
            {data.expiringSoon.map((t) => (
              <li key={t.tenantId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/tenants/${t.tenantId}`}
                    className="font-semibold text-brand-ink hover:underline"
                  >
                    {t.name}
                  </Link>
                  <p className="truncate text-xs text-brand-text-muted">
                    {t.plan ?? "Sin plan"} · /
                    {t.slug}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={t.status} />
                  <p className="mt-1 text-[11px] text-brand-text-muted">
                    {t.periodEnd
                      ? new Date(t.periodEnd).toLocaleDateString("es-NI")
                      : "—"}
                  </p>
                </div>
              </li>
            ))}
            {data.expiringSoon.length === 0 ? (
              <li className="py-6 text-sm text-brand-text-muted">
                Nada por vencer en 7 días.
              </li>
            ) : null}
          </ul>
        </PlatformSurface>
      </div>
    </div>
  );
}
