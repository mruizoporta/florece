"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { PlanFeatures } from "@florece/shared";
import { listBranches, switchBranch, type BranchInfo } from "@/lib/auth";
import { api } from "@/lib/api";

export function BranchSwitcher({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [canMulti, setCanMulti] = useState(false);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    listBranches(slug).then(setBranches).catch(() => setBranches([]));
    api<{ entitlements?: { features?: PlanFeatures } }>(
      "/billing/account-status",
      { auth: true, tenantSlug: slug },
    )
      .then((status) => {
        setCanMulti(Boolean(status.entitlements?.features?.branches));
      })
      .catch(() => setCanMulti(false));
  }, [slug]);

  if (!canMulti || branches.length <= 1) {
    return (
      <p className="truncate text-sm font-semibold text-brand-ink">/{slug}</p>
    );
  }

  const current = branches.find((b) => b.slug === slug) ?? branches[0];

  async function onSelect(branch: BranchInfo) {
    if (branch.slug === slug || switching) return;
    setSwitching(true);
    setOpen(false);
    try {
      await switchBranch({ slug: branch.slug }, slug);
      const rest = pathname.replace(`/s/${slug}`, "") || "/admin";
      router.push(`/s/${branch.slug}${rest.startsWith("/") ? rest : `/${rest}`}`);
      router.refresh();
    } catch {
      setSwitching(false);
    }
  }

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={switching}
        className="flex max-w-full items-center gap-1 truncate text-left"
      >
        <span className="truncate text-sm font-semibold text-brand-ink">
          {current?.name ?? `/${slug}`}
        </span>
        <ChevronDown size={14} className="shrink-0 text-brand-text-muted" />
      </button>
      <p className="truncate text-[11px] text-brand-text-muted">/{slug}</p>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-40 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-brand-ink/10 bg-brand-elevated shadow-lg">
            {branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => onSelect(branch)}
                className={`block w-full px-3 py-2.5 text-left text-sm transition hover:bg-brand-ink/[0.04] ${
                  branch.slug === slug
                    ? "font-semibold text-brand-ink"
                    : "text-brand-text-muted"
                }`}
              >
                <span className="block truncate">{branch.name}</span>
                <span className="block truncate text-[11px]">/{branch.slug}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
