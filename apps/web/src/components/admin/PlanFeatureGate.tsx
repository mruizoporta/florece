"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FEATURE_LABELS,
  FEATURE_LABELS_EN,
  featureForAdminPath,
  type PlanFeatures,
} from "@florece/shared";
import { ArrowUpRight, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useLocale } from "@/components/LocaleProvider";

export function PlanFeatureGate({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { tr, locale } = useLocale();
  const [features, setFeatures] = useState<PlanFeatures | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<{ entitlements?: { features?: PlanFeatures } }>(
      "/billing/account-status",
      { auth: true, tenantSlug: slug },
    )
      .then((status) => {
        if (cancelled) return;
        setFeatures(status.entitlements?.features ?? null);
      })
      .catch(() => {
        if (!cancelled) setFeatures(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const pathSuffix = useMemo(() => {
    const base = `/s/${slug}/admin`;
    if (!pathname.startsWith(base)) return "";
    return pathname.slice(base.length) || "";
  }, [pathname, slug]);

  const required = featureForAdminPath(pathSuffix);
  const blocked =
    loaded &&
    features != null &&
    required != null &&
    !features[required];

  if (!blocked) return <>{children}</>;

  const label =
    locale === "en"
      ? FEATURE_LABELS_EN[required]
      : FEATURE_LABELS[required];

  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 py-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-ink/[0.06] text-brand-ink">
        <Lock size={22} />
      </div>
      <div>
        <h1 className="font-serif text-3xl font-semibold text-brand-ink">
          {tr("upgrade.title")}
        </h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          {tr("upgrade.body")}
        </p>
        {label ? (
          <p className="mt-3 text-sm font-medium text-brand-ink">{label}</p>
        ) : null}
      </div>
      <Link
        href={`/s/${slug}/admin/billing`}
        className="btn-primary inline-flex items-center gap-2 text-sm"
      >
        {tr("upgrade.cta")}
        <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
