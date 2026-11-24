import { staffApi } from './staff';

export type Utilidad = {
  income: number;
  cogs?: number;
  supplies?: number;
  expenses: number;
  profit: number;
  orderCount: number;
  expenseCount: number;
  byMethod: { method: string; amount: number }[];
  byCategory: { categoryId: number; name: string; amount: number }[];
};

export const cargarUtilidad = (r: { from: string; to: string }) =>
  staffApi<Utilidad>(`/v1/accounting/profit-summary?from=${r.from}&to=${r.to}`);
