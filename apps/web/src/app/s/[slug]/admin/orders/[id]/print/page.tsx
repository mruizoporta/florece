"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { formatDateTime } from "@/lib/format";

type OrderLine = NonNullable<Order["items"]>[number] & {
  productNameSnapshot?: string;
  unitPriceSnapshot?: number;
  lineTotal?: number;
};

function lineName(item: OrderLine) {
  return (
    item.item?.name ??
    item.product?.item?.name ??
    item.productNameSnapshot ??
    "Ítem"
  );
}

function lineAmount(item: OrderLine) {
  if (typeof item.lineTotal === "number") return item.lineTotal;
  const unit = item.unitPrice ?? item.unitPriceSnapshot ?? 0;
  return unit * item.quantity;
}

function paymentLabel(method: string) {
  if (method === "cash") return "Efectivo";
  if (method === "card") return "Tarjeta";
  if (method === "transfer") return "Transferencia";
  return method;
}

export default function OrderPrintPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;
  const { formatMoney, currencySymbol } = useSalonMoney();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  const printed = useRef(false);

  useEffect(() => {
    let cancelled = false;
    api<Order>(`/v1/orders/${id}`, { tenantSlug: slug, auth: true })
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, id]);

  useEffect(() => {
    if (!order || printed.current) return;
    printed.current = true;
    const t = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(t);
  }, [order]);

  if (error) {
    return (
      <p className="p-8 text-sm text-red-600">No se pudo cargar el ticket.</p>
    );
  }

  if (!order) {
    return (
      <p className="p-8 text-sm text-brand-text-muted">Cargando ticket…</p>
    );
  }

  const items = (order.items ?? []) as OrderLine[];
  const payments = order.payments ?? [];

  return (
    <div className="ticket-print mx-auto max-w-[22rem] bg-white p-6 text-brand-ink">
      <div className="no-print mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-primary flex-1 !rounded-2xl"
        >
          Imprimir ticket
        </button>
        <button
          type="button"
          onClick={() => window.close()}
          className="btn-secondary flex-1 !rounded-2xl"
        >
          Cerrar
        </button>
      </div>

      <div className="text-center">
        <p className="font-serif text-2xl font-medium tracking-tight">
          Ticket de venta
        </p>
        <p className="mt-1 text-xs text-brand-text-muted">#{order.id}</p>
        <p className="mt-1 text-xs text-brand-text-muted">
          {formatDateTime(order.createdAt)}
        </p>
      </div>

      <div className="my-4 border-t border-dashed border-brand-ink/20" />

      <p className="text-sm font-medium">
        {order.customer?.name ?? order.name}
      </p>
      {order.employee?.name ? (
        <p className="text-xs text-brand-text-muted">
          Atendió: {order.employee.name}
        </p>
      ) : null}

      <div className="my-4 border-t border-dashed border-brand-ink/20" />

      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-brand-text-muted">
            <th className="pb-2 text-left font-medium">Ítem</th>
            <th className="pb-2 text-right font-medium">Cant</th>
            <th className="pb-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-3 text-center text-brand-text-muted">
                Sin ítems
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="border-t border-brand-ink/8">
                <td className="py-2 pr-2">{lineName(item)}</td>
                <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatMoney(lineAmount(item))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="my-4 border-t border-dashed border-brand-ink/20" />

      <p className="flex items-baseline justify-between font-serif text-xl">
        <span>Total</span>
        <span className="tabular-nums">
          {formatMoney(order.total ?? order.subtotal)}
        </span>
      </p>

      {payments.length > 0 ? (
        <div className="mt-3 space-y-1 text-xs text-brand-text-muted">
          {payments.map((p, i) => (
            <p key={i} className="flex justify-between">
              <span>{paymentLabel(p.method)}</span>
              <span>{formatMoney(p.amount)}</span>
            </p>
          ))}
        </div>
      ) : null}

      <p className="mt-6 text-center text-[11px] text-brand-text-muted">
        Moneda {currencySymbol} · Gracias por su visita
      </p>
    </div>
  );
}
