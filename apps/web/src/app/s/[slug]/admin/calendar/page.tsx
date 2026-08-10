"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import type { Appointment } from "@/lib/types";
import { useLocale } from "@/components/LocaleProvider";
import type { Locale } from "@/lib/i18n";
import {
  AdminModal,
  AdminPageHeader,
  AdminPill,
  LoadingSpinner,
  TabButton,
} from "@/components/admin/AdminUi";
import { salonTodayYmd } from "@/lib/dates";
import { employeeImageUrl } from "@/lib/images";

const MAX_VISIBLE = 3;

function dateLocale(locale: Locale) {
  return locale === "en" ? "en-US" : "es-NI";
}

function weekdayShortLabels(locale: Locale) {
  const base = new Date(2024, 0, 7); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d
      .toLocaleDateString(dateLocale(locale), { weekday: "short" })
      .replace(/\.$/, "");
  });
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** Local calendar YYYY-MM-DD (avoid UTC shift from toISOString). */
function toLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function appointmentDayKey(startTime?: string | null) {
  if (!startTime) return "";
  const d = new Date(startTime);
  if (Number.isNaN(d.getTime())) return startTime.slice(0, 10);
  return toLocalDate(d);
}

function formatTime(value: string | null | undefined, locale: Locale) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString(dateLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const d = new Date(start);
  while (d <= end) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export default function AdminCalendarPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr, locale } = useLocale();
  const [current, setCurrent] = useState(() => new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const todayKey = salonTodayYmd();
  const weekdays = useMemo(() => weekdayShortLabels(locale), [locale]);

  const range = useMemo(() => {
    if (view === "month") {
      const start = startOfMonth(current);
      const end = endOfMonth(current);
      const padStart = new Date(start);
      padStart.setDate(padStart.getDate() - padStart.getDay());
      const padEnd = new Date(end);
      padEnd.setDate(padEnd.getDate() + (6 - padEnd.getDay()));
      return {
        from: toLocalDate(padStart),
        to: toLocalDate(padEnd),
        days: buildDays(padStart, padEnd),
      };
    }
    const start = new Date(current);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return {
      from: toLocalDate(start),
      to: toLocalDate(end),
      days: buildDays(start, end),
    };
  }, [current, view]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<Appointment[]>(
        `/v1/appointments/range?from=${range.from}&to=${range.to}`,
        { tenantSlug: slug, auth: true },
      );
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [slug, range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  const byDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const key = appointmentDayKey(a.startTime);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    for (const [, list] of map) {
      list.sort((a, b) => {
        const ta = a.startTime ? new Date(a.startTime).getTime() : 0;
        const tb = b.startTime ? new Date(b.startTime).getTime() : 0;
        return ta - tb;
      });
    }
    return map;
  }, [appointments]);

  const selectedItems = selectedDay ? (byDate.get(selectedDay) ?? []) : [];
  const selectedLabel = selectedDay
    ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString(dateLocale(locale), {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  const title = current.toLocaleDateString(dateLocale(locale), {
    month: "long",
    year: "numeric",
  });

  function shift(months: number) {
    setCurrent((d) => {
      const n = new Date(d);
      if (view === "week") {
        n.setDate(n.getDate() + months * 7);
      } else {
        n.setMonth(n.getMonth() + months);
      }
      return n;
    });
  }

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.calendar")}
        subtitle={title}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <TabButton
              active={view === "month"}
              onClick={() => setView("month")}
            >
              {tr("calendar.month")}
            </TabButton>
            <TabButton active={view === "week"} onClick={() => setView("week")}>
              {tr("calendar.week")}
            </TabButton>
            <button
              type="button"
              onClick={() => setCurrent(new Date())}
              className="btn-secondary py-2 text-sm"
            >
              {tr("calendar.today")}
            </button>
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => shift(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-warm text-brand-ink transition hover:bg-brand-primary/35"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              onClick={() => shift(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-warm text-brand-ink transition hover:bg-brand-primary/35"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="admin-card !p-3 sm:!p-4">
          <div className="grid grid-cols-7 gap-1">
            {weekdays.map((d) => (
              <div
                key={d}
                className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-brand-text-muted"
              >
                {d}
              </div>
            ))}
            {range.days.map((day) => {
              const key = toLocalDate(day);
              const items = byDate.get(key) ?? [];
              const inMonth = day.getMonth() === current.getMonth();
              const isToday = key === todayKey;
              const visible = items.slice(0, MAX_VISIBLE);
              const hidden = items.length - visible.length;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(key)}
                  className={`group flex min-h-[6.5rem] flex-col rounded-2xl p-1.5 text-left transition sm:min-h-[7.5rem] sm:p-2 ${
                    inMonth || view === "week"
                      ? "bg-brand-warm hover:bg-brand-elevated hover:shadow-[0_12px_28px_-20px_rgba(29,31,36,0.45)]"
                      : "bg-transparent opacity-45 hover:opacity-70"
                  } ${
                    selectedDay === key
                      ? "ring-2 ring-brand-primary/50"
                      : ""
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-1">
                    <span
                      className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                        isToday
                          ? "bg-brand-ink text-white"
                          : "text-brand-text-muted group-hover:text-brand-ink"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {items.length > 0 ? (
                      <span className="text-[10px] font-medium text-brand-text-muted">
                        {items.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col gap-0.5">
                    {visible.map((a) => (
                      <div
                        key={a.id}
                        className="truncate rounded-lg bg-brand-primary/30 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-brand-ink"
                        title={`${formatTime(a.startTime, locale)} ${a.name}`}
                      >
                        <span className="tabular-nums opacity-80">
                          {formatTime(a.startTime, locale)}
                        </span>{" "}
                        {a.name}
                      </div>
                    ))}
                    {hidden > 0 ? (
                      <span className="mt-0.5 rounded-lg px-1.5 py-0.5 text-[10px] font-semibold text-brand-primary-dark group-hover:underline">
                        +{hidden} {tr("calendar.more")}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-brand-text-muted">
            {tr("calendar.tapDay")}
          </p>
        </div>
      )}

      <AdminModal
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedLabel}
        description={
          selectedItems.length === 0
            ? tr("calendar.noAppointments")
            : `${selectedItems.length} ${
                selectedItems.length === 1
                  ? tr("calendar.appointment")
                  : tr("calendar.appointments")
              }`
        }
        wide
      >
        {selectedItems.length === 0 ? (
          <div className="rounded-2xl bg-brand-warm px-4 py-10 text-center text-sm text-brand-text-muted">
            {tr("calendar.emptyList")}
          </div>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {selectedItems.map((a) => {
              const photo = employeeImageUrl(a.employee?.image);
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-2xl border border-brand-ink/6 bg-brand-warm p-3"
                >
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-sm font-semibold tabular-nums text-brand-ink">
                      {formatTime(a.startTime, locale)}
                    </p>
                    {a.endTime ? (
                      <p className="text-[10px] text-brand-text-muted">
                        {formatTime(a.endTime, locale)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-elevated">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <span className="font-serif text-sm text-brand-ink/40">
                        {(a.employee?.name ?? a.name).charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-brand-ink">
                      {a.name}
                    </p>
                    <p className="truncate text-xs text-brand-text-muted">
                      {a.employee?.name ?? tr("calendar.unassigned")}
                      {a.phone ? ` · ${a.phone}` : ""}
                    </p>
                  </div>
                  {a.status?.name ? (
                    <AdminPill tone="primary">{a.status.name}</AdminPill>
                  ) : null}
                  <Link
                    href={`/s/${slug}/admin/appointments/${a.id}`}
                    className="shrink-0 text-sm font-medium text-brand-ink underline-offset-2 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4 flex justify-end">
          <Link
            href={`/s/${slug}/admin/board`}
            className="btn-secondary py-2.5 text-sm"
            onClick={() => setSelectedDay(null)}
          >
            Ir al tablero
          </Link>
        </div>
      </AdminModal>
    </div>
  );
}
