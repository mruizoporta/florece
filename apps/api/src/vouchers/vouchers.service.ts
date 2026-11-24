import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';
import { VOUCHER_METHOD, normalizeCode, parseVoucherRef } from './voucher-ledger';

// Sin 0/O ni 1/I/L: se dictan por teléfono.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const PAY_METHODS = ['cash', 'card', 'transfer', 'other'];

export type SellVoucherInput = {
  kind?: string;
  holder_name?: string;
  holder_phone?: string | null;
  amount?: number;
  service_item_id?: number;
  sessions?: number;
  price?: number;
  expires_at?: string | null;
  method?: string;
  reference?: string | null;
};

type VoucherRow = Prisma.VoucherGetPayload<object>;

@Injectable()
export class VouchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId() {
    return this.tenantContext.getTenant().id;
  }

  map(v: VoucherRow, now = new Date()) {
    const expired = v.expiresAt != null && v.expiresAt <= now;
    const used =
      v.kind === 'package' ? v.sessionsUsed >= v.sessionsTotal : Number(v.balance) <= 0;
    return {
      id: Number(v.id),
      code: v.code,
      kind: v.kind,
      holderName: v.holderName,
      holderPhone: v.holderPhone,
      price: Number(v.price),
      balance: Number(v.balance),
      serviceItemId: v.serviceItemId ? Number(v.serviceItemId) : null,
      serviceName: v.serviceName,
      sessionsTotal: v.sessionsTotal,
      sessionsUsed: v.sessionsUsed,
      expiresAt: v.expiresAt?.toISOString() ?? null,
      createdAt: v.createdAt?.toISOString() ?? null,
      saleOrderId: v.saleOrderId ? Number(v.saleOrderId) : null,
      status: v.cancelledAt ? 'cancelled' : expired ? 'expired' : used ? 'used' : 'active',
    };
  }

  async list() {
    const rows = await this.prisma.voucher.findMany({
      where: { tenantId: this.tenantId() },
      orderBy: { id: 'desc' },
      take: 500,
    });
    return rows.map((v) => this.map(v));
  }

  /** Detalle con los canjes (tickets cobrados que lo usaron). */
  async get(id: bigint) {
    const v = await this.requireVoucher({ id });
    const uses = await this.prisma.orderPayment.findMany({
      where: {
        tenantId: this.tenantId(),
        method: VOUCHER_METHOD,
        reference: { startsWith: v.code },
        order: { status: 'finalized' },
      },
      include: { order: { select: { id: true, finalizedAt: true } } },
      orderBy: { id: 'desc' },
    });
    return {
      ...this.map(v),
      uses: uses
        .filter((u) => parseVoucherRef(u.reference).code === v.code)
        .map((u) => ({
          orderId: Number(u.order.id),
          at: u.order.finalizedAt?.toISOString() ?? null,
          amount: Number(u.amount),
          sessions: parseVoucherRef(u.reference).sessions,
        })),
      salonName: this.tenantContext.getTenant().name,
    };
  }

  async lookup(rawCode: string) {
    const code = normalizeCode(rawCode);
    const v = await this.prisma.voucher.findUnique({
      where: { tenantId_code: { tenantId: this.tenantId(), code } },
    });
    if (!v) throw new NotFoundException(`No existe el bono ${code || rawCode}`);
    return this.map(v);
  }

  async requireVoucher(where: { id?: bigint; code?: string }) {
    const v = await this.prisma.voucher.findFirst({
      where: { tenantId: this.tenantId(), ...where },
    });
    if (!v) throw new NotFoundException('Bono no encontrado');
    return v;
  }

  private async newCode() {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
      const taken = await this.prisma.voucher.findUnique({
        where: { tenantId_code: { tenantId: this.tenantId(), code } },
        select: { id: true },
      });
      if (!taken) return code;
    }
    throw new BadRequestException('No se pudo generar el código, probá de nuevo');
  }

  /** Vende el bono: orden «prepaid» (entra a caja, no a ventas) + el bono. */
  async sell(input: SellVoucherInput, userId: bigint | null) {
    const tenantId = this.tenantId();
    const kind = input.kind === 'package' ? 'package' : input.kind === 'giftcard' ? 'giftcard' : null;
    if (!kind) throw new BadRequestException('Tipo de bono inválido');
    const holderName = input.holder_name?.trim().slice(0, 120);
    if (!holderName) throw new BadRequestException('Indicá para quién es el bono');
    const method = String(input.method ?? '').toLowerCase();
    if (!PAY_METHODS.includes(method)) throw new BadRequestException('Forma de pago inválida');

    let price: number;
    let serviceItemId: bigint | null = null;
    let serviceName: string | null = null;
    let sessions = 0;
    if (kind === 'giftcard') {
      price = Number(input.amount);
    } else {
      price = Number(input.price);
      sessions = Math.trunc(Number(input.sessions));
      if (!Number.isFinite(sessions) || sessions < 2 || sessions > 100) {
        throw new BadRequestException('Un paquete lleva entre 2 y 100 sesiones');
      }
      const item = await this.prisma.item.findFirst({
        where: { id: BigInt(input.service_item_id ?? 0), tenantId, service: { isNot: null } },
        select: { id: true, name: true },
      });
      if (!item) throw new BadRequestException('Elegí el servicio del paquete');
      serviceItemId = item.id;
      serviceName = item.name;
    }
    if (!Number.isFinite(price) || price <= 0 || price > 10_000_000) {
      throw new BadRequestException('Monto inválido');
    }
    price = Math.round(price * 100) / 100;

    let expiresAt: Date | null = null;
    if (input.expires_at) {
      expiresAt = new Date(`${String(input.expires_at).slice(0, 10)}T23:59:59`);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
        throw new BadRequestException('La fecha de vencimiento tiene que ser futura');
      }
    }

    const code = await this.newCode();
    const label =
      kind === 'giftcard' ? `Gift card ${code}` : `Paquete ${sessions}× ${serviceName} · ${code}`;
    const now = new Date();
    const amount = new Prisma.Decimal(price);

    const voucher = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          tenantId,
          name: `${label} — ${holderName}`,
          status: 'prepaid',
          paymentStatus: true,
          subtotal: amount,
          total: amount,
          finalizedAt: now,
          createdAt: now,
          updatedAt: now,
          items: {
            create: {
              tenantId,
              quantity: 1,
              productNameSnapshot: label,
              unitPriceSnapshot: amount,
              price: amount,
              lineTotal: amount,
              createdAt: now,
              updatedAt: now,
            },
          },
          payments: {
            create: {
              tenantId,
              method,
              amount,
              reference: input.reference?.trim().slice(0, 120) || null,
              paidAt: now,
              createdAt: now,
              updatedAt: now,
            },
          },
        },
      });
      return tx.voucher.create({
        data: {
          tenantId,
          code,
          kind,
          holderName,
          holderPhone: input.holder_phone?.trim().slice(0, 40) || null,
          price: amount,
          balance: kind === 'giftcard' ? amount : 0,
          serviceItemId,
          serviceName,
          sessionsTotal: sessions,
          saleOrderId: order.id,
          expiresAt,
          createdById: userId,
          createdAt: now,
          updatedAt: now,
        },
      });
    });
    return this.map(voucher);
  }

  /** Anula un bono sin usar: también anula su venta (sale de caja). */
  async cancel(id: bigint) {
    const v = await this.requireVoucher({ id });
    if (v.cancelledAt) return this.map(v);
    const untouched =
      v.kind === 'package' ? v.sessionsUsed === 0 : Number(v.balance) === Number(v.price);
    if (!untouched) {
      throw new BadRequestException('Este bono ya se usó: no se puede anular');
    }
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      // Condicional: si justo lo canjearon, no se anula.
      const { count } = await tx.voucher.updateMany({
        where: { id: v.id, cancelledAt: null, sessionsUsed: 0, balance: v.balance },
        data: { cancelledAt: now, updatedAt: now },
      });
      if (count !== 1) throw new BadRequestException('Este bono ya se usó: no se puede anular');
      if (v.saleOrderId) {
        await tx.order.update({
          where: { id: v.saleOrderId },
          data: { status: 'cancelled', cancelledAt: now, cancelledReason: 'Bono anulado', updatedAt: now },
        });
      }
      return tx.voucher.findUniqueOrThrow({ where: { id: v.id } });
    });
    return this.map(updated);
  }
}
