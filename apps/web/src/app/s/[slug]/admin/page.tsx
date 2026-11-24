"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Clock,
  Heart,
  Hourglass,
  Wallet,
} from "lucide-react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatAppointmentTime } from "@/lib/format";
import { salonTodayYmd } from "@/lib/dates";
import type { Appointment, DashboardSummary } from "@/lib/types";
import { useLocale } from "@/components/LocaleProvider";
import { AdminPageHeader, LoadingSpinner } from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { employeeImageUrl } from "@/lib/images";

function wallMinutes(value?: string | null): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function nowMinutes(timeZone: string): number {
  const text = new Date().toLocaleTimeString("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const [hh, mm] = text.split(":").map(Number);
  return hh * 60 + mm;
}

export default function AdminDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const { formatMoney, timeZone } = useSalonMoney();
  const [stats, setStats] = useState<DashboardSummary | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState<
    Array<{ id: number; item: { name: string } }>
  >([]);
  const [inactive, setInactive] = useState<Array<{ name: string }>>([]);

  useEffect(() => {
    async function load() {
      const today = salonTodayYmd(new Date(), timeZone);
      try {
        const [statsData, appts] = await Promise.all([
          api<DashboardSummary>(`/v1/dashboard/summary?date=${today}`, {
            tenantSlug: slug,
            auth: true,
          }),
          api<Appointment[]>(`/v1/appointments?date=${today}`, {
            tenantSlug: slug,
            auth: true,
          }).catch(() => [] as Appointment[]),
        ]);
        setStats(statsData);
        // Solo Admin y Cajero ven el stock; para el resto la API responde 403 y no se muestra nada.
        api<Array<{ id: number; item: { name: string } }>>(
          "/v1/catalog/products/low-stock?limit=50",
          {
            tenantSlug: slug,
            auth: true,
          },
        )
          .then((rows) => setLowStock(Array.isArray(rows) ? rows : []))
          .catch(() => setLowStock([]));
        // Admin y Recepción: clientas que hace +60 días no vienen.
        api<{
          customers: Array<{ name: string; lastContactedAt: string | null }>;
        }>("/v1/customers/inactive?days=60", {
          tenantSlug: slug,
          auth: true,
        })
          .then((d) =>
            setInactive(d.customers.filter((c) => !c.lastContactedAt)),
          )
          .catch(() => setInactive([]));
        const list = Array.isArray(appts) ? appts : [];
        const nowMin = nowMinutes(timeZone);
        setUpcoming(
          list
            .filter((a) => {
              const start = wallMinutes(a.startTime);
              return start == null || start >= nowMin - 30;
            })
            .slice(0, 6),
        );
      } catch {
        setStats({});
        setUpcoming([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, timeZone]);

  const todayCount =
    stats?.appointmentsToday ??
    stats?.todayAppointments ??
    stats?.todayCount ??
    0;

  const widgets = [
    {
      label: tr("dashboard.income"),
      value: formatMoney(stats?.incomeToday ?? stats?.income ?? 0),
      href: `/s/${slug}/admin/orders`,
      icon: Wallet,
      accent: "5, 150, 105",
      accentLight: "110, 231, 183",
    },
    {
      label: tr("dashboard.today"),
      value: todayCount,
      href: `/s/${slug}/admin/board`,
      icon: CalendarDays,
      accent: "124, 58, 237",
      accentLight: "196, 181, 253",
    },
    {
      label: tr("dashboard.waiting"),
      value: stats?.waiting ?? 0,
      href: `/s/${slug}/admin/board`,
      icon: Hourglass,
      accent: "2, 132, 199",
      accentLight: "125, 211, 252",
    },
    {
      label: tr("dashboard.pending"),
      value: stats?.pending ?? 0,
      href: `/s/${slug}/admin/appointments`,
      icon: Clock,
      accent: "217, 119, 6",
      accentLight: "252, 211, 77",
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.dashboard")}
        subtitle={tr("dashboard.subtitle")}
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {widgets.map((w, i) => (
          <Link
            key={w.label}
            href={w.href}
            className="admin-stat-card group animate-[fade-up_0.45s_ease-out_both]"
            style={
              {
                animationDelay: `${i * 55}ms`,
                "--accent": w.accent,
                "--accent-light": w.accentLight,
              } as CSSProperties
            }
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">
                {w.label}
              </p>
              <span className="admin-stat-icon">
                <w.icon size={17} strokeWidth={2} />
              </span>
            </div>
            <p className="mt-3 font-serif text-[2.35rem] font-semibold leading-none tracking-tight text-brand-ink">
              {w.value}
            </p>
            <p className="mt-4 text-[11px] font-semibold text-brand-primary-dark opacity-0 transition group-hover:opacity-100">
              {tr("dashboard.viewDetail")}
            </p>
          </Link>
        ))}
      </div>

      {lowStock.length > 0 || inactive.length > 0 ? (
        <div className="mb-10 space-y-3">
          {lowStock.length > 0 ? (
            <Link
              href={`/s/${slug}/admin/inventory`}
              className="group flex items-center gap-4 rounded-2xl border border-amber-300/50 bg-amber-50 px-5 py-4 transition hover:border-amber-400"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
                <AlertTriangle size={18} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-amber-900">
                  {lowStock.length === 1
                    ? "1 producto con stock bajo"
                    : `${lowStock.length} productos con stock bajo`}
                </p>
                <p className="truncate text-sm text-amber-800">
                  {lowStock
                    .slice(0, 3)
                    .map((p) => p.item.name)
                    .join(", ")}
                  {lowStock.length > 3 ? ` y ${lowStock.length - 3} más` : ""}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-900">
                Ver inventario
                <ArrowRight
                  size={15}
                  className="transition group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          ) : null}
          {inactive.length > 0 ? (
            <Link
              href={`/s/${slug}/admin/customers/inactive`}
              className="group flex items-center gap-4 rounded-2xl border border-rose-300/50 bg-rose-50 px-5 py-4 transition hover:border-rose-400"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-700">
                <Heart size={18} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-rose-900">
                  {inactive.length === 1
                    ? "1 clienta no viene hace más de 60 días"
                    : `${inactive.length} clientas no vienen hace más de 60 días`}
                </p>
                <p className="truncate text-sm text-rose-800">
                  {inactive
                    .slice(0, 3)
                    .map((c) => c.name)
                    .join(", ")}
                  {inactive.length > 3 ? ` y ${inactive.length - 3} más` : ""}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-rose-900">
                Escribirles
                <ArrowRight
                  size={15}
                  className="transition group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mb-10 grid gap-4 lg:grid-cols-2">
        <div className="admin-card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-xl text-brand-ink">
              {tr("dashboard.topServices")}
            </h2>
          </div>
          {(stats?.topServices ?? []).length === 0 ? (
            <p className="text-sm text-brand-text-muted">
              {tr("admin.noData")}
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {stats?.topServices?.map((s) => (
                <li
                  key={s.name}
                  className="flex justify-between gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-brand-mist/60"
                >
                  <span className="font-medium text-brand-ink">{s.name}</span>
                  <span className="shrink-0 text-brand-text-muted">
                    {s.quantity} · {formatMoney(s.revenue ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="admin-card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-xl text-brand-ink">
              {tr("dashboard.topProducts")}
            </h2>
          </div>
          {(stats?.topProducts ?? []).length === 0 ? (
            <p className="text-sm text-brand-text-muted">
              {tr("admin.noData")}
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {stats?.topProducts?.map((p) => (
                <li
                  key={p.name}
                  className="flex justify-between gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-brand-mist/60"
                >
                  <span className="font-medium text-brand-ink">{p.name}</span>
                  <span className="shrink-0 text-brand-text-muted">
                    {p.quantity} · {formatMoney(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="admin-card">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-brand-ink">Próximas citas</h2>
          <Link
            href={`/s/${slug}/admin/appointments`}
            className="rounded-full bg-brand-mist px-3 py-1.5 text-xs font-semibold text-brand-ink transition hover:bg-brand-primary/30"
          >
            Ver todas
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-brand-text-muted">Sin citas próximas</p>
        ) : (
          <ul className="divide-y divide-brand-ink/[0.04]">
            {upcoming.map((a) => {
              const photo = employeeImageUrl(a.employee?.image);
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 py-3.5 text-sm first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-warm ring-1 ring-brand-ink/[0.04]">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo}
                          alt=""
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <span className="font-serif text-sm text-brand-ink">
                          {(a.employee?.name ?? a.name).charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-brand-ink">
                        {a.name}
                      </p>
                      <p className="truncate text-xs text-brand-text-muted">
                        {a.employee?.name ?? "Sin asignar"}
                        {a.status?.name ? ` · ${a.status.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-mist px-2.5 py-1 text-xs font-semibold text-brand-ink">
                    {formatAppointmentTime(a.startTime)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
