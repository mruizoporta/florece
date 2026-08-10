"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, CircleHelp, LogOut, Menu, X } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { AccountStatusBanner, useAccountStatus } from "./AccountStatusBanner";
import { SalonMoneyProvider } from "./SalonMoneyProvider";
import { BranchSwitcher } from "./BranchSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { HelpAssistant } from "@/components/assistant/HelpAssistant";
import { useLocale } from "@/components/LocaleProvider";
import { logout } from "@/lib/auth";
import { api } from "@/lib/api";

const COLLAPSE_KEY = "florece_admin_sidebar_collapsed";

export function AdminShell({
  slug,
  children,
  title,
}: {
  slug: string;
  children: React.ReactNode;
  title?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const status = useAccountStatus(slug);
  const [userName, setUserName] = useState<string | null>(null);
  const { tr } = useLocale();

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    api<{ user: { name: string } }>("/auth/me", {
      auth: true,
      tenantSlug: slug,
    })
      .then((me) => setUserName(me.user?.name ?? null))
      .catch(() => setUserName(null));
  }, [slug]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  const isCollapsed = hydrated ? collapsed : false;

  return (
    <SalonMoneyProvider slug={slug}>
    <div className="admin-app flex min-h-screen">
      <div className="hidden no-print lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0">
        <AdminSidebar
          slug={slug}
          collapsed={isCollapsed}
          onToggleCollapsed={toggleCollapsed}
        />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 no-print lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-brand-ink/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-2xl shadow-brand-ink/25">
            <AdminSidebar
              slug={slug}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-header no-print sticky top-0 z-20">
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-ink text-brand-base shadow-sm lg:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="min-w-0 flex-1">
              <BranchSwitcher slug={slug} />
              <p className="mt-0.5 truncate text-[11px] tracking-wide text-brand-text-muted">
                {status?.planName
                  ? `Plan ${status.planName}`
                  : "Sin plan"}
                {status?.daysRemaining != null
                  ? ` · ${status.daysRemaining}d`
                  : ""}
                {userName ? ` · ${userName}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <Link
                href={`/s/${slug}/admin/help`}
                className="admin-header-action admin-header-icon"
                title={tr("admin.help")}
                aria-label={tr("admin.help")}
              >
                <CircleHelp size={15} strokeWidth={2} />
              </Link>
              <Link
                href={`/s/${slug}`}
                target="_blank"
                className="admin-header-action admin-header-icon hidden sm:inline-flex"
                title={tr("admin.publicSite")}
                aria-label={tr("admin.publicSite")}
              >
                <ExternalLink size={15} strokeWidth={2} />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="admin-header-action admin-header-icon hidden text-brand-text-muted hover:text-brand-ink sm:inline-flex"
                title={tr("admin.logout")}
                aria-label={tr("admin.logout")}
              >
                <LogOut size={15} strokeWidth={2} />
              </button>
            </div>
          </div>
        </header>

        <AccountStatusBanner slug={slug} />

        {status?.hardBlock || status?.blocked ? (
          <div className="no-print flex flex-1 items-center justify-center px-6 py-16">
            <div className="max-w-md text-center">
              <h1 className="font-serif text-3xl text-brand-ink">
                Cuenta suspendida
              </h1>
              <p className="mt-3 text-brand-text-muted">
                {status.warning ||
                  "Contacta a Florece para reactivar tu suscripción."}
              </p>
              <Link
                href={`/s/${slug}/admin/billing`}
                className="btn-primary mt-6"
              >
                Ver facturación
              </Link>
            </div>
          </div>
        ) : (
          <>
            {title ? (
              <div className="border-b border-brand-ink/[0.05] px-6 py-5 lg:px-10">
                <h1 className="font-serif text-2xl font-semibold tracking-tight text-brand-ink lg:text-3xl">
                  {title}
                </h1>
              </div>
            ) : null}

            <main className="admin-main flex-1 px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
              <div
                className="mx-auto w-full max-w-6xl transition-[max-width] duration-300 animate-[fade-up_0.45s_ease-out]"
                style={{ maxWidth: isCollapsed ? "90rem" : "72rem" }}
              >
                {children}
              </div>
            </main>
          </>
        )}
      </div>
    </div>
    <HelpAssistant context="admin" slug={slug} />
    </SalonMoneyProvider>
  );
}
