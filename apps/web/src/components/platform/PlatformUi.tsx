"use client";

import type { ReactNode } from "react";

export function PlatformPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-[11px] font-bold tracking-[0.16em] text-brand-primary-dark uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-serif text-[2.15rem] leading-none font-semibold tracking-tight text-brand-ink md:text-[2.5rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PlatformSurface({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[1.35rem] border border-brand-ink/[0.06] bg-white/90 shadow-[0_18px_50px_-32px_rgba(29,31,36,0.45)] backdrop-blur-sm ${
        padded ? "p-5 sm:p-6" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: string;
}) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/12 text-emerald-800 ring-emerald-500/20",
    trial: "bg-sky-500/12 text-sky-800 ring-sky-500/20",
    past_due: "bg-amber-500/15 text-amber-900 ring-amber-500/25",
    suspended: "bg-red-500/12 text-red-800 ring-red-500/20",
  };
  const tone = map[status] ?? "bg-brand-ink/6 text-brand-ink ring-brand-ink/10";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ring-1 ring-inset ${tone}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
