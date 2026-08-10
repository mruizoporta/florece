"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { salonTodayYmd } from "@/lib/dates";
import type { Appointment, DashboardSummary } from "@/lib/types";
import { useLocale } from "@/components/LocaleProvider";
import { AdminPageHeader, LoadingSpinner } from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { employeeImageUrl } from "@/lib/images";

export default function AdminDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const { formatMoney } = useSalonMoney();
  const [stats, setStats] = useState<DashboardSummary | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = salonTodayYmd();
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
        const list = Array.isArray(appts) ? appts : [];
        const now = Date.now();
        setUpcoming(
          list
            .filter((a) => !a.startTime || new Date(a.startTime).getTime() >= now - 30 * 60_000)
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
  }, [slug]);

  const todayCount =
    stats?.appointmentsToday ?? stats?.todayAppointments ?? stats?.todayCount ?? 0;

  const widgets = [
    {
      label: tr("dashboard.income"),
      value: formatMoney(stats?.incomeToday ?? stats?.income ?? 0),
      href: `/s/${slug}/admin/orders`,
    },
    {
      label: tr("dashboard.today"),
      value: todayCount,
      href: `/s/${slug}/admin/board`,
    },
    {
      label: tr("dashboard.waiting"),
      value: stats?.waiting ?? 0,
      href: `/s/${slug}/admin/board`,
    },
    {
      label: tr("dashboard.pending"),
      value: stats?.pending ?? 0,
      href: `/s/${slug}/admin/appointments`,
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
            className="admin-stat-card group animate-[fade-up_0.45s_ease-out_both] pl-6"
            style={{ animationDelay: `${i * 55}ms` }}
          >
            <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">
              {w.label}
            </p>
            <p className="mt-3 font-serif text-[2.35rem] font-semibold leading-none tracking-tight text-brand-ink">
              {w.value}
            </p>
            <p className="mt-4 text-[11px] font-semibold text-brand-primary-dark opacity-0 transition group-hover:opacity-100">
              {tr("dashboard.viewDetail")}
            </p>
          </Link>
        ))}
      </div>

      <div className="mb-10 grid gap-4 lg:grid-cols-2">
        <div className="admin-card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-xl text-brand-ink">
              {tr("dashboard.topServices")}
            </h2>
          </div>
          {(stats?.topServices ?? []).length === 0 ? (
            <p className="text-sm text-brand-text-muted">{tr("admin.noData")}</p>
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
            <p className="text-sm text-brand-text-muted">{tr("admin.noData")}</p>
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
                      <p className="truncate font-medium text-brand-ink">{a.name}</p>
                      <p className="truncate text-xs text-brand-text-muted">
                        {a.employee?.name ?? "Sin asignar"}
                        {a.status?.name ? ` · ${a.status.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-mist px-2.5 py-1 text-xs font-semibold text-brand-ink">
                    {a.startTime
                      ? new Date(a.startTime).toLocaleString("es", {
                          timeStyle: "short",
                        })
                      : "—"}
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
