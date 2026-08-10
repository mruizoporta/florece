import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { TENANT_STATUS, TenantService } from '../tenant/tenant.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import {
  assertPlanLimitsOrThrow,
  computePlanLimitExcesses,
  getStripePriceIdForRegion,
} from './plan-limits';
import type { TenantWithOrganization } from '../organizations/organizations.types';

@Injectable()
export class BillingService {
  private stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly tenantService: TenantService,
    private readonly entitlements: EntitlementsService,
  ) {
    const secret = this.config.get<string>('STRIPE_SECRET');
    this.stripe = secret ? new Stripe(secret) : null;
  }

  async accountStatus(tenantId: bigint) {
    const tenant = await this.requireTenantWithOrg(tenantId);
    const org = tenant.organization;
    const now = new Date();
    const status = this.normalizeStatus(org.subscriptionStatus);
    const trialEndsAt = org.trialEndsAt;
    const periodEnd = org.subscriptionEndsAt;
    const trialExpired = Boolean(trialEndsAt && trialEndsAt < now);
    const periodExpired = Boolean(periodEnd && periodEnd < now);

    let warning: string | null = null;
    let softBlock = false;
    let hardBlock = false;

    if (status === 'suspended') {
      hardBlock = true;
      warning =
        'Tu cuenta está suspendida. Contacta a Florece por WhatsApp para reactivar.';
    } else if (status === 'past_due') {
      softBlock = true;
      warning =
        'Tu cuenta tiene pago pendiente. Registra una transferencia o depósito con Florece para evitar la suspensión.';
    } else if (status === 'trial' && trialExpired) {
      softBlock = true;
      warning =
        'Tu prueba terminó. Contacta a Florece para activar tu plan (transferencia / depósito).';
    } else if (status === 'active' && periodExpired) {
      softBlock = true;
      warning =
        'Tu período venció. Contacta a Florece para registrar el pago del mes.';
    }

    const daysRemaining = (() => {
      const end =
        status === 'trial' ? trialEndsAt : periodEnd ?? trialEndsAt;
      if (!end) return null;
      return Math.ceil((end.getTime() - now.getTime()) / 86_400_000);
    })();

    const entitlements = await this.entitlements.resolve(tenantId);

    return {
      tenantStatus: status,
      subscriptionStatus: org.subscriptionStatus,
      planSlug: org.plan?.slug ?? null,
      planName: org.plan?.name ?? null,
      trialEndsAt,
      subscriptionEndsAt: periodEnd,
      trialExpired,
      periodExpired,
      daysRemaining,
      showWarning: Boolean(warning),
      warning,
      softBlock,
      hardBlock,
      blocked: hardBlock,
      isDemo: tenant.isDemo,
      entitlements: {
        features: entitlements.features,
        featureList: entitlements.featureList,
        maxEmployees: entitlements.maxEmployees,
        maxServices: entitlements.maxServices,
      },
    };
  }

  private normalizeStatus(raw: string): string {
    if (raw === 'pending_payment') return 'past_due';
    if (raw === 'canceled' || raw === 'expired') return 'suspended';
    return raw;
  }

  async listTenantPayments(tenantId: bigint) {
    const tenant = await this.requireTenantWithOrg(tenantId);
    const payments = await this.prisma.saasPayment.findMany({
      where: { organizationId: tenant.organizationId },
      include: {
        plan: { select: { slug: true, name: true } },
      },
      orderBy: { paidAt: 'desc' },
      take: 50,
    });

    return payments.map((p) => ({
      id: Number(p.id),
      amount: Number(p.amount),
      currency: p.currency,
      method: p.method,
      reference: p.reference,
      paidAt: p.paidAt,
      months: p.months,
      note: p.note,
      plan: p.plan,
    }));
  }

  async getBillingInfo(tenantId: bigint) {
    const tenant = await this.requireTenantWithOrg(tenantId);
    const org = tenant.organization;

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
        stripeStatus: { in: ['active', 'trialing', 'past_due'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: org.plan
          ? {
              id: org.plan.id,
              name: org.plan.name,
              slug: org.plan.slug,
              maxEmployees: org.plan.maxEmployees,
              maxServices: org.plan.maxServices,
            }
          : null,
        scheduledPlan: org.scheduledPlan
          ? {
              id: org.scheduledPlan.id,
              name: org.scheduledPlan.name,
              slug: org.scheduledPlan.slug,
              maxEmployees: org.scheduledPlan.maxEmployees,
              maxServices: org.scheduledPlan.maxServices,
            }
          : null,
        subscriptionStatus: org.subscriptionStatus,
        trialEndsAt: org.trialEndsAt,
        subscriptionEndsAt: org.subscriptionEndsAt,
        billingRegion: org.billingRegion,
        billingEmail: org.billingEmail,
      },
      subscription: subscription
        ? {
            stripeId: subscription.stripeId,
            stripeStatus: subscription.stripeStatus,
            endsAt: subscription.endsAt,
            onTrial: subscription.stripeStatus === 'trialing',
          }
        : null,
    };
  }

  async listPlans() {
    return this.prisma.plan.findMany({ orderBy: { id: 'asc' } });
  }

  async createCheckoutSession(
    tenantId: bigint,
    planSlug: string,
    billingEmail?: string,
  ) {
    const tenant = await this.requireTenantForBilling(tenantId);
    const org = tenant.organization;
    const plan = await this.requirePlan(planSlug);
    const stripePriceId = this.requireStripePriceForTenant(
      plan,
      org.billingRegion,
    );

    if (billingEmail) {
      await this.prisma.organization.update({
        where: { id: org.id },
        data: { billingEmail, updatedAt: new Date() },
      });
    }

    if (!this.stripe) {
      const mockUrl = `${this.config.get('API_URL', 'http://localhost:3001')}/billing/mock-checkout?tenant=${tenant.slug}&plan=${plan.slug}`;
      return { url: mockUrl, mock: true };
    }

    let stripeCustomerId = org.stripeId;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: billingEmail ?? org.billingEmail ?? undefined,
        name: org.name,
        metadata: {
          organization_id: String(org.id),
          tenant_id: String(tenantId),
        },
      });
      stripeCustomerId = customer.id;
      await this.prisma.organization.update({
        where: { id: org.id },
        data: { stripeId: stripeCustomerId, updatedAt: new Date() },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: this.config.getOrThrow<string>('STRIPE_SUCCESS_URL'),
      cancel_url: this.config.getOrThrow<string>('STRIPE_CANCEL_URL'),
      metadata: {
        organization_id: String(org.id),
        tenant_id: String(tenantId),
        plan_slug: plan.slug,
      },
    });

    return { url: session.url, sessionId: session.id, mock: false };
  }

  async upgrade(tenantId: bigint, planSlug: string) {
    const tenant = await this.requireTenantForBilling(tenantId);
    const org = tenant.organization;
    const plan = await this.requirePlan(planSlug);
    const stripePriceId = this.requireStripePriceForTenant(
      plan,
      org.billingRegion,
    );

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
        stripeStatus: { in: ['active', 'trialing', 'past_due'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new BadRequestException(
        'No hay suscripción activa para cambiar.',
      );
    }

    if (this.stripe) {
      const stripeSub = await this.stripe.subscriptions.retrieve(
        subscription.stripeId,
      );
      const itemId = stripeSub.items.data[0]?.id;
      if (!itemId) {
        throw new BadRequestException(
          'La suscripción de Stripe no tiene ítems.',
        );
      }
      await this.stripe.subscriptions.update(subscription.stripeId, {
        items: [{ id: itemId, price: stripePriceId }],
        proration_behavior: 'always_invoice',
      });
    }

    await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        planId: plan.id,
        scheduledPlanId: null,
        subscriptionStatus: TENANT_STATUS.ACTIVE,
        subscriptionEndsAt: null,
        updatedAt: new Date(),
      },
    });

    return {
      plan: { id: plan.id, name: plan.name, slug: plan.slug },
      mock: !this.stripe,
      message: 'Plan upgraded successfully',
    };
  }

  async downgrade(tenantId: bigint, planSlug: string) {
    const tenant = await this.requireTenantForBilling(tenantId);
    const org = tenant.organization;

    if (org.scheduledPlanId) {
      throw new BadRequestException(
        'Ya tienes un cambio de plan programado. Espera a que se aplique.',
      );
    }

    const plan = await this.requirePlan(planSlug);
    await this.assertTenantFitsPlan(tenantId, plan);
    const stripePriceId = this.requireStripePriceForTenant(
      plan,
      org.billingRegion,
    );

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
        stripeStatus: { in: ['active', 'trialing', 'past_due'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new BadRequestException(
        'No hay suscripción activa para cambiar.',
      );
    }

    const scheduledAt =
      subscription.endsAt ??
      org.subscriptionEndsAt ??
      new Date(Date.now() + 30 * 86_400_000);

    if (this.stripe) {
      const schedule = await this.stripe.subscriptionSchedules.create({
        from_subscription: subscription.stripeId,
      });
      const currentPhase = schedule.phases[0];
      await this.stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: 'release',
        phases: [
          {
            items: currentPhase.items.map((item) => ({
              price: item.price as string,
              quantity: item.quantity ?? 1,
            })),
            start_date: currentPhase.start_date,
            end_date: currentPhase.end_date,
          },
          {
            items: [{ price: stripePriceId, quantity: 1 }],
            start_date: currentPhase.end_date,
            proration_behavior: 'none',
          },
        ],
      });
    }

    await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        scheduledPlanId: plan.id,
        updatedAt: new Date(),
      },
    });

    return {
      scheduledPlan: { id: plan.id, name: plan.name, slug: plan.slug },
      scheduledAt,
      mock: !this.stripe,
      message:
        'El downgrade se aplicará al final del período de facturación actual.',
    };
  }

  async createPortalSession(tenantId: bigint) {
    const tenant = await this.requireTenantForBilling(tenantId);
    const org = tenant.organization;

    if (!this.stripe || !org.stripeId) {
      const mockUrl = `${this.config.get('API_URL', 'http://localhost:3001')}/billing/mock-portal?tenant=${tenant.slug}`;
      return { url: mockUrl, mock: true };
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: org.stripeId,
      return_url: this.config.getOrThrow<string>('STRIPE_SUCCESS_URL'),
    });

    return { url: session.url, mock: false };
  }

  private async assertTenantFitsPlan(
    tenantId: bigint,
    plan: { maxEmployees: number | null; maxServices: number | null },
  ) {
    const [employees, services] = await Promise.all([
      this.prisma.employee.count({ where: { tenantId } }),
      this.prisma.service.count({ where: { item: { tenantId } } }),
    ]);

    assertPlanLimitsOrThrow(
      computePlanLimitExcesses(plan, { employees, services }),
    );
  }

  private requireStripePriceForTenant(
    plan: { stripePriceIdNi: string | null; stripePriceIdUs: string | null },
    billingRegion: string | null,
  ): string {
    const priceId = getStripePriceIdForRegion(plan, billingRegion);
    if (!priceId) {
      throw new BadRequestException(
        'No hay precio configurado para tu región.',
      );
    }
    return priceId;
  }

  private async requireTenantWithOrg(
    tenantId: bigint,
  ): Promise<TenantWithOrganization> {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  private async requireTenantForBilling(tenantId: bigint) {
    const tenant = await this.requireTenantWithOrg(tenantId);
    if (this.tenantService.isDemo(tenant)) {
      throw new ForbiddenException('Billing not available for demo tenant');
    }
    return tenant;
  }

  private async requirePlan(planSlug: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { slug: planSlug },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!this.stripe) {
      return { received: true, mock: true };
    }

    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret || !signature) {
      return { received: false, error: 'Webhook not configured' };
    }

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId =
        session.metadata?.organization_id ?? session.metadata?.tenant_id;
      const planSlug = session.metadata?.plan_slug;
      if (organizationId && planSlug) {
        const plan = await this.prisma.plan.findUnique({
          where: { slug: planSlug },
        });
        // metadata may still say tenant_id historically; resolve org via tenant if needed
        let orgId = BigInt(organizationId);
        if (!session.metadata?.organization_id && session.metadata?.tenant_id) {
          const t = await this.prisma.tenant.findUnique({
            where: { id: BigInt(session.metadata.tenant_id) },
            select: { organizationId: true },
          });
          if (t) orgId = t.organizationId;
        }
        await this.prisma.organization.update({
          where: { id: orgId },
          data: {
            planId: plan?.id,
            subscriptionStatus: TENANT_STATUS.ACTIVE,
            updatedAt: new Date(),
          },
        });
      }
    }

    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.created'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantIdMeta = subscription.metadata?.tenant_id;
      const orgIdMeta = subscription.metadata?.organization_id;
      if (tenantIdMeta || orgIdMeta) {
        const status =
          subscription.status === 'trialing'
            ? TENANT_STATUS.TRIAL
            : subscription.status === 'active'
              ? TENANT_STATUS.ACTIVE
              : subscription.status;

        if (tenantIdMeta) {
          await this.prisma.subscription.upsert({
            where: { stripeId: subscription.id },
            create: {
              tenantId: BigInt(tenantIdMeta),
              type: 'default',
              stripeId: subscription.id,
              stripeStatus: subscription.status,
              stripePrice: subscription.items.data[0]?.price.id ?? null,
              quantity: subscription.items.data[0]?.quantity ?? 1,
              trialEndsAt: subscription.trial_end
                ? new Date(subscription.trial_end * 1000)
                : null,
              endsAt: subscription.cancel_at
                ? new Date(subscription.cancel_at * 1000)
                : null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            update: {
              stripeStatus: subscription.status,
              updatedAt: new Date(),
            },
          });
        }

        let orgId: bigint | null = orgIdMeta ? BigInt(orgIdMeta) : null;
        if (!orgId && tenantIdMeta) {
          const t = await this.prisma.tenant.findUnique({
            where: { id: BigInt(tenantIdMeta) },
            select: { organizationId: true },
          });
          orgId = t?.organizationId ?? null;
        }
        if (orgId) {
          await this.prisma.organization.update({
            where: { id: orgId },
            data: {
              subscriptionStatus: status,
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    return { received: true };
  }
}
