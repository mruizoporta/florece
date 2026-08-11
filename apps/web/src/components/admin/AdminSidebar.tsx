"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  ImageIcon,
  Instagram,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  Palette,
  Receipt,
  Settings,
  Sparkles,
  Store,
  Users,
  UserSquare2,
  Kanban,
  ChartColumn,
  CircleHelp,
  Wallet,
  HandCoins,
} from "lucide-react";
import { logout, getMe, listBranches } from "@/lib/auth";
import { useLocale } from "@/components/LocaleProvider";
import { FloreceLogo } from "@/components/brand/FloreceLogo";
import type { I18nKey } from "@/lib/i18n";
import {
  ADMIN_ROUTE_FEATURE,
  canManageAgenda,
  canManageCaja,
  canManageSalon,
  type FeatureKey,
  type PlanFeatures,
} from "@florece/shared";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

/** Rollups only useful with 2+ branches (same info as the single branch pages). */
const MULTI_BRANCH_HREFS = new Set(["/sales-summary", "/accounting/branches"]);

type NavItem = {
  href: string;
  key: I18nKey;
  icon: typeof LayoutDashboard;
  access?: "staff" | "agenda" | "caja" | "admin";
};

type NavGroup = {
  id: string;
  labelKey: I18nKey;
  items: NavItem[];
};

const GROUPS_KEY = "florece_admin_nav_groups";

const navGroups: NavGroup[] = [
  {
    id: "operacion",
    labelKey: "nav.group.operacion",
    items: [
      { href: "", key: "admin.dashboard", icon: LayoutDashboard, access: "staff" },
      { href: "/board", key: "admin.board", icon: Kanban, access: "agenda" },
      { href: "/calendar", key: "admin.calendar", icon: CalendarDays, access: "agenda" },
      { href: "/appointments", key: "admin.appointments", icon: ClipboardList, access: "agenda" },
      { href: "/orders", key: "admin.orders", icon: Receipt, access: "caja" },
    ],
  },
  {
    id: "negocio",
    labelKey: "nav.group.negocio",
    items: [
      { href: "/employees", key: "admin.employees", icon: UserSquare2, access: "admin" },
      { href: "/payroll", key: "admin.payroll", icon: HandCoins, access: "caja" },
      { href: "/catalog", key: "admin.catalog", icon: Package, access: "admin" },
      { href: "/customers", key: "admin.customers", icon: Users, access: "staff" },
      { href: "/users", key: "admin.users", icon: Users, access: "admin" },
      { href: "/accounting", key: "admin.accounting", icon: ChartColumn, access: "caja" },
      { href: "/accounting/expenses", key: "admin.expenses", icon: Receipt, access: "caja" },
      { href: "/accounting/cash", key: "admin.cashClose", icon: Wallet, access: "caja" },
    ],
  },
  {
    id: "presencia",
    labelKey: "nav.group.presencia",
    items: [
      { href: "/sections", key: "admin.sections", icon: LayoutGrid, access: "admin" },
      { href: "/appearance", key: "admin.appearance", icon: Palette, access: "admin" },
      { href: "/settings/images", key: "admin.settingsImages", icon: ImageIcon, access: "admin" },
      { href: "/sponsors", key: "admin.sponsors", icon: Sparkles, access: "admin" },
      { href: "/instagram", key: "admin.instagram", icon: Instagram, access: "admin" },
    ],
  },
  {
    id: "cuenta",
    labelKey: "nav.group.cuenta",
    items: [
      { href: "/branches", key: "admin.branches", icon: Store, access: "admin" },
      { href: "/sales-summary", key: "admin.salesSummary", icon: ChartColumn, access: "admin" },
      { href: "/accounting/branches", key: "admin.profitBranches", icon: Wallet, access: "admin" },
      { href: "/settings", key: "admin.settings", icon: Settings, access: "admin" },
      { href: "/billing", key: "admin.billing", icon: Receipt, access: "admin" },
    ],
  },
];

const DEFAULT_OPEN: Record<string, boolean> = {
  operacion: true,
  negocio: true,
  presencia: false,
  cuenta: false,
};

function allowedFeature(href: string, features: PlanFeatures | null): boolean {
  if (!features) return true;
  const key = ADMIN_ROUTE_FEATURE[href] as FeatureKey | null | undefined;
  if (key == null) return true;
  return Boolean(features[key]);
}

function allowedRole(
  access: NavItem["access"],
  roles: string[] | null,
): boolean {
  if (!roles) return true;
  if (!access || access === "staff") return true;
  if (access === "admin") return canManageSalon(roles);
  if (access === "agenda") return canManageAgenda(roles);
  if (access === "caja") return canManageCaja(roles);
  return true;
}

