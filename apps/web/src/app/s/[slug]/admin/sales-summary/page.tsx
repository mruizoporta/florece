"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { LoadingSpinner, MessageBanner } from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { getMe, listBranches } from "@/lib/auth";

type BranchSales = {
  tenantId: number;
  name: string;
  slug: string;
  orderCount: number;
  totalRevenue: number;
};

type SalesSummary = {
  from: string;
  to: string;
  branches: BranchSales[];
  totalRevenue: number;
  totalOrders: number;
};

function monthStartIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function SalesSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { formatMoney } = useSalonMoney();
  const [from, setFrom] = useState(monthStartIso);
  const [to, setTo] = useState(todayIso);
  const [data, setData] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    getMe()
      .then((me) => {
        const isOwner =
          me?.user?.orgRole === "OWNER" ||
          Boolean(me?.user?.roles?.includes("Admin"));
        setAllowed(Boolean(isOwner));
      })
      .catch(() => setAllowed(false));
  }, []);

  useEffect(() => {
    listBranches(slug).then((branches) => {
      if (branches.length <= 1) {
        router.replace(`/s/${slug}/admin`);
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
    api<SalesSummary>(`/organizations/sales-summary?${query}`, {
      auth: true,
      tenantSlug: slug,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar el resumen");
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
      <MessageBanner type="error" message="Solo el dueño puede ver el consolidado por sucursal." />
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-brand-ink">Resumen por sucursal</h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          Consulta lo facturado en caja de cada sucursal. La operación de caja
          sigue siendo local en cada sitio.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-brand-text-muted">Desde</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-brand-ink/10 bg-brand-elevated px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-brand-text-muted">Hasta</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-brand-ink/10 bg-brand-elevated px-3 py-2"
          />
        </label>
      </div>

      {error ? <MessageBanner type="error" message={error} /> : null}
      {loading ? <LoadingSpinner /> : null}

      {!loading && data ? (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-brand-ink/[0.06] bg-brand-elevated/70 p-5">
              <p className="text-xs uppercase tracking-wide text-brand-text-muted">
                Ventas totales
              </p>
              <p className="mt-2 font-serif text-3xl text-brand-ink">
                {formatMoney(data.totalRevenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-ink/[0.06] bg-brand-elevated/70 p-5">
              <p className="text-xs uppercase tracking-wide text-brand-text-muted">
                Tickets
              </p>
              <p className="mt-2 font-serif text-3xl text-brand-ink">
                {data.totalOrders}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-brand-ink/[0.06] bg-brand-elevated/70">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-ink/[0.06] text-xs uppercase tracking-wide text-brand-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Sucursal</th>
                  <th className="px-4 py-3 font-medium">Tickets</th>
                  <th className="px-4 py-3 font-medium">Ventas</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {data.branches.map((branch) => (
                  <tr
                    key={branch.tenantId}
                    className="border-b border-brand-ink/[0.04] last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-ink">{branch.name}</p>
                      <p className="text-xs text-brand-text-muted">
                        /{branch.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-brand-ink">{branch.orderCount}</td>
                    <td className="px-4 py-3 text-brand-ink">
                      {formatMoney(branch.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/s/${branch.slug}/admin/orders`}
                        className="text-xs font-semibold text-brand-champagne hover:underline"
                      >
                        Ver caja
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
