"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import {
  AdminIconButton,
  AdminPageHeader,
  AdminPill,
  AdminPrimaryButton,
  AdminSearchField,
  AdminTable,
  AdminToolbar,
  LoadingSpinner,
} from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { formatDateTime } from "@/lib/format";
import { useLocale } from "@/components/LocaleProvider";

function statusLabel(status: string) {
  if (status === "finalized") return "Pagada";
  if (status === "cancelled") return "Anulada";
  if (status === "open") return "Abierta";
  return status;
}

export default function AdminOrdersPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const { formatMoney } = useSalonMoney();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const q = search ? `?search=${encodeURIComponent(search)}` : "";
        const data = await api<Order[]>(`/v1/orders${q}`, {
          tenantSlug: slug,
          auth: true,
        });
        setOrders(data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    const t = window.setTimeout(load, search ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [slug, search]);

  async function createOrder() {
    const created = await api<Order>("/v1/orders", {
      method: "POST",
      tenantSlug: slug,
      auth: true,
      body: { name: `Ticket ${new Date().toLocaleTimeString()}` },
    });
    window.location.href = `/s/${slug}/admin/orders/${created.id}`;
  }

  function statusTone(status: string) {
    if (status === "finalized") return "success" as const;
    if (status === "cancelled") return "danger" as const;
    return "primary" as const;
  }

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.orders")}
        subtitle="Tickets de venta y cobros de caja."
        action={
          <AdminPrimaryButton onClick={createOrder}>
            Nuevo ticket
          </AdminPrimaryButton>
        }
      />

      <AdminToolbar>
        <AdminSearchField
          value={search}
          onChange={setSearch}
          placeholder={tr("admin.search")}
        />
      </AdminToolbar>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <AdminTable
          headers={["Ticket", "Estado", "Total", "Fecha", ""]}
          empty={orders.length === 0}
          emptyTitle="Sin tickets"
          emptyDescription="Creá uno para cobrar en caja."
        >
          {orders.map((o) => (
            <tr key={o.id} className="transition hover:bg-brand-warm">
              <td className="px-5 py-4">
                <p className="font-medium text-brand-ink">{o.name}</p>
                <p className="text-xs text-brand-text-muted">#{o.id}</p>
              </td>
              <td className="px-5 py-4">
                <AdminPill tone={statusTone(o.status)}>
                  {statusLabel(o.status)}
                </AdminPill>
              </td>
              <td className="px-5 py-4 font-semibold">
                {formatMoney(o.total ?? o.subtotal)}
              </td>
              <td className="px-5 py-4 text-brand-text-muted">
                {formatDateTime(o.createdAt)}
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-1.5">
                  <AdminIconButton
                    action="edit"
                    label="Abrir ticket"
                    href={`/s/${slug}/admin/orders/${o.id}`}
                  />
                  <AdminIconButton
                    action="ticket"
                    label="Emitir ticket"
                    href={`/s/${slug}/admin/orders/${o.id}/print`}
                    target="_blank"
                  />
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