export function AdminSidebar({
  slug,
  onNavigate,
  collapsed = false,
  onToggleCollapsed,
}: {
  slug: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();
  const { tr } = useLocale();
  const base = `/s/${slug}/admin`;
  const [features, setFeatures] = useState<PlanFeatures | null>(null);
  const [roles, setRoles] = useState<string[] | null>(null);
  const [branchCount, setBranchCount] = useState<number | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(DEFAULT_OPEN);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(GROUPS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        setOpenGroups({ ...DEFAULT_OPEN, ...parsed });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    api<{
      entitlements?: { features?: PlanFeatures };
    }>("/billing/account-status", { auth: true, tenantSlug: slug })
      .then((status) => {
        if (status.entitlements?.features) {
          setFeatures(status.entitlements.features);
        }
      })
      .catch(() => setFeatures(null));
    getMe()
      .then((me) => setRoles(me?.user?.roles ?? []))
      .catch(() => setRoles([]));
    listBranches(slug)
      .then((branches) => setBranchCount(branches.length))
      .catch(() => setBranchCount(1));
  }, [slug]);

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  function isActive(href: string): boolean {
    const full = `${base}${href}`;
    if (href === "") return pathname === base;
    if (href === "/settings") {
      return (
        pathname === full ||
        (pathname.startsWith(`${full}/`) &&
          !pathname.startsWith(`${base}/settings/images`))
      );
    }
    if (href === "/accounting") {
      return pathname === full;
    }
    return pathname === full || pathname.startsWith(`${full}/`);
  }

  const activeGroupId = useMemo(() => {
    for (const group of navGroups) {
      if (group.items.some((item) => isActive(item.href))) return group.id;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname drives isActive
  }, [pathname, base]);

  useEffect(() => {
    if (!activeGroupId) return;
    setOpenGroups((prev) => {
      if (prev[activeGroupId]) return prev;
      const next = { ...prev, [activeGroupId]: true };
      try {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [activeGroupId]);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <aside
      className={`admin-sidebar flex h-full shrink-0 flex-col text-white transition-[width] duration-300 ease-out ${
        collapsed ? "w-[4.5rem]" : "w-[16rem]"
      }`}
    >
      <div
        className={`flex flex-col gap-4 pt-5 pb-3 ${
          collapsed ? "items-center px-2" : "px-3.5"
        }`}
      >
        {onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/95 text-brand-on-primary shadow-sm transition hover:bg-brand-primary ${
              collapsed ? "" : "self-end"
            }`}
          >
            {collapsed ? <ChevronRight size={16} strokeWidth={2.25} /> : <ChevronLeft size={16} strokeWidth={2.25} />}
          </button>
        ) : null}

        <Link
          href={base}
          onClick={onNavigate}
          title="Florece"
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-1"}`}
        >
          <FloreceLogo variant="badge" />
          {!collapsed ? (
            <span className="min-w-0">
              <FloreceLogo
                variant="word"
                tone="onDark"
                size="md"
                className="block text-xl"
              />
              <span className="mt-1 block text-[10px] font-medium tracking-[0.14em] text-white/35 uppercase">
                Panel
              </span>
            </span>
          ) : null}
        </Link>
      </div>

      <nav
        className={`flex-1 overflow-y-auto pb-3 ${
          collapsed ? "px-2" : "px-2.5"
        }`}
      >
        {navGroups.map((group, groupIndex) => {
          const items = group.items.filter((item) => {
            if (
              MULTI_BRANCH_HREFS.has(item.href) &&
              (branchCount == null || branchCount <= 1)
            ) {
              return false;
            }
            return (
              allowedFeature(item.href, features) &&
              allowedRole(item.access, roles)
            );
          });
          if (items.length === 0) return null;
          const groupOpen = collapsed || openGroups[group.id] !== false;
          const hasActive = items.some((item) => isActive(item.href));
          return (
            <div key={group.id}>
              {groupIndex > 0 ? (
                <div
                  className={`my-2 border-t border-white/10 ${
                    collapsed ? "mx-1" : "mx-2"
                  }`}
                />
              ) : null}
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={groupOpen}
                  className={`mb-1 flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left transition hover:bg-white/[0.04] ${
                    hasActive ? "text-white/60" : "text-white/28"
                  }`}
                >
                  <span className="text-[10px] font-semibold tracking-[0.18em] uppercase">
                    {tr(group.labelKey)}
                  </span>
                  <ChevronDown
                    size={13}
                    strokeWidth={2.25}
                    className={`shrink-0 opacity-70 transition-transform duration-200 ${
                      groupOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>
              ) : null}
              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                  groupOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className={`space-y-1 ${collapsed ? "" : "space-y-0.5"}`}>
                    {items.map((item) => {
                      const href = `${base}${item.href}`;
                      const active = isActive(item.href);
                      const Icon = item.icon;
                      const label = tr(item.key);
                      return (
                        <Link
                          key={item.href || "root"}
                          href={href}
                          title={label}
                          onClick={onNavigate}
                          className={
                            collapsed
                              ? `admin-rail-link ${active ? "admin-rail-link-active" : ""}`
                              : `admin-sidebar-link ${active ? "admin-sidebar-link-active" : ""}`
                          }
                        >
                          <Icon size={18} strokeWidth={1.75} className="shrink-0" />
                          {!collapsed ? (
                            <span className="truncate">{label}</span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div
        className={`space-y-1 border-t border-white/10 py-2 ${
          collapsed ? "px-2" : "px-2.5"
        }`}
      >
        <Link
          href={`${base}/help`}
          className={
            collapsed
              ? `admin-rail-link ${isActive("/help") ? "admin-rail-link-active" : ""}`
              : `admin-sidebar-link ${isActive("/help") ? "admin-sidebar-link-active" : ""}`
          }
          title={tr("admin.help")}
          onClick={onNavigate}
        >
          <CircleHelp size={18} strokeWidth={1.75} className="shrink-0" />
          {!collapsed ? <span>{tr("admin.help")}</span> : null}
        </Link>
        <Link
          href={`/s/${slug}`}
          className={
            collapsed ? "admin-rail-link" : "admin-sidebar-link"
          }
          target="_blank"
          title={tr("admin.publicSite")}
          onClick={onNavigate}
        >
          <ExternalLink size={18} strokeWidth={1.75} className="shrink-0" />
          {!collapsed ? <span>{tr("admin.publicSite")}</span> : null}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          title={tr("admin.logout")}
          className={
            collapsed
              ? "admin-rail-link w-full"
              : "admin-sidebar-link w-full text-left text-white/55 hover:text-white"
          }
        >
          <LogOut size={18} strokeWidth={1.75} className="shrink-0" />
          {!collapsed ? <span>{tr("admin.logout")}</span> : null}
        </button>
      </div>
    </aside>
  );
}
