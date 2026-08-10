"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowUpRight,
  CalendarClock,
  Check,
  MessageCircle,
} from "lucide-react";
import { planMarketingFeatures } from "@florece/shared";
import { api } from "@/lib/api";
import type { BillingInfo } from "@/lib/types";
import { useLocale } from "@/components/LocaleProvider";
import {
  AdminPill,
  AdminTable,
  LoadingSpinner,
} from "@/components/admin/AdminUi";
import { SITE } from "@/lib/site";
import { formatCurrency } from "@/lib/format";
import { useAccountStatus } from "@/components/admin/AccountStatusBanner";

type SaasPaymentRow = {
  id: number;
  amount: number;
  currency: string;
  method: string;
  reference?: string | null;
  paidAt: string;
  months: number;
  note?: string | null;
  plan?: { slug: string; name: string } | null;
};

type BillingPlan = {
  id: number;
  name: string;
  slug: string;
  priceNiMonthly: number | null;
  features: string[];
  active: boolean;
};

const statusLabels: Record<
  string,
  { label: string; tone: "primary" | "success" | "danger" | "muted"; blurb: string }
> = {
  trial: {
    label: "Prueba gratuita",
    tone: "primary",
    blurb: "Estás probando Florece. Al terminar, activamos tu plan con un pago manual.",
  },
  active: {
    label: "Activa",
    tone: "success",
    blurb: "Tu suscripción está vigente. Los pagos se registran por transferencia o depósito.",
  },
  past_due: {
    label: "Pago pendiente",
    tone: "danger",
    blurb: "Hay un pago por resolver. Escribinos para evitar la suspensión.",
  },
  suspended: {
    label: "Suspendida",
    tone: "danger",
    blurb: "El acceso está pausado hasta registrar el pago con Florece.",
  },
  cancelled: {
    label: "Cancelada",
    tone: "muted",
    blurb: "La suscripción está cancelada.",
  },
  canceled: {
    label: "Cancelada",
    tone: "muted",
    blurb: "La suscripción está cancelada.",
  },
};

function methodLabel(method: string) {
  const m = method.toUpperCase();
  if (m === "TRANSFER") return "Transferencia";
  if (m === "DEPOSIT") return "Depósito";
  if (m === "CASH") return "Efectivo";
  if (m === "OTHER") return "Otro";
  return method;
}

function formatMoney(amount: number, currency: string) {
  const symbol = currency === "NIO" || currency === "C$" ? "C$" : "$";
  return formatCurrency(amount, symbol);
}

function whatsappWithText(message: string) {
  const base = SITE.whatsappUrl.split("?")[0];
  return `${base}?text=${encodeURIComponent(message)}`;
}

