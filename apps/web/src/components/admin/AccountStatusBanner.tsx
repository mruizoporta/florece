"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { api, getStoredTenantSlug } from "@/lib/api";
import { SITE } from "@/lib/site";

export type AccountStatus = {
  tenantStatus: string;
  planName: string | null;
  planSlug: string | null;
  daysRemaining: number | null;
  showWarning: boolean;
  warning: string | null;
  softBlock: boolean;
  hardBlock: boolean;
  blocked: boolean;
  isDemo: boolean;
};

export function AccountStatusBanner({ slug }: { slug: string }) {
  const [status, setStatus] = useState<AccountStatus | null>(null);

  useEffect(() => {
    api<AccountStatus>("/billing/account-status", {
      auth: true,
      tenantSlug: slug,
    })
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [slug]);

  if (!status?.showWarning || !status.warning) return null;

  const hard = status.hardBlock || status.blocked;
  return (
    <div
      className={`no-print border-b px-4 py-3 text-sm sm:px-6 lg:px-10 ${
        hard
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1">{status.warning}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/s/${slug}/admin/billing`}
            className="rounded-xl bg-brand-elevated/80 px-3 py-1.5 text-xs font-semibold"
          >
            Ver facturación
          </Link>
          <a
            href={SITE.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-elevated/80 px-3 py-1.5 text-xs font-semibold"
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export function useAccountStatus(slug?: string): AccountStatus | null {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  useEffect(() => {
    api<AccountStatus>("/billing/account-status", {
      auth: true,
      tenantSlug: slug ?? getStoredTenantSlug() ?? undefined,
    })
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [slug]);
  return status;
}
