import { staffApi } from './staff';

export type Vale = {
  id: number;
  code: string;
  kind: 'giftcard' | 'package';
  holderName: string;
  holderPhone: string | null;
  price: number;
  balance: number;
  serviceItemId: number | null;
  serviceName: string | null;
  sessionsTotal: number;
  sessionsUsed: number;
  expiresAt: string | null;
  status: 'active' | 'used' | 'expired' | 'cancelled';
};

export const ESTADO_VALE: Record<Vale['status'], string> = {
  active: 'Vigente',
  used: 'Usado',
  expired: 'Vencido',
  cancelled: 'Anulado',
};

export const cargarVales = () => staffApi<Vale[]>('/v1/vouchers');

/** Igual que la web: gift card (monto) o paquete de sesiones de un servicio; el cobro entra a caja. */
export const venderVale = (body: {
  kind: Vale['kind'];
  holder_name: string;
  holder_phone: string | null;
  amount?: number;
  service_item_id?: number;
  sessions?: number;
  price?: number;
  method: string;
}) => staffApi<Vale>('/v1/vouchers', { method: 'POST', body });
