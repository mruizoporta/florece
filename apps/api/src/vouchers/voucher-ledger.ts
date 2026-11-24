import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/** Canje guardado en OrderPayment: method «voucher», reference «CODIGO» (gift card) o «CODIGO:sesiones» (paquete). */
export const VOUCHER_METHOD = 'voucher';

export function voucherRef(code: string, sessions?: number) {
  return sessions ? `${code}:${sessions}` : code;
}

export function parseVoucherRef(reference: string | null) {
  const [code, n] = (reference ?? '').split(':');
  return { code, sessions: n ? Number(n) : 0 };
}

export function normalizeCode(raw: unknown) {
  return String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** Valor de una sesión del paquete (lo que la clienta pagó ÷ sesiones). */
export function sessionValue(v: { price: Prisma.Decimal; sessionsTotal: number }) {
  return v.sessionsTotal > 0 ? Number(v.price) / v.sessionsTotal : 0;
}

type Tx = Prisma.TransactionClient;
type Payment = { method: string; amount: Prisma.Decimal; reference: string | null };

/** Descuenta saldo/sesiones al cobrar. Falla si otro cobro ya lo usó (sin carreras). */
export async function consumeVouchers(tx: Tx, tenantId: bigint, payments: Payment[], now: Date) {
  for (const p of payments) {
    if (p.method !== VOUCHER_METHOD) continue;
    const { code, sessions } = parseVoucherRef(p.reference);
    const updated = sessions
      ? await tx.$executeRaw`
          UPDATE vouchers SET sessions_used = sessions_used + ${sessions}, updated_at = ${now}
          WHERE tenant_id = ${tenantId} AND code = ${code} AND kind = 'package'
            AND cancelled_at IS NULL AND (expires_at IS NULL OR expires_at > ${now})
            AND sessions_used + ${sessions} <= sessions_total`
      : await tx.$executeRaw`
          UPDATE vouchers SET balance = balance - ${p.amount}, updated_at = ${now}
          WHERE tenant_id = ${tenantId} AND code = ${code} AND kind = 'giftcard'
            AND cancelled_at IS NULL AND (expires_at IS NULL OR expires_at > ${now})
            AND balance >= ${p.amount}`;
    if (updated !== 1) {
      throw new BadRequestException(
        `El bono ${code} ya no alcanza, venció o fue anulado. Quitálo y volvé a aplicarlo.`,
      );
    }
  }
}

/** Devuelve saldo/sesiones al anular un ticket cobrado. */
export async function restoreVouchers(tx: Tx, tenantId: bigint, payments: Payment[], now: Date) {
  for (const p of payments) {
    if (p.method !== VOUCHER_METHOD) continue;
    const { code, sessions } = parseVoucherRef(p.reference);
    if (sessions) {
      await tx.$executeRaw`
        UPDATE vouchers SET sessions_used = GREATEST(sessions_used - ${sessions}, 0), updated_at = ${now}
        WHERE tenant_id = ${tenantId} AND code = ${code}`;
    } else {
      await tx.$executeRaw`
        UPDATE vouchers SET balance = LEAST(balance + ${p.amount}, price), updated_at = ${now}
        WHERE tenant_id = ${tenantId} AND code = ${code}`;
    }
  }
}
