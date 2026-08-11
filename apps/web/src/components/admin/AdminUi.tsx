"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Archive, ArrowLeftRight, Eye, Pencil, Plus, Receipt, Search, Trash2, X } from "lucide-react";
import { FloreceLogo } from "@/components/brand/FloreceLogo";

export function AdminPageHeader({
  title,
  subtitle,
  action,
  actionHref,
  actionLabel,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-1.5">
          <FloreceLogo variant="mark" tone="gold" size="sm" />
          <p className="text-[11px] font-semibold tracking-[0.18em] text-brand-primary-dark/80 uppercase">
            Florece
          </p>
        </div>
        <h1 className="font-serif text-[2.25rem] font-semibold tracking-tight text-brand-ink sm:text-[2.5rem]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-brand-text-muted">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ??
        (actionHref && actionLabel ? (
          <Link href={actionHref} className="btn-primary inline-flex items-center gap-2 py-2.5 text-sm">
            <Plus size={16} strokeWidth={2.25} />
            {actionLabel}
          </Link>
        ) : null)}
    </div>
  );
}

export function AdminCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`admin-card ${className}`}>{children}</div>;
}

export function AdminSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <AdminCard className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-brand-ink">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-brand-text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </AdminCard>
  );
}

export function AdminToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">{children}</div>
  );
}

export function AdminSearchField({
  value,
  onChange,
  placeholder = "Buscar…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="relative block min-w-[14rem] max-w-sm flex-1">
      <Search
        size={16}
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-text-muted"
      />
      <input
        className="input-field !rounded-2xl !py-2.5 !pr-4 !pl-11"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function AdminPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "danger" | "muted";
}) {
  const tones = {
    neutral: "bg-brand-warm text-brand-ink",
    primary: "bg-brand-primary/20 text-brand-primary-dark",
    success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    danger: "bg-red-500/15 text-red-700 dark:text-red-300",
    muted: "bg-brand-ink/5 text-brand-text-muted",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function AdminTable({
  headers,
  children,
  empty,
  emptyTitle = "Todavía no hay datos",
  emptyDescription,
}: {
  headers: string[];
  children: ReactNode;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  return (
    <AdminCard className="overflow-hidden !p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr className="border-b border-brand-ink/6 bg-brand-warm">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-[11px] font-semibold tracking-[0.08em] text-brand-text-muted uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-ink/5">
            {empty ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-16 text-center">
                  <p className="font-medium text-brand-ink">{emptyTitle}</p>
                  {emptyDescription ? (
                    <p className="mx-auto mt-1 max-w-sm text-sm text-brand-text-muted">
                      {emptyDescription}
                    </p>
                  ) : null}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
}

export function AdminModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-brand-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`admin-drawer-panel relative z-10 flex h-dvh w-full flex-col bg-brand-elevated shadow-[-16px_0_48px_-12px_rgba(20,20,20,0.35)] ${
          wide ? "max-w-xl" : "max-w-md"
        }`}
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-brand-ink/[0.06] px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-lg font-semibold tracking-tight text-brand-ink">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-sm text-brand-text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-text-muted transition hover:bg-brand-ink/5 hover:text-brand-ink"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-brand-ink/[0.06] bg-brand-warm px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}

export function RoleChip({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
        active
          ? "bg-brand-ink text-brand-base"
          : "bg-brand-ink/[0.03] text-brand-ink hover:bg-brand-ink/[0.06]"
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border text-[9px] font-bold ${
          active
            ? "border-brand-primary bg-brand-primary text-brand-on-primary"
            : "border-brand-ink/20 bg-brand-elevated text-transparent"
        }`}
      >
        ✓
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description ? (
          <span
            className={`mt-0.5 block text-xs leading-snug ${
              active ? "text-brand-base/65" : "text-brand-text-muted"
            }`}
          >
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
    </div>
  );
}

export function MessageBanner({
  message,
  type = "success",
}: {
  message: string;
  type?: "success" | "error";
}) {
  return (
    <p
      className={`rounded-2xl px-4 py-3 text-sm ${
        type === "error"
          ? "bg-red-500/10 text-red-700 dark:text-red-300"
          : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
      }`}
    >
      {message}
    </p>
  );
}

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-brand-primary text-brand-on-primary shadow-sm shadow-brand-primary/30"
          : "bg-brand-elevated/80 text-brand-text-muted ring-1 ring-brand-ink/8 hover:text-brand-ink hover:ring-brand-ink/15"
      }`}
    >
      {children}
    </button>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/25 font-serif text-xl text-brand-ink">
        ✦
      </div>
      <p className="font-medium text-brand-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-brand-text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminPrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="btn-primary inline-flex items-center gap-2 py-2.5 text-sm disabled:opacity-50"
    >
      <Plus size={16} strokeWidth={2.25} />
      {children}
    </button>
  );
}

const iconActionBase =
  "inline-flex h-9 w-9 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export function AdminIconButton({
  action,
  label,
  onClick,
  href,
  target,
}: {
  action: "edit" | "delete" | "archive" | "view" | "ticket" | "stock";
  label: string;
  onClick?: () => void;
  href?: string;
  target?: string;
}) {
  const styles = {
    edit: `${iconActionBase} bg-brand-warm text-brand-ink hover:bg-brand-primary/40 focus-visible:outline-brand-primary`,
    view: `${iconActionBase} bg-brand-warm text-brand-ink hover:bg-brand-primary/40 focus-visible:outline-brand-primary`,
    ticket: `${iconActionBase} bg-brand-primary/35 text-brand-ink hover:bg-brand-primary/55 focus-visible:outline-brand-primary`,
    stock: `${iconActionBase} bg-brand-primary/35 text-brand-ink hover:bg-brand-primary/55 focus-visible:outline-brand-primary`,
    archive: `${iconActionBase} bg-brand-ink/[0.04] text-brand-text-muted hover:bg-amber-50 hover:text-amber-800 focus-visible:outline-amber-500`,
    delete: `${iconActionBase} bg-brand-ink/[0.04] text-brand-text-muted hover:bg-red-50 hover:text-red-600 focus-visible:outline-red-500`,
  } as const;

  const icons = {
    edit: Pencil,
    view: Eye,
    ticket: Receipt,
    stock: ArrowLeftRight,
    archive: Archive,
    delete: Trash2,
  } as const;

  const Icon = icons[action];
  const className = styles[action];

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        aria-label={label}
        title={label}
        className={className}
      >
        <Icon size={16} strokeWidth={2} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={className}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}
