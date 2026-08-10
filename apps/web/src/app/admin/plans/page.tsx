"use client";

import { useEffect, useState } from "react";
import {
  FEATURE_KEYS,
  FEATURE_LABELS,
  type FeatureKey,
} from "@florece/shared";
import {
  Calendar,
  Check,
  Image,
  Instagram,
  LayoutGrid,
  Package,
  Receipt,
  Sparkles,
  Store,
  Users,
  ClipboardList,
  ShoppingCart,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";
import { PlatformPageHeader, PlatformSurface } from "@/components/platform/PlatformUi";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

type Plan = {
  id: number;
  slug: string;
  name: string;
  priceNioMonthly: number | null;
  priceUsMonthly: number | null;
  maxEmployees: number | null;
  maxServices: number | null;
  features: string[];
  entitlements: Record<string, boolean>;
  active: boolean;
  trialDays: number;
};

const FEATURE_ICONS: Record<FeatureKey, typeof Calendar> = {
  appointments: ClipboardList,
  calendar: Calendar,
  pos: ShoppingCart,
  catalog: Package,
  customers: Users,
  instagram: Instagram,
  sponsors: Sparkles,
  images: Image,
  sections: LayoutGrid,
  billing: Receipt,
  accounting: Receipt,
  branches: Store,
};

function limitLabel(n: number | null, unit: string) {
  if (n == null) return `${unit} ilimitados`;
  return `Hasta ${n} ${unit}`;
}

export default function PlatformPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setPlans(await platformApi<Plan[]>("/plans"));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function toggleFeature(plan: Plan, key: FeatureKey) {
    setSaving(`${plan.slug}:${key}`);
    setMessage(null);
    const entitlements = {
      ...(plan.entitlements || {}),
      [key]: !plan.entitlements?.[key],
    };
    try {
      await platformApi(`/plans/${plan.slug}`, {
        method: "PATCH",
        body: { entitlements },
      });
      await load();
      setMessage(`${plan.name}: ${FEATURE_LABELS[key]} actualizado`);
    } finally {
      setSaving(null);
    }
  }

  async function toggleActive(plan: Plan, next: boolean) {
    setSaving(plan.slug);
    try {
      await platformApi(`/plans/${plan.slug}`, {
        method: "PATCH",
        body: { active: next },
      });
      await load();
      setMessage(`${plan.name} ${next ? "activado" : "desactivado"}`);
    } finally {
      setSaving(null);
    }
  }

  const ordered = [...plans].sort((a, b) => {
    const order = ["basico", "pro", "premium"];
    return order.indexOf(a.slug) - order.indexOf(b.slug);
  });

  return (
    <div className="space-y-8">
      <PlatformPageHeader
        eyebrow="Catálogo"
        title="Planes"
        description="Precios y módulos por plan. Tocá un módulo para activarlo o desactivarlo."
      />

      {message ? (
        <p className="text-sm font-medium text-emerald-800">{message}</p>
      ) : null}

      {/* Compact plan summaries */}
      <div className="grid gap-4 lg:grid-cols-3">
        {ordered.map((plan) => {
          const enabled = FEATURE_KEYS.filter((k) => plan.entitlements?.[k])
            .length;
          const featured = plan.slug === "pro";
          return (
            <PlatformSurface
              key={plan.slug}
              className={
                featured
                  ? "ring-1 ring-brand-primary/50"
                  : ""
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {featured ? (
                    <p className="mb-1 text-[10px] font-bold tracking-[0.16em] text-brand-primary-dark uppercase">
                      Recomendado
                    </p>
                  ) : null}
                  <h2 className="font-serif text-2xl font-semibold tracking-tight text-brand-ink">
                    {plan.name}
                  </h2>
                  <p className="mt-2 font-serif text-3xl tracking-tight text-brand-ink">
                    C${" "}
                    {(plan.priceNioMonthly ?? 0).toLocaleString("es-NI")}
                    <span className="ml-1 font-sans text-sm font-medium text-brand-text-muted">
                      /mes
                    </span>
                  </p>
                </div>
                <ToggleSwitch
                  id={`active-${plan.slug}`}
                  label={plan.active ? "En venta" : "Oculto"}
                  checked={plan.active}
                  onChange={() => {
                    if (saving !== plan.slug) toggleActive(plan, !plan.active);
                  }}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-brand-text-muted">
                <span className="rounded-lg bg-brand-mist/80 px-2.5 py-1">
                  {limitLabel(plan.maxEmployees, "empleados")}
                </span>
                <span className="rounded-lg bg-brand-mist/80 px-2.5 py-1">
                  {limitLabel(plan.maxServices, "servicios")}
                </span>
                <span className="rounded-lg bg-brand-mist/80 px-2.5 py-1">
                  {enabled}/{FEATURE_KEYS.length} módulos
                </span>
                <span className="rounded-lg bg-brand-mist/80 px-2.5 py-1">
                  Trial {plan.trialDays}d
                </span>
              </div>

              <ul className="mt-4 space-y-1.5 border-t border-brand-ink/[0.06] pt-4 text-sm text-brand-text-muted">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check
                      size={14}
                      className="mt-0.5 shrink-0 text-brand-primary-dark"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </PlatformSurface>
          );
        })}
      </div>

      {/* Module matrix — one list, not triplicated */}
      <PlatformSurface className="!p-0 overflow-x-auto">
        <div className="border-b border-brand-ink/[0.06] px-5 py-4">
          <h3 className="text-sm font-semibold text-brand-ink">Módulos por plan</h3>
          <p className="mt-1 text-xs text-brand-text-muted">
            Una fila = un módulo. Activá o desactivá por columna.
          </p>
        </div>

        <table className="w-full min-w-[40rem] text-left">
          <thead>
            <tr className="border-b border-brand-ink/[0.06] text-[11px] font-bold tracking-[0.12em] text-brand-text-muted uppercase">
              <th className="px-5 py-3 font-bold">Módulo</th>
              {ordered.map((plan) => (
                <th key={plan.slug} className="px-4 py-3 text-center font-bold">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURE_KEYS.map((key) => {
              const Icon = FEATURE_ICONS[key];
              return (
                <tr
                  key={key}
                  className="border-b border-brand-ink/[0.04] last:border-0"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-mist text-brand-ink">
                        <Icon size={15} />
                      </span>
                      <span className="text-sm font-medium text-brand-ink">
                        {FEATURE_LABELS[key]}
                      </span>
                    </div>
                  </td>
                  {ordered.map((plan) => {
                    const on = Boolean(plan.entitlements?.[key]);
                    const busy = saving === `${plan.slug}:${key}`;
                    return (
                      <td key={plan.slug} className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => toggleFeature(plan, key)}
                          aria-label={`${FEATURE_LABELS[key]} en ${plan.name}`}
                          aria-pressed={on}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
                            on
                              ? "bg-brand-primary text-brand-ink shadow-sm"
                              : "bg-brand-ink/[0.06] text-brand-text-muted hover:bg-brand-ink/[0.1]"
                          } disabled:opacity-50`}
                        >
                          <Check size={16} strokeWidth={on ? 2.5 : 2} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </PlatformSurface>
    </div>
  );
}
