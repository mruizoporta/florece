"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  AdminPageHeader,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { useLocale } from "@/components/LocaleProvider";

type CashSession = {
  id: number;
  status: string;
  openedAt: string;
  closedAt?: string | null;
  openingFloat: number;
  expectedCash?: number | null;
  countedCash?: number | null;
  difference?: number | null;
  note?: string | null;
  openedBy?: { id: number; name: string } | null;
  closedBy?: { id: number; name: string } | null;
  snapshot?: {
    cashIn?: number;
    cashOut?: number;
    byMethod?: Record<string, { amount: number; count: number }>;
  } | null;
};

export default function AccountingCashPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { formatMoney } = useSalonMoney();
  const { tr } = useLocale();
  const [current, setCurrent] = useState<CashSession | null>(null);
  const [history, setHistory] = useState<CashSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [openingFloat, setOpeningFloat] = useState("0");
  const [countedCash, setCountedCash] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  async function reload() {
    const [cur, list] = await Promise.all([
      api<CashSession | null>("/v1/accounting/cash-sessions/current", {
        auth: true,
        tenantSlug: slug,
      }),
      api<CashSession[]>("/v1/accounting/cash-sessions", {
        auth: true,
        tenantSlug: slug,
      }),
    ]);
    setCurrent(cur);
    setHistory(list);
  }

  useEffect(() => {
    reload()
      .catch(() => {
        setMessageType("error");
        setMessage("No se pudo cargar el cierre de caja");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleOpen(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await api("/v1/accounting/cash-sessions/open", {
        method: "POST",
        auth: true,
        tenantSlug: slug,
        body: { openingFloat: Number(openingFloat) || 0 },
      });
      setMessageType("success");
      setMessage("Caja abierta");
      await reload();
    } catch {
      setMessageType("error");
      setMessage("No se pudo abrir la caja (¿ya hay una abierta?)");
    } finally {
      setBusy(false);
    }
  }

  async function handleClose(e: FormEvent) {
    e.preventDefault();
    if (!current) return;
    setBusy(true);
    setMessage(null);
    try {
      const closed = await api<CashSession>(
        `/v1/accounting/cash-sessions/${current.id}/close`,
        {
          method: "POST",
          auth: true,
          tenantSlug: slug,
          body: { countedCash: Number(countedCash) },
        },
      );
      setCountedCash("");
      setMessageType("success");
      setMessage(
        `Caja cerrada. Diferencia: ${formatMoney(closed.difference ?? 0)}`,
      );
      await reload();
    } catch {
      setMessageType("error");
      setMessage("No se pudo cerrar la caja");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.cashClose")}
        subtitle={tr("cash.subtitle")}
      />

      {message ? (
        <MessageBanner type={messageType} message={message} />
      ) : null}

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="admin-card">
          <h2 className="font-serif text-xl text-brand-ink">Sesión actual</h2>
          {current ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-brand-text-muted">
                Abierta{" "}
                {new Date(current.openedAt).toLocaleString("es")}
                {current.openedBy ? ` · ${current.openedBy.name}` : ""}
              </p>
              <p className="text-brand-ink">
                Fondo inicial:{" "}
                <strong>{formatMoney(current.openingFloat)}</strong>
              </p>
              <form onSubmit={handleClose} className="space-y-3 pt-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-brand-text-muted">
                    Efectivo contado
                  </span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    className="input-field py-2"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary py-2.5 text-sm"
                >
                  {busy ? "Cerrando…" : "Cerrar caja"}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleOpen} className="mt-4 space-y-3">
              <p className="text-sm text-brand-text-muted">
                No hay caja abierta en esta sucursal.
              </p>
              <label className="block text-sm">
                <span className="mb-1 block text-brand-text-muted">
                  Fondo inicial
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  className="input-field py-2"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="btn-primary py-2.5 text-sm"
              >
                {busy ? "Abriendo…" : "Abrir caja"}
              </button>
            </form>
          )}
        </div>

        <div className="admin-card">
          <h2 className="mb-4 font-serif text-xl text-brand-ink">Cómo se calcula</h2>
          <ol className="space-y-2 text-sm text-brand-text-muted">
            <li>1. Fondo inicial al abrir</li>
            <li>2. + pagos en efectivo de tickets finalizados</li>
            <li>3. − egresos en efectivo del mismo período</li>
            <li>4. Diferencia = contado − esperado</li>
          </ol>
        </div>
      </div>

      <div className="admin-card overflow-hidden p-0">
        <div className="border-b border-brand-ink/[0.06] px-4 py-3">
          <h2 className="font-serif text-xl text-brand-ink">Historial</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-brand-ink/[0.06] text-xs uppercase tracking-wide text-brand-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Apertura</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Esperado</th>
              <th className="px-4 py-3 font-medium">Contado</th>
              <th className="px-4 py-3 font-medium">Diff</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-brand-text-muted"
                >
                  Sin cierres todavía
                </td>
              </tr>
            ) : (
              history.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-brand-ink/[0.04] last:border-0"
                >
                  <td className="px-4 py-3">
                    {new Date(s.openedAt).toLocaleString("es")}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {s.status === "open" ? "Abierta" : "Cerrada"}
                  </td>
                  <td className="px-4 py-3">
                    {s.expectedCash != null
                      ? formatMoney(s.expectedCash)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {s.countedCash != null
                      ? formatMoney(s.countedCash)
                      : "—"}
                  </td>
                  <td
                    className={`px-4 py-3 font-medium ${
                      s.difference == null
                        ? ""
                        : s.difference === 0
                          ? "text-brand-ink"
                          : s.difference > 0
                            ? "text-emerald-700"
                            : "text-red-700"
                    }`}
                  >
                    {s.difference != null ? formatMoney(s.difference) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