export default function AdminBillingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr, locale } = useLocale();
  const accountStatus = useAccountStatus(slug);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [payments, setPayments] = useState<SaasPaymentRow[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [data, paymentRows, planRows] = await Promise.all([
          api<BillingInfo>("/billing", { tenantSlug: slug, auth: true }),
          api<SaasPaymentRow[]>("/billing/payments", {
            tenantSlug: slug,
            auth: true,
          }).catch(() => []),
          api<BillingPlan[]>("/billing/plans", {
            tenantSlug: slug,
            auth: true,
          }).catch(() => []),
        ]);
        setBilling(data);
        setPayments(paymentRows);
        setPlans(planRows.filter((p) => p.active !== false));
      } catch {
        setBilling({ subscriptionStatus: "trial" });
        setPayments([]);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const subscriptionStatus =
    billing?.tenant?.subscriptionStatus ??
    billing?.subscriptionStatus ??
    "trial";
  const planName =
    accountStatus?.planName ??
    billing?.tenant?.plan?.name ??
    billing?.planName;
  const planSlug =
    billing?.tenant?.plan?.slug ?? accountStatus?.planSlug ?? null;
  const trialEndsAt = billing?.tenant?.trialEndsAt ?? billing?.trialEndsAt;
  const subscriptionEndsAt =
    billing?.tenant?.subscriptionEndsAt ?? billing?.subscriptionEndsAt;
  const daysRemaining = accountStatus?.daysRemaining ?? null;
  const endsAt =
    subscriptionStatus === "trial" ? trialEndsAt : subscriptionEndsAt;

  const status = statusLabels[subscriptionStatus] ?? {
    label: subscriptionStatus,
    tone: "muted" as const,
    blurb: "Estado de tu cuenta Florece.",
  };

  const otherPlans = useMemo(
    () => plans.filter((p) => p.slug !== planSlug),
    [plans, planSlug],
  );

  function requestPlanMessage(target: BillingPlan) {
    const current = planName ? `plan ${planName}` : "mi plan actual";
    return `Hola Florece, soy del salón /${slug}. Tengo el ${current} y quiero cambiar al plan ${target.name}. ¿Me ayudan a coordinar el cambio?`;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-[2.15rem] font-semibold tracking-tight text-brand-ink sm:text-4xl">
          {tr("admin.billing")}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-brand-text-muted">
          {tr("billing.subtitle")}
        </p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-5">
          <div className="admin-card overflow-hidden !p-0">
            <div className="bg-[linear-gradient(150deg,#1e2128_0%,#2a2e38_55%,#1a1d24_100%)] px-6 py-7 text-white sm:px-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.1em] text-white/45 uppercase">
                    {tr("billing.status")}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
                      {status.label}
                    </h2>
                    <AdminPill tone={status.tone}>{subscriptionStatus}</AdminPill>
                  </div>
                  <p className="mt-2 max-w-md text-sm text-white/55">
                    {status.blurb}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                  <p className="text-[11px] font-semibold tracking-wide text-white/40 uppercase">
                    {tr("billing.plan")}
                  </p>
                  <p className="mt-1 font-serif text-2xl">
                    {planName ?? "Sin plan"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/6 px-4 py-3 ring-1 ring-white/8">
                  <p className="text-[11px] tracking-wide text-white/40 uppercase">
                    Vence
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {endsAt
                      ? new Date(endsAt).toLocaleDateString("es", {
                          dateStyle: "medium",
                        })
                      : "—"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/6 px-4 py-3 ring-1 ring-white/8">
                  <p className="text-[11px] tracking-wide text-white/40 uppercase">
                    Días restantes
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {daysRemaining != null ? `${daysRemaining}d` : "—"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/6 px-4 py-3 ring-1 ring-white/8">
                  <p className="text-[11px] tracking-wide text-white/40 uppercase">
                    Pagos registrados
                  </p>
                  <p className="mt-1 text-sm font-medium">{payments.length}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                <p className="text-sm text-white/55">
                  ¿Querés subir, bajar o consultar otro plan?
                </p>
                <a
                  href="#cambiar-plan"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-ink transition hover:brightness-105"
                >
                  {tr("billing.viewPlans")}
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>

          {(subscriptionStatus === "trial" ||
            subscriptionStatus === "past_due" ||
            subscriptionStatus === "suspended") && (
            <div className="admin-card flex flex-wrap items-center justify-between gap-4 !bg-brand-primary/15">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/40 text-brand-ink">
                  <CalendarClock size={18} />
                </span>
                <div>
                  <p className="font-semibold text-brand-ink">
                    Activar o renovar con Florece
                  </p>
                  <p className="mt-0.5 text-sm text-brand-text-muted">
                    Pagás por transferencia o depósito. Nosotros registramos el
                    pago y extendemos tu plan.
                  </p>
                </div>
              </div>
              <a
                href={whatsappWithText(
                  `Hola Florece, soy del salón /${slug}. Quiero activar o renovar mi suscripción.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
              >
                <MessageCircle size={16} />
                Contactar
              </a>
            </div>
          )}

          <div id="cambiar-plan" className="admin-card space-y-4 scroll-mt-24">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-brand-ink">
                  {tr("billing.changePlan")}
                </h2>
                <p className="mt-1 max-w-lg text-sm text-brand-text-muted">
                  {tr("billing.changePlanHint")}
                </p>
              </div>
              <a
                href={whatsappWithText(
                  `Hola Florece, soy del salón /${slug} (plan ${planName ?? "actual"}). Quiero consultar opciones de plan.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-ink/10 bg-brand-elevated px-3.5 py-2 text-sm font-medium text-brand-ink transition hover:bg-brand-ink/[0.03]"
              >
                <MessageCircle size={15} />
                {tr("billing.consult")}
              </a>
            </div>

            {plans.length === 0 ? (
              <p className="text-sm text-brand-text-muted">
                No se pudieron cargar los planes. Usá Consultar para hablar con
                Florece.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => {
                  const isCurrent = plan.slug === planSlug;
                  const bullets = planMarketingFeatures(
                    plan.slug,
                    locale === "en" ? "en" : "es",
                  );
                  return (
                    <div
                      key={plan.id}
                      className={`flex flex-col rounded-2xl border p-4 ${
                        isCurrent
                          ? "border-brand-primary/50 bg-brand-primary/10"
                          : "border-brand-ink/10 bg-brand-elevated"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-serif text-xl text-brand-ink">
                            {plan.name}
                          </p>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-brand-ink">
                            {plan.priceNiMonthly != null
                              ? `${formatCurrency(Number(plan.priceNiMonthly))}${tr("billing.perMonth")}`
                              : tr("billing.consult")}
                          </p>
                        </div>
                        {isCurrent ? (
                          <AdminPill tone="success">
                            {tr("billing.currentPlan")}
                          </AdminPill>
                        ) : null}
                      </div>
                      {bullets.length ? (
                        <ul className="mt-3 space-y-1.5 text-xs text-brand-text-muted">
                          {bullets.map((f) => (
                            <li key={f} className="flex gap-1.5">
                              <Check
                                size={13}
                                className="mt-0.5 shrink-0 text-brand-ink/35"
                              />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <div className="mt-4 grow" />
                      {isCurrent ? (
                        <p className="text-xs font-medium text-brand-text-muted">
                          {tr("billing.currentHint")}
                        </p>
                      ) : (
                        <a
                          href={whatsappWithText(requestPlanMessage(plan))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary inline-flex w-full items-center justify-center gap-2 text-sm"
                        >
                          {tr("billing.request")}
                          <ArrowUpRight size={14} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {otherPlans.length === 0 && plans.length > 0 ? (
              <p className="text-xs text-brand-text-muted">
                Ya tenés el único plan disponible. Si necesitás algo a medida,
                usá Consultar.
              </p>
            ) : null}
          </div>

          <div className="admin-card space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-brand-ink">
                {tr("billing.howPayment")}
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-brand-text-muted">
                <li className="flex items-start gap-2">
                  <Check size={15} className="mt-0.5 shrink-0 text-brand-ink/35" />
                  Transferencia, depósito u otro método que coordinemos.
                </li>
                <li className="flex items-start gap-2">
                  <Check size={15} className="mt-0.5 shrink-0 text-brand-ink/35" />
                  Florece registra el pago y renueva tu período.
                </li>
                <li className="flex items-start gap-2">
                  <Check size={15} className="mt-0.5 shrink-0 text-brand-ink/35" />
                  Si no hay pago a tiempo, podemos suspender el acceso.
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-brand-ink">
              {tr("billing.paymentHistory")}
            </h2>
            <AdminTable
              headers={["Fecha", "Método", "Monto", "Período", "Referencia"]}
              empty={payments.length === 0}
              emptyTitle="Sin pagos registrados"
              emptyDescription="Cuando Florece registre una transferencia o depósito, aparecerá acá."
            >
              {payments.map((p) => (
                <tr key={p.id} className="transition hover:bg-brand-warm/80">
                  <td className="px-5 py-4 text-brand-ink">
                    {new Date(p.paidAt).toLocaleDateString("es", {
                      dateStyle: "medium",
                    })}
                  </td>
                  <td className="px-5 py-4 text-brand-text-muted">
                    {methodLabel(p.method)}
                    {p.plan?.name ? (
                      <span className="mt-0.5 block text-xs">
                        Plan {p.plan.name}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 font-semibold tabular-nums text-brand-ink">
                    {formatMoney(p.amount, p.currency)}
                  </td>
                  <td className="px-5 py-4 text-brand-text-muted">
                    {p.months} {p.months === 1 ? "mes" : "meses"}
                  </td>
                  <td className="px-5 py-4 text-sm text-brand-text-muted">
                    {p.reference || p.note || "—"}
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>
        </div>
      )}
    </div>
  );
}
