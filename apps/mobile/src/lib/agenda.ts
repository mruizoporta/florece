import { staffApi } from './staff';

export type Estado = { id: number; name: string; color: string };

export type CitaStaff = {
  id: number;
  name: string;
  phone: string | null;
  startTime: string;
  endTime: string;
  employeeId: number | null;
  customerId?: number | null;
  employee: { id: number; name: string } | null;
  status: Estado;
  type: { name: string } | null;
  services: { service: { itemId: number; durationTime: number; item: { id: number; name: string; price: number } } }[];
  customerNoShows?: number;
};

export const cargarCitas = (fecha: string) =>
  staffApi<CitaStaff[]>(`/v1/appointments?date=${fecha}`);
export const cargarCita = (id: number | string) => staffApi<CitaStaff>(`/v1/appointments/${id}`);
export const cargarEstados = () => staffApi<Estado[]>('/v1/appointments/statuses');

export const cambiarEstado = (id: number, statusId: number) =>
  staffApi(`/v1/appointments/${id}/status`, { method: 'PATCH', body: { status_id: statusId } });
export const cancelarCita = (id: number) =>
  staffApi(`/v1/appointments/${id}/cancel`, { method: 'PATCH' });
export const reprogramarCita = (id: number, body: { employee_id: number; date: string; time: string }) =>
  staffApi(`/v1/appointments/${id}/reschedule`, { method: 'PATCH', body });

export const crearWalkIn = (body: { name: string; phone?: string; employee_id: number; service_ids: number[] }) =>
  staffApi('/v1/appointments/simple', { method: 'POST', body });
export const crearCita = (body: {
  name: string;
  phone: string | null;
  employeeId: number;
  date: string;
  time: string;
  serviceIds: number[];
}) => staffApi('/v1/appointments', { method: 'POST', body: { ...body, typeName: 'Local' } });

/** Colores de estado del API (nombres tipo Bootstrap) llevados a la paleta de la app. */
export function tonoEstado(color: string): { fondo: string; texto: string } {
  switch (color) {
    case 'success':
      return { fondo: '#e3efe6', texto: '#2f5b3f' };
    case 'info':
      return { fondo: '#e2ebf3', texto: '#2d4e6b' };
    case 'warning':
      return { fondo: '#f6ead3', texto: '#7a5a1e' };
    case 'danger':
      return { fondo: '#f4e0de', texto: '#8a3530' };
    case 'primary':
      return { fondo: '#ece5da', texto: '#4b3c27' };
    default:
      return { fondo: '#ece9e5', texto: '#5f5953' };
  }
}

export function minutosDe(iso: string): number {
  return Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));
}
