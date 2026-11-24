export type Voucher = {
  id: number;
  code: string;
  kind: "giftcard" | "package";
  holderName: string;
  holderPhone: string | null;
  price: number;
  balance: number;
  serviceItemId: number | null;
  serviceName: string | null;
  sessionsTotal: number;
  sessionsUsed: number;
  expiresAt: string | null;
  createdAt: string | null;
  saleOrderId: number | null;
  status: "active" | "used" | "expired" | "cancelled";
};

export const VOUCHER_STATUS: Record<Voucher["status"], { label: string; tone: "success" | "muted" | "danger" | "neutral" }> = {
  active: { label: "Vigente", tone: "success" },
  used: { label: "Usado", tone: "muted" },
  expired: { label: "Vencido", tone: "danger" },
  cancelled: { label: "Anulado", tone: "danger" },
};
