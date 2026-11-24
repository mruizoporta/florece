import { staffApi } from './staff';

export type Cliente = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  appointmentsCount: number;
};

export type CitaCliente = {
  id: number;
  startTime: string;
  status: { name: string } | null;
  employee: { name: string } | null;
  services: { service: { item: { name: string } } }[];
};

export type FichaCliente = Cliente & { allergies: string | null; appointments: CitaCliente[] };

export const buscarClientes = (busqueda: string) =>
  staffApi<Cliente[]>(`/v1/customers${busqueda.trim() ? `?search=${encodeURIComponent(busqueda.trim())}` : ''}`);

export const cargarCliente = (id: string | number) => staffApi<FichaCliente>(`/v1/customers/${id}`);
