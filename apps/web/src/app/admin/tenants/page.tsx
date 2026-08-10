"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Plus, Search } from "lucide-react";
import { platformApi } from "@/lib/platform-api";
import {
  PlatformPageHeader,
  PlatformSurface,
  StatusBadge,
} from "@/components/platform/PlatformUi";

type TenantRow = {
  id: number;
  name: string;
  slug: string;
  subscriptionStatus: string;
  billingEmail: string | null;
  plan: { name: string; slug: string } | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
};

function daysUntil(iso?: string | null) {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function endDateFor(t: TenantRow) {
  if (t.subscriptionStatus === "trial") {
    return t.trialEndsAt ?? t.subscriptionEndsAt;
  }
  return t.subscriptionEndsAt ?? t.trialEndsAt;
}

export default function PlatformTenantsPage() {
  const [rows, setRows] = useState<TenantRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(nextQ = q, nextStatus = status) {
    setLoading(true);
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextStatus) params.set("status", nextStatus);
    const qs = params.toString();
    const data = await platformApi<TenantRow[]>(
      `/tenants${qs ? `?${qs}` : ""}`,
    );
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    load().catch(() => undefined);
  }

  const expiringSoon = useMemo(() => {
    return rows
      .map((t) => {
        const end = endDateFor(t);
        const days = daysUntil(end);
        return { tenant: t, end, days };
      })
      .filter(
        (x) =>
          x.days != null &&
          x.days >= 0 &&
          x.days <= 7 &&
          (x.tenant.subscriptionStatus === "active" ||
            x.tenant.subscriptionStatus === "trial"),
      )
      .sort((a, b) => (a.days ?? 99) - (b.days ?? 99));
  }, [rows]);

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        eyebrow="Tenants"
        title="Salones"
        description="Buscá, filtrá y gestioná el ciclo de vida de cada cuenta."
        actions={
          <Link
            href="/admin/tenants/new"
            className="btn-primary !inline-flex !rounded-2xl !py-2.5"
          >
            <Plus size={16} />
            Nuevo salón
          </Link>
        }
      />

      {expiringSoon.length > 0 ? (
        <PlatformSurface className="!border-amber-200/80 !bg-amber-50/70 !p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <AlertTriangle size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-amber-950">
                {expiringSoon.length} salón
                {expiringSoon.length === 1 ? "" : "es"} por vencer (≤7 días)
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-amber-950/80">
                {expiringSoon.slice(0, 6).map(({ tenant, days }) => (
                  <li key={tenant.id} className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/tenants/${tenant.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {tenant.name}
                    </Link>
                    <span className="text-amber-900/55">
                      ·{" "}
                      {days === 0
                        ? "vence hoy"
                        : `${days} día${days === 1 ? "" : "s"}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </PlatformSurface>
      ) : null}

      <PlatformSurface className="!p-4">
        <form
          onSubmit={onSearch}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="min-w-[14rem] flex-1">
            <label className="label-field">Buscar</label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-text-muted"
              />
              <input
                className="input-field !pl-10"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre, slug o email"
              />
            </div>
          </div>
          <div className="w-40">
            <label className="label-field">Estado</label>
            <select
              className="input-field"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="trial">trial</option>
              <option value="active">active</option>
              <option value="past_due">past_due</option>
              <option value="suspended">suspended</option>
            </select>
          </div>
          <button type="submit" className="btn-secondary !rounded-2xl !py-3">
            Filtrar
          </button>
        </form>
      </PlatformSurface>

      <PlatformSurface padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-ink/[0.06] bg-brand-warm/90 text-[11px] tracking-[0.12em] text-brand-text-muted uppercase">
                <th className="px-5 py-3.5 font-bold">Salón</th>
                <th className="px-5 py-3.5 font-bold">Estado</th>
                <th className="px-5 py-3.5 font-bold">Plan</th>
                <th className="px-5 py-3.5 font-bold">Vence</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-brand-text-muted">
                    Cargando…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-brand-text-muted">
                    Sin resultados. Probá otro filtro o creá un salón.
                  </td>
                </tr>
              ) : (
                rows.map((t) => {
                  const end = endDateFor(t);
                  const days = daysUntil(end);
                  const soon =
                    days != null &&
                    days >= 0 &&
                    days <= 7 &&
                    (t.subscriptionStatus === "active" ||
                      t.subscriptionStatus === "trial");
                  const overdue = days != null && days < 0;

                  return (
                    <tr
                      key={t.id}
                      className={`border-t border-brand-ink/[0.05] transition hover:bg-brand-warm/50 ${
                        soon ? "bg-amber-50/60" : overdue ? "bg-red-50/40" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/tenants/${t.id}`}
                          className="font-semibold text-brand-ink hover:underline"
                        >
                          {t.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-brand-text-muted">
                          /{t.slug}
                          {t.billingEmail ? ` · ${t.billingEmail}` : ""}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={t.subscriptionStatus} />
                      </td>
                      <td className="px-5 py-4 text-brand-ink">
                        {t.plan?.name ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        {end ? (
                          <div>
                            <p
                              className={
                                soon
                                  ? "font-medium text-amber-800"
                                  : overdue
                                    ? "font-medium text-red-700"
                                    : "text-brand-text-muted"
                              }
                            >
                              {new Date(end).toLocaleDateString("es-NI")}
                            </p>
                            {soon ? (
                              <p className="text-xs text-amber-700">
                                {days === 0
                                  ? "Vence hoy"
                                  : `${days} día${days === 1 ? "" : "s"}`}
                              </p>
                            ) : null}
                            {overdue ? (
                              <p className="text-xs text-red-600">Vencido</p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-brand-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </PlatformSurface>
    </div>
  );
}
