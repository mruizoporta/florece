import { staffApi } from './staff';

export type Producto = {
  id: number;
  stock: number;
  minStock: number;
  lowStock: boolean;
  unit?: string;
  item: { name: string; price: number | string; status?: boolean; category?: { name?: string } | null };
};

export type Movimiento = {
  id: number | string;
  type: string;
  quantity: number;
  stockAfter: number;
  reason?: string | null;
  supplier?: string | null;
  createdAt?: string | null;
  user?: { name: string } | null;
};

// Mismos textos que la web (StockDialogs).
export const TIPO_MOVIMIENTO: Record<string, string> = {
  sale: 'Venta',
  consume: 'Insumo',
  restore: 'Reverso',
  receive: 'Ingreso',
  adjustment: 'Ajuste',
};
export const MOTIVOS_SALIDA = ['Regalía', 'Rifa / sorteo', 'Daño / merma', 'Uso interno', 'Devolución a proveedor', 'Otro'];
export const MOTIVOS_ENTRADA = ['Compra / ingreso', 'Devolución de clienta', 'Conteo / corrección', 'Otro'];

export function estadoStock(p: Producto): 'out' | 'low' | 'ok' {
  if (p.stock <= 0) return 'out';
  if (p.lowStock || p.stock <= p.minStock) return 'low';
  return 'ok';
}

export const cargarProductos = () => staffApi<Producto[]>('/v1/catalog/products?limit=200');

export const cargarMovimientos = (id: number) =>
  staffApi<Movimiento[]>(`/v1/catalog/products/${id}/movements?limit=15`);

export const ajustarStock = (
  id: number,
  input: { entrada: boolean; cantidad: number; motivo: string; costo?: number | null; proveedor?: string | null },
) =>
  staffApi(`/v1/catalog/products/${id}/adjust`, {
    method: 'POST',
    body: {
      delta: input.entrada ? input.cantidad : -input.cantidad,
      reason: input.motivo,
      type: input.entrada ? 'receive' : 'adjustment',
      ...(input.entrada && input.costo != null ? { unit_cost: input.costo } : {}),
      ...(input.entrada && input.proveedor ? { supplier: input.proveedor } : {}),
    },
  });
