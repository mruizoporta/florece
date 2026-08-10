"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  AdminPageHeader,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { useLocale } from "@/components/LocaleProvider";
import type { I18nKey } from "@/lib/i18n";

type ProfitSummary = {
  from: string;
  to: string;
  income: number;
  expenses: number;
  profit: number;
  orderCount: number;
  expenseCount: number;
  byMethod: { method: string; amount: number }[];
  byCategory: {
    categoryId: number;
    name: string;
    slug: string;
    amount: number;
  }[];
};

function monthStartIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function methodKey(method: string): I18nKey {
  const m = method.toLowerCase();
  if (m === "cash") return "pay.cash";
  if (m === "card") return "pay.card";
  if (m === "transfer") return "pay.transfer";
  if (m === "other") return "pay.other";
  return "pay.other";
}

export default function AccountingProfitPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { formatMoney } = useSalonMoney();
  const { tr } = useLocale();
  const [from, setFrom] = useState(monthStartIso);
  const [to, setTo] = useState(todayIso);
  const [data, setData] = useState<ProfitSummary | null>(null);
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
    api<ProfitSummary>(`/v1/accounting/profit-summary?${query}`, {
      auth: true,
      tenantSlug: slug,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la utilidad");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, slug]);

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.accounting")}
        subtitle={tr("accounting.subtitle")}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/s/${slug}/admin/accounting/expenses`}
              className="btn-secondary py-2.5 text-sm"
            >
              {tr("admin.expenses")}
            </Link>
            <Link
              href={`/s/${slug}/admin/accounting/cash`}
              className="btn-secondary py-2.5 text-sm"
            >
              {tr("admin.cashClose")}
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-brand-text-muted">
            {tr("common.from")}
          </span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input-field py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-brand-text-muted">
            {tr("common.to")}
          </span>
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
                {tr("accounting.income")}
              </p>
              <p className="mt-3 font-serif text-3xl text-brand-ink">
                {formatMoney(data.income)}
              </p>
              <p className="mt-2 text-xs text-brand-text-muted">
                {data.orderCount} {tr("common.tickets")}
              </p>
            </div>
            <div className="admin-stat-card pl-6">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">
                {tr("accounting.expenses")}
              </p>
              <p className="mt-3 font-serif text-3xl text-brand-ink">
                {formatMoney(data.expenses)}
              </p>
              <p className="mt-2 text-xs text-brand-text-muted">
                {data.expenseCount} {tr("common.movements")}
              </p>
            </div>
            <div className="admin-stat-card pl-6">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">
                {tr("accounting.profit")}
              </p>
              <p
                className={`mt-3 font-serif text-3xl ${
                  data.profit >= 0 ? "text-brand-ink" : "text-red-700"
                }`}
              >
                {formatMoney(data.profit)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="admin-card">
              <h2 className="mb-4 font-serif text-xl text-brand-ink">
                {tr("accounting.byMethod")}
              </h2>
              {data.byMethod.length === 0 ? (
                <p className="text-sm text-brand-text-muted">
                  {tr("accounting.noPayments")}
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {data.byMethod.map((row) => (
                    <li
                      key={row.method}
                      className="flex justify-between rounded-xl px-2.5 py-2.5 hover:bg-brand-mist/60"
                    >
                      <span className="font-medium text-brand-ink">
                        {tr(methodKey(row.method))}
                      </span>
                      <span className="text-brand-text-muted">
                        {formatMoney(row.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="admin-card">
              <h2 className="mb-4 font-serif text-xl text-brand-ink">
                {tr("accounting.byCategory")}
              </h2>
              {data.byCategory.length === 0 ? (
                <p className="text-sm text-brand-text-muted">
                  {tr("accounting.noExpenses")}
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {data.byCategory.map((row) => (
                    <li
                      key={row.categoryId}
                      className="flex justify-between rounded-xl px-2.5 py-2.5 hover:bg-brand-mist/60"
                    >
                      <span className="font-medium text-brand-ink">
                        {row.name}
                      </span>
                      <span className="text-brand-text-muted">
                        {formatMoney(row.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
