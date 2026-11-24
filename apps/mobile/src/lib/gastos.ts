import { staffApi } from './staff';

export type Categoria = { id: number; name: string };
export type Gasto = {
  id: number;
  amount: number | string;
  method: string;
  spentAt: string;
  note?: string | null;
  category: { id: number; name: string } | null;
  recordedBy?: { name: string } | null;
};

export const cargarCategorias = () => staffApi<Categoria[]>('/v1/accounting/expense-categories');

export const cargarGastos = (desde: string, hasta: string) =>
  staffApi<Gasto[]>(`/v1/accounting/expenses?from=${desde}&to=${hasta}&limit=200`);

export const registrarGasto = (body: { categoryId: number; amount: number; method: string; spentAt: string; note?: string }) =>
  staffApi('/v1/accounting/expenses', { method: 'POST', body });
