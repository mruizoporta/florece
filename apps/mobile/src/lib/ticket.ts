import { staffApi } from './staff';

export type LineaTicket = {
  id: number;
  quantity: number;
  unitPrice?: number | string;
  unitPriceSnapshot?: number | string;
  lineTotal?: number | string;
  productId?: number | null;
  itemId?: number | null;
  productNameSnapshot?: string | null;
  employeeId?: number | null;
  employee?: { id: number; name: string } | null;
  item?: { id: number; name: string; price?: number | string } | null;
};

export type DescuentoTicket = {
  id: number;
  source: 'manual' | 'coupon' | 'auto';
  label: string;
  amount: number | string;
  reason: string | null;
  dismissed: boolean;
};

export type PagoTicket = { id?: number; method: string; amount: number | string; reference?: string | null };

export type Ticket = {
  id: number;
  name: string;
  status: 'draft' | 'open' | 'finalized' | 'cancelled' | 'prepaid' | string;
  subtotal?: number | string;
  discountTotal?: number | string;
  total?: number | string;
  createdAt?: string;
  finalizedAt?: string | null;
  employeeId?: number | null;
  items: LineaTicket[];
  payments: PagoTicket[];
  discounts?: DescuentoTicket[];
};

export const nombreLinea = (l: LineaTicket) => l.item?.name ?? l.productNameSnapshot ?? 'Ítem';
export const esServicio = (l: LineaTicket) => l.productId == null && l.itemId != null;
export const totalLinea = (l: LineaTicket) =>
  l.lineTotal != null ? Number(l.lineTotal) : Number(l.unitPrice ?? l.unitPriceSnapshot ?? l.item?.price ?? 0) * l.quantity;
export const editable = (t: Ticket) => t.status === 'draft' || t.status === 'open';

export const ESTADOS: Record<string, string> = {
  draft: 'Abierta',
  open: 'Abierta',
  finalized: 'Cobrada',
  cancelled: 'Anulada',
  prepaid: 'Venta de bono',
};

export const cargarTicket = (id: number | string) => staffApi<Ticket>(`/v1/orders/${id}`);

export const crearTicket = (name: string) =>
  staffApi<{ id: number }>('/v1/orders', { method: 'POST', body: { name: name.trim() || 'Consumidor final' } });

/** Cuenta abierta de hoy para esa clienta (la misma que usa la estilista en la web), o una nueva. */
export const abrirCuenta = (body: { name: string; employee_id?: number; customer_id?: number }) =>
  staffApi<{ order: { id: number }; created: boolean }>('/v1/orders/open-sheet', { method: 'POST', body });

export const cuentasAbiertas = () => staffApi<Ticket[]>('/v1/orders/open-sheets');

export const agregarLinea = (
  id: number,
  linea: { kind: 'product' | 'service'; refId: number; qty: number; employeeId?: number | null },
) =>
  staffApi(`/v1/orders/${id}/items`, {
    method: 'POST',
    body: {
      ...(linea.kind === 'product' ? { product_id: linea.refId } : { item_id: linea.refId }),
      quantity: linea.qty,
      ...(linea.employeeId != null ? { employee_id: linea.employeeId } : {}),
    },
  });

export const cambiarLinea = (id: number, lineaId: number, body: { quantity?: number; employee_id?: number | null }) =>
  staffApi(`/v1/orders/${id}/items/${lineaId}`, { method: 'PATCH', body });

export const quitarLinea = (id: number, lineaId: number) =>
  staffApi(`/v1/orders/${id}/items/${lineaId}`, { method: 'DELETE' });

export const aplicarCupon = (id: number, code: string) =>
  staffApi(`/v1/orders/${id}/coupon`, { method: 'POST', body: { code } });

export const descuentoManual = (id: number, body: { type: 'percent' | 'amount'; value: number; reason: string }) =>
  staffApi(`/v1/orders/${id}/discounts`, { method: 'POST', body });

export const quitarDescuento = (id: number, descuentoId: number) =>
  staffApi(`/v1/orders/${id}/discounts/${descuentoId}`, { method: 'DELETE' });

export const aplicarBono = (id: number, code: string) =>
  staffApi(`/v1/orders/${id}/vouchers`, { method: 'POST', body: { code } });

export const quitarBono = (id: number, code: string) =>
  staffApi(`/v1/orders/${id}/vouchers/${encodeURIComponent(code)}`, { method: 'DELETE' });

/** Reemplaza los pagos comunes; los canjes de bono los mantiene el servidor. */
export const guardarPagos = (id: number, pagos: { method: string; amount: number }[]) =>
  staffApi(`/v1/orders/${id}/payments`, { method: 'PATCH', body: { payments: pagos } });

export const finalizarTicket = (id: number) => staffApi(`/v1/orders/${id}/finalize`, { method: 'PATCH', body: {} });

export const anularTicket = (id: number, reason: string) =>
  staffApi(`/v1/orders/${id}/cancel`, { method: 'PATCH', body: { reason } });

/** Quién puede dar descuentos a mano en este salón (lo dice el cotizador). */
export const modoDescuento = () =>
  staffApi<{ manualMode: 'off' | 'admin' | 'cashier'; manualMaxPct: number }>('/v1/promotions/quote', {
    method: 'POST',
    body: { lines: [], coupon: null, manual: null },
  }).catch(() => ({ manualMode: 'off' as const, manualMaxPct: 0 }));
