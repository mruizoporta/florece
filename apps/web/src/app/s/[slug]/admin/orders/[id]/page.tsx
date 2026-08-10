"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Receipt, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import {
  AdminIconButton,
  AdminPill,
  AdminSection,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { ModernSelect } from "@/components/ui/ModernSelect";
import { useLocale } from "@/components/LocaleProvider";
import { formatDateTime } from "@/lib/format";

type ProductRow = { id: number; stock: number; item: { name: string; price: number } };
type ServiceRow = {
  id: number;
  durationTime?: number;
  item: { id: number; name: string; price: number };
};

function statusLabel(status: string) {
  if (status === "finalized") return "Pagada";
  if (status === "cancelled") return "Anulada";
  if (status === "open" || status === "draft") return "Abierta";
  return status;
}

function statusTone(status: string) {
  if (status === "finalized") return "success" as const;
  if (status === "cancelled") return "danger" as const;
  return "primary" as const;
}

function paymentLabel(method: string) {
  if (method === "cash") return "Efectivo";
  if (method === "card") return "Tarjeta";
  if (method === "transfer") return "Transferencia";
  return method;
}

type OrderLine = NonNullable<Order["items"]>[number] & {
  productNameSnapshot?: string;
  unitPriceSnapshot?: number;
  lineTotal?: number;
};

function itemName(item: OrderLine) {
  return (
    item.item?.name ??
    item.product?.item?.name ??
    item.productNameSnapshot ??
    "Ítem"
  );
}

function lineUnitPrice(item: OrderLine) {
  return item.unitPrice ?? item.unitPriceSnapshot ?? item.item?.price ?? 0;
}

