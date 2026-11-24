"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatStockQty, type ProductUnit } from "@florece/shared";
import { api } from "@/lib/api";
import { AdminModal, LoadingSpinner, MessageBanner } from "@/components/admin/AdminUi";
import { useLocale } from "@/components/LocaleProvider";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";

/** Lo mínimo de un producto que necesitan los diálogos de stock. */
export type StockProduct = {
  id: number;
  stock: number;
  minStock: number;
  unit?: ProductUnit;
  cost?: number;
  item: { name: string };
};

type MovementRow = {
  id: number | string;
  type: string;
  quantity: number;
  stockAfter: number;
  reason?: string | null;
  unitCost?: string | number | null;
  supplier?: string | null;
  createdAt?: string | null;
  user?: { id: number | string; name: string } | null;
};

export const MOVEMENT_LABEL: Record<string, string> = {
  sale: "Venta",
  consume: "Insumo",
  restore: "Reverso",
  receive: "Ingreso",
  adjustment: "Ajuste",
};

const OUT_REASONS = [
  "Regalía",
  "Rifa / sorteo",
  "Daño / merma",
  "Uso interno",
  "Devolución a proveedor",
  "Otro",
];
const IN_REASONS = [
  "Compra / ingreso",
  "Devolución de clienta",
  "Conteo / corrección",
  "Otro",
];

export function StockAdjustModal({
  slug,
  product,
  initialDirection = "out",
  onClose,
  onSaved,
}: {
  slug: string;
  product: StockProduct | null;
  initialDirection?: "in" | "out";
  onClose: () => void;
  onSaved: () => void;
}) {
  const { tr } = useLocale();
  const { formatMoney } = useSalonMoney();
  const [form, setForm] = useState({
    direction: initialDirection,
    qty: "1",
    reason: "",
    unitCost: "",
    supplier: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setForm({ direction: initialDirection, qty: "1", reason: "", unitCost: "", supplier: "" });
      setError(null);
    }
  }, [product, initialDirection]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!product) return;
    const qty = Math.trunc(Number(form.qty));
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Indicá una cantidad mayor a 0");
      return;
    }
    const reason = form.reason.trim();
    if (!reason) {
      setError("Elegí o escribí un motivo");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await api(`/v1/catalog/products/${product.id}/adjust`, {
        method: "POST",
        tenantSlug: slug,
        auth: true,
        body: {
          delta: form.direction === "out" ? -qty : qty,
          reason,
          type: form.direction === "out" ? "adjustment" : "receive",
          ...(form.direction === "in" && form.unitCost !== ""
            ? { unit_cost: Number(form.unitCost), supplier: form.supplier.trim() || null }
            : form.direction === "in" && form.supplier.trim()
              ? { supplier: form.supplier.trim() }
              : {}),
        },
      });
      onClose();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  const unit = product?.unit ?? "unit";

  return (
    <AdminModal
      open={Boolean(product)}
      onClose={onClose}
      title={product ? `Ajustar · ${product.item.name}` : "Ajustar stock"}
    >
      {product ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-brand-text-muted">
            Stock actual:{" "}
            <strong className="text-brand-ink">{formatStockQty(product.stock, unit)}</strong>
            {" · "}mínimo {formatStockQty(product.minStock, unit)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["out", "in"] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  form.direction === direction
                    ? "bg-brand-ink text-brand-base"
                    : "bg-brand-warm text-brand-ink hover:bg-brand-primary/30"
                }`}
                onClick={() => setForm((f) => ({ ...f, direction, reason: "" }))}
              >
                {direction === "out" ? "Salida" : "Ingreso"}
              </button>
            ))}
          </div>
          <div>
            <label className="label-field">Cantidad</label>
            <input
              className="input-field"
              type="number"
              min={1}
              step={1}
              value={form.qty}
              onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label-field">Motivo</label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(form.direction === "out" ? OUT_REASONS : IN_REASONS).map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    form.reason === label
                      ? "bg-brand-primary/50 text-brand-ink"
                      : "bg-brand-warm text-brand-text-muted hover:text-brand-ink"
                  }`}
                  onClick={() => setForm((f) => ({ ...f, reason: label }))}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              className="input-field"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder={
                form.direction === "out"
                  ? "Ej. regalía clienta VIP, frasco roto…"
                  : "Ej. factura #123, inventario…"
              }
              required
            />
          </div>
          {form.direction === "in" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label-field">Costo por unidad (opcional)</label>
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={form.unitCost}
                  onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
                  placeholder={product.cost ? String(product.cost) : "Ej. 250"}
                />
                {form.unitCost !== "" && Number(form.qty) > 0 ? (
                  <p className="mt-1 text-xs text-brand-text-muted">
                    Compra total {formatMoney(Number(form.unitCost) * Math.trunc(Number(form.qty)))}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="label-field">Proveedor (opcional)</label>
                <input
                  className="input-field"
                  value={form.supplier}
                  onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                  maxLength={120}
                  placeholder="Ej. Distribuidora Belleza"
                />
              </div>
            </div>
          ) : null}
          {error ? <MessageBanner message={error} type="error" /> : null}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full !rounded-2xl disabled:opacity-50"
          >
            {saving
              ? tr("admin.saving")
              : form.direction === "out"
                ? "Registrar salida"
                : "Registrar ingreso"}
          </button>
        </form>
      ) : null}
    </AdminModal>
  );
}

export function StockHistoryModal({
  slug,
  product,
  onClose,
}: {
  slug: string;
  product: StockProduct | null;
  onClose: () => void;
}) {
  const { formatMoney } = useSalonMoney();
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!product) return;
    setLoading(true);
    setMovements([]);
    api<MovementRow[]>(`/v1/catalog/products/${product.id}/movements`, {
      tenantSlug: slug,
      auth: true,
    })
      .then(setMovements)
      .catch(() => setMovements([]))
      .finally(() => setLoading(false));
  }, [product, slug]);

  return (
    <AdminModal
      open={Boolean(product)}
      onClose={onClose}
      title={product ? `Movimientos · ${product.item.name}` : "Movimientos"}
      wide
    >
      {loading ? (
        <LoadingSpinner />
      ) : movements.length === 0 ? (
        <p className="text-sm text-brand-text-muted">Sin movimientos aún.</p>
      ) : (
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-brand-elevated text-xs uppercase tracking-wide text-brand-text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Fecha</th>
                <th className="py-2 pr-3 font-medium">Tipo</th>
                <th className="py-2 pr-3 font-medium">Δ</th>
                <th className="py-2 pr-3 font-medium">Queda</th>
                <th className="py-2 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={String(m.id)} className="border-t border-brand-ink/5">
                  <td className="whitespace-nowrap py-2.5 pr-3 text-brand-text-muted">
                    {m.createdAt ? new Date(m.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="py-2.5 pr-3">{MOVEMENT_LABEL[m.type] ?? m.type}</td>
                  <td
                    className={`py-2.5 pr-3 font-medium ${
                      m.quantity < 0 ? "text-red-700" : "text-emerald-700"
                    }`}
                  >
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="py-2.5 pr-3">{m.stockAfter}</td>
                  <td className="py-2.5 text-brand-text-muted">
                    {m.reason ?? "—"}
                    {m.supplier ? ` · ${m.supplier}` : ""}
                    {m.unitCost != null ? ` · ${formatMoney(Number(m.unitCost))} c/u` : ""}
                    {m.user?.name ? ` · ${m.user.name}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminModal>
  );
}
