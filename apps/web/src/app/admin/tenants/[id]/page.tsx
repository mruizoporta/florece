"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { platformApi } from "@/lib/platform-api";
import {
  PlatformPageHeader,
  PlatformSurface,
  StatusBadge,
} from "@/components/platform/PlatformUi";

type Plan = {
  slug: string;
  name: string;
  priceNioMonthly: number | null;
};

type Payment = {
  id: number;
  amount: number;
  currency: string;
  method: string;
  reference: string | null;
  paidAt: string;
  months: number;
  note: string | null;
};

type TenantDetail = {
  id: number;
  name: string;
  slug: string;
  subscriptionStatus: string;
  billingEmail: string | null;
  adminNote: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  plan: Plan | null;
  owners: Array<{ id: number; name: string; email: string }>;
  payments: Payment[];
};

export default function PlatformTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [t, p] = await Promise.all([
      platformApi<TenantDetail>(`/tenants/${id}`),
      platformApi<Plan[]>("/plans"),
    ]);
    setTenant(t);
    setPlans(p);
  }, [id]);

  useEffect(() => {
    reload().catch((e) =>
      setError(e instanceof Error ? e.message : "Error al cargar"),
    );
  }, [reload]);

  async function runAction(path: string, body?: unknown) {
    setError(null);
    setMessage(null);
    try {
      await platformApi(path, { method: "POST", body });
      await reload();
      setMessage("Actualizado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  async function saveNote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    try {
      await platformApi(`/tenants/${id}`, {
        method: "PATCH",
        body: {
          adminNote: String(fd.get("adminNote") || "") || null,
          planSlug: String(fd.get("planSlug") || "") || undefined,
        },
      });
      await reload();
      setMessage("Guardado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function recordPayment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    try {
      await platformApi(`/tenants/${id}/payments`, {
        method: "POST",
        body: {
          amount: Number(fd.get("amount")),
          currency: String(fd.get("currency") || "NIO"),
          method: String(fd.get("method") || "TRANSFER"),
          reference: String(fd.get("reference") || "") || undefined,
          months: Number(fd.get("months") || 1),
          note: String(fd.get("note") || "") || undefined,
          planSlug: String(fd.get("planSlug") || "") || undefined,
        },
      });
      await reload();
      setMessage("Pago registrado — período activado");
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function resetPassword() {
    setError(null);
    try {
      const res = await platformApi<{
        ownerEmail: string;
        temporaryPassword: string;
      }>(`/tenants/${id}/reset-owner-password`, { method: "POST" });
      setMessage(
        `Nueva clave para ${res.ownerEmail}: ${res.temporaryPassword}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  if (error && !tenant) {
    return (
      <PlatformSurface className="text-sm text-red-700">{error}</PlatformSurface>
    );
  }
  if (!tenant) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-brand-ink/8" />
        <div className="h-48 animate-pulse rounded-[1.35rem] bg-brand-ink/6" />
      </div>
    );
  }

  const actionBtn =
    "rounded-2xl border border-brand-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-brand-ink transition hover:border-brand-ink/20 hover:bg-brand-warm";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/tenants"
          className="text-xs font-semibold tracking-wide text-brand-text-muted uppercase hover:text-brand-ink"
        >
          ← Salones
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <PlatformPageHeader
            eyebrow={`/${tenant.slug}`}
            title={tenant.name}
            description={`${tenant.plan?.name ?? "Sin plan"} · ${
              tenant.owners[0]?.email ?? "Sin admin"
            }`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={tenant.subscriptionStatus} />
            <a
              href={`/s/${tenant.slug}/admin`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary !inline-flex !rounded-2xl !py-2.5 !text-xs"
            >
              <ExternalLink size={14} />
              Panel salón
            </a>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-900 ring-1 ring-emerald-500/20">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-800 ring-1 ring-red-500/20">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <PlatformSurface>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-brand-ink">
            Ciclo de vida
          </h2>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl bg-brand-warm/70 px-3.5 py-3">
              <dt className="text-[11px] font-bold tracking-wide text-brand-text-muted uppercase">
                Trial
              </dt>
              <dd className="mt-1 font-semibold text-brand-ink">
                {tenant.trialEndsAt
                  ? new Date(tenant.trialEndsAt).toLocaleDateString("es-NI")
                  : "—"}
              </dd>
            </div>
            <div className="rounded-2xl bg-brand-warm/70 px-3.5 py-3">
              <dt className="text-[11px] font-bold tracking-wide text-brand-text-muted uppercase">
                Suscripción
              </dt>
              <dd className="mt-1 font-semibold text-brand-ink">
                {tenant.subscriptionEndsAt
                  ? new Date(tenant.subscriptionEndsAt).toLocaleDateString(
                      "es-NI",
                    )
                  : "—"}
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className={actionBtn}
              onClick={() =>
                runAction(`/tenants/${id}/extend-trial`, { days: 7 })
              }
            >
              +7 días trial
            </button>
            <button
              type="button"
              className={actionBtn}
              onClick={() => runAction(`/tenants/${id}/mark-past-due`)}
            >
              Past due
            </button>
            <button
              type="button"
              className={actionBtn}
              onClick={() => runAction(`/tenants/${id}/suspend`)}
            >
              Suspender
            </button>
            <button
              type="button"
              className={actionBtn}
              onClick={() => runAction(`/tenants/${id}/reactivate`)}
            >
              Reactivar
            </button>
            <button
              type="button"
              className={`${actionBtn} !border-amber-400/40 !text-amber-900`}
              onClick={resetPassword}
            >
              Reset password
            </button>
          </div>
        </PlatformSurface>

        <PlatformSurface>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-brand-ink">
            Editar
          </h2>
          <form onSubmit={saveNote} className="mt-5 space-y-3">
            <div>
              <label className="label-field">Plan</label>
              <select
                name="planSlug"
                className="input-field"
                defaultValue={tenant.plan?.slug ?? ""}
              >
                <option value="">—</option>
                {plans.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                    {p.priceNioMonthly != null
                      ? ` · C$ ${p.priceNioMonthly}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Nota interna</label>
              <textarea
                name="adminNote"
                className="input-field"
                rows={4}
                defaultValue={tenant.adminNote ?? ""}
              />
            </div>
            <button type="submit" className="btn-primary !rounded-2xl">
              Guardar
            </button>
          </form>
        </PlatformSurface>
      </div>

      <PlatformSurface>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-brand-ink">
          Registrar pago manual
        </h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          Transferencia / depósito / efectivo → activa el período.
        </p>
        <form
          onSubmit={recordPayment}
          className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div>
            <label className="label-field">Monto</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="1"
              className="input-field"
              required
              defaultValue={tenant.plan?.priceNioMonthly ?? 699}
            />
          </div>
          <div>
            <label className="label-field">Moneda</label>
            <select name="currency" className="input-field" defaultValue="NIO">
              <option value="NIO">NIO</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="label-field">Método</label>
            <select name="method" className="input-field" defaultValue="TRANSFER">
              <option value="TRANSFER">Transferencia</option>
              <option value="DEPOSIT">Depósito</option>
              <option value="CASH">Efectivo</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
          <div>
            <label className="label-field">Meses</label>
            <input
              name="months"
              type="number"
              min={1}
              max={36}
              defaultValue={1}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Referencia</label>
            <input name="reference" className="input-field" />
          </div>
          <div>
            <label className="label-field">Plan (opcional)</label>
            <select name="planSlug" className="input-field" defaultValue="">
              <option value="">Mantener actual</option>
              {plans.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label-field">Nota</label>
            <input name="note" className="input-field" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" className="btn-primary !rounded-2xl">
              Registrar pago y activar
            </button>
          </div>
        </form>
      </PlatformSurface>

      <PlatformSurface padded={false}>
        <div className="border-b border-brand-ink/[0.06] px-5 py-4">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-brand-ink">
            Pagos
          </h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-[#faf8f4]/90 text-[11px] tracking-[0.12em] text-brand-text-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-bold">Fecha</th>
              <th className="px-5 py-3 font-bold">Monto</th>
              <th className="px-5 py-3 font-bold">Método</th>
              <th className="px-5 py-3 font-bold">Meses</th>
              <th className="px-5 py-3 font-bold">Ref</th>
            </tr>
          </thead>
          <tbody>
            {tenant.payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-brand-text-muted">
                  Sin pagos registrados.
                </td>
              </tr>
            ) : (
              tenant.payments.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-brand-ink/[0.05] hover:bg-brand-warm/40"
                >
                  <td className="px-5 py-3.5">
                    {new Date(p.paidAt).toLocaleDateString("es-NI")}
                  </td>
                  <td className="px-5 py-3.5 font-semibold">
                    {p.currency} {p.amount.toLocaleString("es-NI")}
                  </td>
                  <td className="px-5 py-3.5">{p.method}</td>
                  <td className="px-5 py-3.5">{p.months}</td>
                  <td className="px-5 py-3.5 text-brand-text-muted">
                    {p.reference ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </PlatformSurface>
    </div>
  );
}