function lineTotal(item: OrderLine) {
  if (typeof item.lineTotal === "number") return item.lineTotal;
  return lineUnitPrice(item) * item.quantity;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;
  const { tr } = useLocale();
  const { formatMoney } = useSalonMoney();
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [catalogKey, setCatalogKey] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [o, prods, svcs] = await Promise.all([
        api<Order>(`/v1/orders/${id}`, { tenantSlug: slug, auth: true }),
        api<ProductRow[]>("/v1/catalog/products", {
          tenantSlug: slug,
          auth: true,
        }),
        api<ServiceRow[]>("/v1/catalog/services", {
          tenantSlug: slug,
          auth: true,
        }).catch(() => []),
      ]);
      setOrder(o);
      setProducts(prods);
      setServices(svcs);
    } catch {
      setOrder(null);
    }
  }, [slug, id]);

  useEffect(() => {
    load();
  }, [load]);

  const total = order?.total ?? order?.subtotal ?? 0;
  const paid = useMemo(
    () => (order?.payments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0),
    [order?.payments],
  );
  const remaining = Math.max(0, Number(total) - paid);
  const isEditable = order?.status === "draft" || order?.status === "open";

  useEffect(() => {
    if (!order || !isEditable) return;
    setPaymentAmount(remaining > 0 ? String(Number(remaining.toFixed(2))) : "");
  }, [order, remaining, isEditable]);

  async function addItem(e: FormEvent) {
    e.preventDefault();
    if (!catalogKey) return;
    setBusy(true);
    setMessage(null);
    try {
      const [kind, rawId] = catalogKey.split(":");
      const body =
        kind === "service"
          ? { item_id: Number(rawId), quantity: Number(quantity) || 1 }
          : { product_id: Number(rawId), quantity: Number(quantity) || 1 };
      await api(`/v1/orders/${id}/items`, {
        method: "POST",
        tenantSlug: slug,
        auth: true,
        body,
      });
      setCatalogKey("");
      setQuantity("1");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(lineId: number) {
    setBusy(true);
    setMessage(null);
    try {
      await api(`/v1/orders/${id}/items/${lineId}`, {
        method: "DELETE",
        tenantSlug: slug,
        auth: true,
      });
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function addPayment(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const existing = (order?.payments ?? []).map((p) => ({
        method: p.method,
        amount: p.amount,
        reference: p.reference ?? undefined,
      }));
      await api(`/v1/orders/${id}/payments`, {
        method: "PATCH",
        tenantSlug: slug,
        auth: true,
        body: {
          payments: [
            ...existing,
            { method: paymentMethod, amount: Number(paymentAmount) },
          ],
        },
      });
      setPaymentAmount("");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    setBusy(true);
    setMessage(null);
    try {
      await api(`/v1/orders/${id}/finalize`, {
        method: "PATCH",
        tenantSlug: slug,
        auth: true,
      });
      await load();
      window.open(`/s/${slug}/admin/orders/${id}/print`, "_blank");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!window.confirm("¿Anular este ticket?")) return;
    setBusy(true);
    setMessage(null);
    try {
      await api(`/v1/orders/${id}/cancel`, {
        method: "PATCH",
        tenantSlug: slug,
        auth: true,
        body: { reason: "Cancelado desde admin" },
      });
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (!order) return <LoadingSpinner />;

  const items = order.items ?? [];
  const payments = order.payments ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/s/${slug}/admin/orders`}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-brand-text-muted transition hover:text-brand-ink"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            Volver a caja
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-[2.15rem] font-semibold tracking-tight text-brand-ink sm:text-4xl">
              Ticket #{order.id}
            </h1>
            <AdminPill tone={statusTone(order.status)}>
              {statusLabel(order.status)}
            </AdminPill>
          </div>
          <p className="mt-2 text-[15px] text-brand-text-muted">
            {order.customer?.name ?? order.name}
            {order.createdAt ? ` · ${formatDateTime(order.createdAt)}` : ""}
          </p>
        </div>
        <AdminIconButton
          action="ticket"
          label="Emitir ticket"
          href={`/s/${slug}/admin/orders/${id}/print`}
          target="_blank"
        />
      </div>

      {message ? <MessageBanner message={message} type="error" /> : null}

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
        <AdminSection
          title="Ítems"
          description={
            isEditable
              ? "Agregá productos o servicios al ticket."
              : "Este ticket ya no se puede editar."
          }
        >
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-ink/12 bg-brand-warm px-4 py-10 text-center">
              <Receipt
                size={28}
                className="mx-auto mb-3 text-brand-ink/25"
                strokeWidth={1.5}
              />
              <p className="font-medium text-brand-ink">Sin ítems</p>
              <p className="mt-1 text-sm text-brand-text-muted">
                {isEditable
                  ? "Elegí un producto o servicio para empezar el cobro."
                  : "Este ticket no tiene productos ni servicios registrados."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-brand-ink/6 overflow-hidden rounded-2xl border border-brand-ink/8">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 bg-brand-elevated px-4 py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-brand-ink">
                      {itemName(item)}
                    </p>
                    <p className="text-xs text-brand-text-muted">
                      {formatMoney(lineUnitPrice(item))} × {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 tabular-nums font-semibold text-brand-ink">
                    {formatMoney(lineTotal(item))}
                  </p>
                  {isEditable ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeItem(item.id)}
                      aria-label="Quitar ítem"
                      title="Quitar ítem"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-text-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {isEditable ? (
            <form
              onSubmit={addItem}
              className="flex flex-wrap items-end gap-2 border-t border-brand-ink/6 pt-4"
            >
              <div className="min-w-[14rem] flex-1">
                <label className="label-field">Producto o servicio</label>
                <ModernSelect
                  placeholder="Elegir del catálogo"
                  value={catalogKey}
                  options={[
                    ...services.map((s) => ({
                      value: `service:${s.item.id}`,
                      label: s.item.name,
                      description: `Servicio · ${formatMoney(Number(s.item.price))}${
                        s.durationTime ? ` · ${s.durationTime} min` : ""
                      }`,
                    })),
                    ...products.map((p) => ({
                      value: `product:${p.id}`,
                      label: p.item.name,
                      description: `Producto · ${formatMoney(p.item.price)} · Stock ${p.stock}`,
                    })),
                  ]}
                  onChange={setCatalogKey}
                  required
                />
              </div>
              <div className="w-24">
                <label className="label-field">Cant.</label>
                <input
                  type="number"
                  min="1"
                  className="input-field !rounded-2xl"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={busy || !catalogKey}
                className="btn-primary inline-flex items-center gap-2 py-2.5 text-sm disabled:opacity-50"
              >
                <Plus size={16} strokeWidth={2.25} />
                Agregar
              </button>
            </form>
          ) : null}
        </AdminSection>

        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="admin-card overflow-hidden !p-0">
            <div className="bg-[linear-gradient(160deg,#f7f3eb_0%,#fff_55%)] px-5 py-5">
              <p className="text-[11px] font-semibold tracking-[0.08em] text-brand-text-muted uppercase">
                Total a cobrar
              </p>
              <p className="mt-1 font-serif text-4xl tracking-tight text-brand-ink">
                {formatMoney(total)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-brand-text-muted">Pagado</p>
                  <p className="font-semibold tabular-nums">{formatMoney(paid)}</p>
                </div>
                <div>
                  <p className="text-brand-text-muted">Pendiente</p>
                  <p className="font-semibold tabular-nums text-brand-ink">
                    {formatMoney(remaining)}
                  </p>
                </div>
              </div>
            </div>

            {order.employee?.name ? (
              <div className="border-t border-brand-ink/6 px-5 py-3 text-sm text-brand-text-muted">
                Atendió:{" "}
                <span className="font-medium text-brand-ink">
                  {order.employee.name}
                </span>
              </div>
            ) : null}
          </div>

          <AdminSection title={tr("orders.payments")} description="Registrá cómo paga la clienta.">
            {payments.length > 0 ? (
              <ul className="space-y-2">
                {payments.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-2xl bg-brand-warm px-3.5 py-2.5 text-sm"
                  >
                    <span className="font-medium text-brand-ink">
                      {paymentLabel(p.method)}
                    </span>
                    <span className="tabular-nums font-semibold">
                      {formatMoney(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brand-text-muted">Sin pagos registrados.</p>
            )}

            {isEditable ? (
              <form
                onSubmit={addPayment}
                className="flex flex-wrap items-end gap-2 border-t border-brand-ink/6 pt-4"
              >
                <div className="min-w-[9rem] flex-1">
                  <label className="label-field">Método</label>
                  <ModernSelect
                    value={paymentMethod}
                    options={[
                      { value: "cash", label: "Efectivo" },
                      { value: "card", label: "Tarjeta" },
                      { value: "transfer", label: "Transferencia" },
                    ]}
                    onChange={setPaymentMethod}
                  />
                </div>
                <div className="w-32">
                  <label className="label-field">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field !rounded-2xl"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-secondary py-2.5 text-sm disabled:opacity-50"
                >
                  Agregar
                </button>
              </form>
            ) : null}
          </AdminSection>

          {isEditable ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={finalize}
                disabled={busy || items.length === 0}
                className="btn-primary w-full py-3 text-sm disabled:opacity-50"
              >
                Cobrar y emitir ticket
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={busy}
                className="btn-secondary w-full py-2.5 text-sm text-red-600 disabled:opacity-50"
              >
                Anular ticket
              </button>
            </div>
          ) : (
            <Link
              href={`/s/${slug}/admin/orders/${id}/print`}
              target="_blank"
              className="btn-primary inline-flex w-full items-center justify-center gap-2 py-3 text-sm"
            >
              <Receipt size={16} strokeWidth={2.25} />
              Volver a imprimir
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
