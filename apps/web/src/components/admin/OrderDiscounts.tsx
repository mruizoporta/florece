"use client";

import { FormEvent, useState } from "react";
import { BadgePercent, RotateCcw, Ticket, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { OrderDiscount } from "@/lib/types";
import { AdminSection } from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";

const SOURCE: Record<OrderDiscount["source"], string> = {
  auto: "Promoción",
  coupon: "Cupón",
  manual: "A mano",
};

/** Descuentos del ticket: promociones automáticas, cupón y descuento a mano (con motivo). */
export function OrderDiscounts({
  slug,
  orderId,
  discounts,
  editable,
  onChanged,
}: {
  slug: string;
  orderId: number | string;
  discounts: OrderDiscount[];
  editable: boolean;
  onChanged: () => Promise<void> | void;
}) {
  const { formatMoney } = useSalonMoney();
  const [coupon, setCoupon] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ type: "percent", value: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(path: string, method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      await api(`/v1/orders/${orderId}${path}`, { tenantSlug: slug, auth: true, method, body });
      await onChanged();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function applyCoupon(e: FormEvent) {
    e.preventDefault();
    if (await call("/coupon", "POST", { code: coupon.trim() })) setCoupon("");
  }

  async function addManual(e: FormEvent) {
    e.preventDefault();
    const ok = await call("/discounts", "POST", {
      type: manual.type,
      value: Number(manual.value),
      reason: manual.reason,
    });
    if (ok) {
      setManual({ type: "percent", value: "", reason: "" });
      setShowManual(false);
    }
  }

  if (!editable && discounts.every((d) => Number(d.amount) <= 0)) return null;

  return (
    <AdminSection title="Descuentos" description={editable ? "Las promociones del salón se aplican solas." : undefined}>
      {discounts.length > 0 ? (
        <ul className="space-y-2">
          {discounts
            .filter((d) => editable || Number(d.amount) > 0)
            .map((d) => {
              const off = Number(d.amount) <= 0;
              return (
                <li
                  key={d.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-sm ${
                    off ? "border border-dashed border-brand-ink/10" : "bg-emerald-500/[0.07]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`font-medium ${off ? "text-brand-text-muted" : "text-brand-ink"}`}>
                      {d.label}{" "}
                      <span className="text-xs font-normal text-brand-text-muted">· {SOURCE[d.source]}</span>
                    </p>
                    {d.note || d.reason ? (
                      <p className="text-xs text-brand-text-muted">{d.note ?? d.reason}</p>
                    ) : null}
                  </div>
                  <span className="flex shrink-0 items-center gap-2 tabular-nums font-semibold">
                    {off ? null : <span className="text-emerald-700">−{formatMoney(Number(d.amount))}</span>}
                    {editable ? (
                      d.dismissed ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => call(`/discounts/${d.id}/restore`, "POST")}
                          aria-label={`Volver a aplicar ${d.label}`}
                          title="Volver a aplicar"
                          className="text-brand-text-muted hover:text-brand-ink"
                        >
                          <RotateCcw size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => call(`/discounts/${d.id}`, "DELETE")}
                          aria-label={`Quitar ${d.label}`}
                          title="Quitar"
                          className="text-brand-text-muted hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      )
                    ) : null}
                  </span>
                </li>
              );
            })}
        </ul>
      ) : (
        <p className="text-sm text-brand-text-muted">Sin descuentos.</p>
      )}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {editable ? (
        <div className="space-y-3 border-t border-brand-ink/6 pt-4">
          <form onSubmit={applyCoupon} className="flex gap-2">
            <input
              className="input-field !rounded-2xl font-mono uppercase"
              placeholder="Código de cupón"
              aria-label="Código de cupón"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
            <button type="submit" disabled={busy || !coupon.trim()} className="btn-secondary inline-flex shrink-0 items-center gap-1.5 py-2.5 text-sm">
              <Ticket size={15} />
              Aplicar
            </button>
          </form>

          {showManual ? (
            <form onSubmit={addManual} className="space-y-2 rounded-2xl bg-brand-warm/60 p-3">
              <div className="flex gap-2">
                <div className="flex rounded-xl bg-brand-ink/[0.05] p-1 text-sm" role="radiogroup" aria-label="Tipo de descuento">
                  {[
                    ["percent", "%"],
                    ["amount", "Monto"],
                  ].map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={manual.type === v}
                      onClick={() => setManual((m) => ({ ...m, type: v }))}
                      className={`rounded-lg px-3 py-1.5 font-medium ${
                        manual.type === v ? "bg-brand-elevated text-brand-ink shadow-sm" : "text-brand-text-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={0.01}
                  max={manual.type === "percent" ? 100 : undefined}
                  step="0.01"
                  required
                  className="input-field !rounded-xl !py-2"
                  aria-label={manual.type === "percent" ? "Porcentaje" : "Monto"}
                  placeholder={manual.type === "percent" ? "10" : "100"}
                  value={manual.value}
                  onChange={(e) => setManual((m) => ({ ...m, value: e.target.value }))}
                />
              </div>
              <input
                required
                maxLength={200}
                className="input-field !rounded-xl !py-2"
                placeholder="Motivo (ej. clienta frecuente, reclamo)"
                aria-label="Motivo del descuento"
                value={manual.reason}
                onChange={(e) => setManual((m) => ({ ...m, reason: e.target.value }))}
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary py-2 text-sm" onClick={() => setShowManual(false)}>
                  Cancelar
                </button>
                <button type="submit" disabled={busy} className="btn-primary py-2 text-sm">
                  Aplicar descuento
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink underline-offset-2 hover:underline"
            >
              <BadgePercent size={15} />
              Descuento a mano…
            </button>
          )}
        </div>
      ) : null}
    </AdminSection>
  );
}
