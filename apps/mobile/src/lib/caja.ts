import type { PlanFeatures } from '@florece/shared';
import { staffApi } from './staff';

export type Vendible = {
  key: string;
  kind: 'product' | 'service';
  /** Producto: id del producto. Servicio: id del ítem (así se cobra). */
  refId: number;
  name: string;
  price: number;
  stock?: number;
};

export type LineaCuenta = Vendible & { qty: number };
export type MetodoPago = 'cash' | 'card' | 'transfer';

export const METODOS: { value: MetodoPago; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
];

export function nombreMetodo(method: string): string {
  if (method === 'voucher') return 'Bono';
  return METODOS.find((m) => m.value === method.toLowerCase())?.label ?? method;
}

type ProductoApi = { id: number; stock: number; item: { name: string; price: number | string; status?: boolean } };
type ServicioApi = { id: number; itemId?: number; item: { id?: number; name: string; price: number | string; status?: boolean } };

export async function cargarCatalogo(): Promise<Vendible[]> {
  const [productos, servicios] = await Promise.all([
    staffApi<ProductoApi[]>('/v1/catalog/products?for=sale&limit=200').catch(() => [] as ProductoApi[]),
    staffApi<ServicioApi[]>('/v1/catalog/services'),
  ]);
  return [
    ...servicios
      .filter((s) => s.item.status !== false)
      .map((s) => ({
        key: `s${s.id}`,
        kind: 'service' as const,
        refId: Number(s.item.id ?? s.itemId ?? s.id),
        name: s.item.name,
        price: Number(s.item.price),
      })),
    ...productos
      .filter((p) => p.item.status !== false)
      .map((p) => ({
        key: `p${p.id}`,
        kind: 'product' as const,
        refId: Number(p.id),
        name: p.item.name,
        price: Number(p.item.price),
        stock: p.stock,
      })),
  ];
}

export const cargarProfesionales = () =>
  staffApi<{ id: number; name: string }[]>('/v1/employees').then((lista) =>
    lista.map((e) => ({ id: Number(e.id), name: e.name })),
  );

/** Total con las promociones vigentes; lo calcula el servidor con las mismas reglas que el ticket. */
export const cotizar = (cuenta: LineaCuenta[]) =>
  staffApi<{ total: number; discounts: { key: string; label: string; amount: number }[] }>('/v1/promotions/quote', {
    method: 'POST',
    body: {
      lines: cuenta.map((l) =>
        l.kind === 'product' ? { product_id: l.refId, quantity: l.qty } : { item_id: l.refId, quantity: l.qty },
      ),
      coupon: null,
      manual: null,
    },
  });

export type Venta = {
  id: number;
  name: string;
  status: string;
  total: number | string;
  finalizedAt: string | null;
  payments: { method: string; amount: number | string }[];
};

// shortcut: trae los últimos 200 tickets y filtra el día en el teléfono; si un salón vende más por día, filtrar por fecha en el API.
export const cargarVentas = () => staffApi<Venta[]>('/v1/orders?status=finalized&limit=200');

export type SesionCaja = {
  id: number;
  status: string;
  openedAt: string;
  closedAt?: string | null;
  openingFloat: number;
  expectedCash?: number | null;
  countedCash?: number | null;
  difference?: number | null;
  openedBy?: { id: number; name: string } | null;
  closedBy?: { id: number; name: string } | null;
};

export const cajaActual = () => staffApi<SesionCaja | null>('/v1/accounting/cash-sessions/current');
export const historialCaja = () => staffApi<SesionCaja[]>('/v1/accounting/cash-sessions?limit=10');
export const abrirCaja = (openingFloat: number) =>
  staffApi<SesionCaja>('/v1/accounting/cash-sessions/open', { method: 'POST', body: { openingFloat } });
export const cerrarCaja = (id: number, countedCash: number) =>
  staffApi<SesionCaja>(`/v1/accounting/cash-sessions/${id}/close`, { method: 'POST', body: { countedCash } });

/** Funciones del plan del salón; `null` si no se pudo saber (se muestra todo y el API decide). */
export const cargarFunciones = () =>
  staffApi<{ entitlements?: { features?: PlanFeatures } }>('/billing/account-status')
    .then((s) => s.entitlements?.features ?? null)
    .catch(() => null);

/** Convierte lo que se escribe en un monto ("1.500,50" o "1500.5"). */
export function monto(texto: string): number {
  const limpio = texto.trim().replace(/\s/g, '');
  if (!limpio) return NaN;
  const normal = limpio.includes(',') && !limpio.includes('.') ? limpio.replace(',', '.') : limpio.replace(/,/g, '');
  return Number(normal);
}

export type ResumenDia = {
  appointmentsToday: number;
  waiting: number;
  pending: number;
  incomeToday: number;
  topServices: { name: string; quantity: number; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
};

/** Mismo resumen que el dashboard de la web (Admin, Recepción y Caja). */
export const cargarResumen = () => staffApi<ResumenDia>('/v1/dashboard/summary');
