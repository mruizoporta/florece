"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/tenants", label: "Salones", icon: Building2 },
  { href: "/admin/plans", label: "Planes", icon: CreditCard },
];

function Nav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 px-3">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition ${
              active
                ? "bg-brand-primary font-semibold text-brand-ink shadow-[0_12px_28px_-16px_rgba(196,165,116,0.65)]"
                : "text-white/55 hover:bg-white/[0.07] hover:text-white"
            }`}
          >
            <Icon
              size={17}
              className={active ? "opacity-100" : "opacity-80"}
              strokeWidth={active ? 2.4 : 2}
            />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace("/login?redirect=/admin");
  }

  const title =
    pathname.startsWith("/admin/plans")
      ? "Planes"
      : pathname.startsWith("/admin/tenants")
        ? "Salones"
        : "Overview";

  return (
    <div className="admin-app flex min-h-screen">
      <aside className="admin-sidebar sticky top-0 hidden h-screen w-[15.5rem] shrink-0 flex-col text-white lg:flex">
        <div className="px-5 pb-5 pt-7">
          <Link href="/admin" className="block">
            <span className="font-serif text-[1.85rem] leading-none font-semibold tracking-tight">
              Florece
            </span>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-primary/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-brand-primary uppercase ring-1 ring-brand-primary/30">
              <Sparkles size={11} />
              Plataforma
            </span>
          </Link>
        </div>
        <Nav pathname={pathname} />
        <div className="border-t border-white/10 p-3 space-y-1">
          <div className="px-1 pb-1">
            <ThemeToggle className="admin-sidebar-link w-full !text-white/55 hover:!text-white hover:!bg-white/[0.07]" />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[13px] text-white/55 transition hover:bg-white/[0.07] hover:text-white"
          >
            <LogOut size={17} />
            Salir
          </button>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-brand-ink/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="admin-sidebar absolute inset-y-0 left-0 flex w-[15.5rem] flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
              <span className="font-serif text-2xl font-semibold">Florece</span>
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-white/10 p-2"
              >
                <X size={16} />
              </button>
            </div>
            <Nav pathname={pathname} onNavigate={() => setOpen(false)} />
            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[13px] text-white/55"
              >
                <LogOut size={17} />
                Salir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-header sticky top-0 z-20 flex items-center gap-3 px-4 py-3 lg:hidden">
          <button
            type="button"
            aria-label="Menú"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-ink text-brand-base"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg font-semibold leading-none text-brand-ink">
              Florece
            </p>
            <p className="mt-0.5 text-[11px] text-brand-text-muted">{title}</p>
          </div>
          <ThemeToggle compact />
        </header>

        <main className="admin-main flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          <div className="mx-auto w-full max-w-6xl animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
