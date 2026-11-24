import { hoyEn } from './format';
import { staffApi } from './staff';

export type Periodo = 'mes' | 'anterior' | 'semana';

export const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'mes', label: 'Este mes' },
  { value: 'anterior', label: 'Mes pasado' },
  { value: 'semana', label: 'Últimos 7 días' },
];

/** Rango de días calendario del salón; el API los interpreta en su horario. */
export function rango(periodo: Periodo, timeZone: string): { from: string; to: string } {
  const hoy = hoyEn(timeZone);
  const [y, m] = hoy.split('-').map(Number);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  if (periodo === 'semana') {
    return { from: ymd(new Date(Date.parse(`${hoy}T12:00:00Z`) - 6 * 86_400_000)), to: hoy };
  }
  if (periodo === 'anterior') {
    return { from: ymd(new Date(Date.UTC(y, m - 2, 1))), to: ymd(new Date(Date.UTC(y, m - 1, 0))) };
  }
  return { from: `${hoy.slice(0, 7)}-01`, to: hoy };
}

export type FilaNomina = {
  employeeId: number;
  name: string;
  commissionRate: number;
  baseProrated: number;
  commission: number;
  lineCount: number;
  total: number;
  paid?: boolean;
  pendingAdvances?: number;
};

export type ResumenNomina = {
  days: number;
  employees: FilaNomina[];
  totals: { baseProrated: number; serviceSales: number; commission: number; total: number };
};

export type DetalleNomina = {
  days: number;
  employee: { id: number; name: string; commissionRate: number };
  baseProrated: number;
  serviceSales: number;
  productSales?: number;
  commission: number;
  lineCount: number;
  total: number;
  lines: {
    id: number;
    orderName: string | null;
    customerName: string | null;
    finalizedAt: string | null;
    serviceName: string;
    quantity: number;
    lineTotal: number;
    commission: number;
  }[];
};

export type MiDia = {
  serviceSales: number;
  pendingCommission: number;
  confirmedCommission: number;
  commission: number;
  lines: { id: number; serviceName: string; customerName: string | null; orderName: string | null; confirmed: boolean; lineTotal: number; commission: number }[];
};

const q = (r: { from: string; to: string }) => `from=${r.from}&to=${r.to}`;

export const cargarNomina = (r: { from: string; to: string }) => staffApi<ResumenNomina>(`/v1/payroll/summary?${q(r)}`);
export const cargarDetalleNomina = (id: number, r: { from: string; to: string }) =>
  staffApi<DetalleNomina>(`/v1/payroll/employees/${id}?${q(r)}`);
export const cargarMiDia = () => staffApi<MiDia>('/v1/payroll/my-day');
