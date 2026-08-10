"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  AdminPageHeader,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { getMe, listBranches } from "@/lib/auth";

type BranchProfit = {
  tenantId: number;
  name: string;
  slug: string;
  income: number;
  expenses: number;
  profit: number;
  orderCount: number;
  expenseCount: number;
};

type OrgProfit = {
  from: string;
  to: string;
  branches: BranchProfit[];
  income: number;
  expenses: number;
  profit: number;
};

function monthStartIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AccountingBranchesProfitPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { formatMoney } = useSalonMoney();
  const [from, setFrom] = useState(monthStartIso);
  const [to, setTo] = useState(todayIso);
  const [data, setData] = useState<OrgProfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then((me) => {
        setAllowed(
          me?.user?.orgRole === "OWNER" ||
            Boolean(me?.user?.roles?.includes("Admin")),
        );
      })
      .catch(() => setAllowed(false));
  }, []);

  useEffect(() => {
    listBranches(slug).then((branches) => {
      if (branches.length <= 1) {
        router.replace(`/s/${slug}/admin/accounting`);
      }
    });
  }, [slug, router]);

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
    if (!allowed) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<OrgProfit>(`/organizations/profit-summary?${query}`, {
      auth: true,
      tenantSlug: slug,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar el consolidado");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [allowed, query, slug]);

  if (!allowed) {
    return (
      <MessageBanner
        type="error"
        message="Solo el dueño puede ver la utilidad consolidada por sucursal."
      />
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Utilidad por sucursal"
        subtitle="Consulta consolidada. Cada caja y egreso sigue siendo local."
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-brand-text-muted">Desde</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input-field py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-brand-text-muted">Hasta</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input-field py-2"
          />
        </label>
      </div>

      {error ? <MessageBanner type="error" message={error} /> : null}
      {loading ? <LoadingSpinner /> : null}

      {!loading && data ? (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="admin-stat-card pl-6">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">
                Ingresos
              </p>
              <p className="mt-3 font-serif text-3xl">{formatMoney(data.income)}</p>
            </div>
            <div className="admin-stat-card pl-6">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">
                Egresos
              </p>
              <p className="mt-3 font-serif text-3xl">
                {formatMoney(data.expenses)}
              </p>
            </div>
            <div className="admin-stat-card pl-6">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">
                Utilidad
              </p>
              <p className="mt-3 font-serif text-3xl">{formatMoney(data.profit)}</p>
            </div>
          </div>

          <div className="admin-card overflow-hidden p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-ink/[0.06] text-xs uppercase tracking-wide text-brand-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Sucursal</th>
                  <th className="px-4 py-3 font-medium">Ingresos</th>
                  <th className="px-4 py-3 font-medium">Egresos</th>
                  <th className="px-4 py-3 font-medium">Utilidad</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {data.branches.map((b) => (
                  <tr
                    key={b.tenantId}
                    className="border-b border-brand-ink/[0.04] last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-ink">{b.name}</p>
                      <p className="text-xs text-brand-text-muted">/{b.slug}</p>
                    </td>
                    <td className="px-4 py-3">{formatMoney(b.income)}</td>
                    <td className="px-4 py-3">{formatMoney(b.expenses)}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatMoney(b.profit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/s/${b.slug}/admin/accounting`}
                        className="text-xs font-semibold text-brand-champagne hover:underline"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
