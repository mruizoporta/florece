"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronRight,
  LogOut,
  Plus,
  Search,
  UserRound,
  UserPlus,
  X,
} from "lucide-react";
import { canAccessSalonAdmin, isStylist, formatStockQty } from "@florece/shared";
import { api } from "@/lib/api";
import { getMe, logout, type MeResponse } from "@/lib/auth";
import type { Appointment, Order } from "@/lib/types";
import { ModernSelect } from "@/components/ui/ModernSelect";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLocale } from "@/components/LocaleProvider";
import { FloreceLogo } from "@/components/brand/FloreceLogo";
import { salonTodayYmd } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";

type ServiceRow = {
  id: number;
  durationTime?: number;
  consumables?: Array<{
    productId: number;
    quantity: number;
    productName?: string;
    unit?: string;
  }>;
  item: { id: number; name: string; price: number };
};

type AptService = {
  service?: {
    name?: string;
    item?: { id: number; name: string };
  };
};

type OpenSheet = Order & {
  customer?: { id?: number; user?: { name?: string } | null } | null;
  items?: Array<{
    id: number;
    productNameSnapshot?: string | null;
    employee?: { id: number; name: string } | null;
  }>;
};

type SelectedClient = {
  label: string;
  sheetId?: number;
  customerId?: number | null;
  source: "sheet" | "appointment" | "new";
};

type MyDayLine = {
  id: number;
  orderId: number;
  orderName: string | null;
  customerName: string | null;
  confirmed: boolean;
  serviceName: string;
  lineTotal: number;
  commissionRate: number;
  commission: number;
};

type MyDay = {
  date: string;
  employee: { id: number; name: string; commissionRate: number };
  lineCount: number;
  serviceSales: number;
  pendingCommission: number;
  confirmedCommission: number;
  commission: number;
  lines: MyDayLine[];
};

function todayYmd() {
  return salonTodayYmd();
}

function fill(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

function formatTime(value: string | null | undefined, locale: Locale) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(locale === "en" ? "en-US" : "es-NI", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function sheetLabel(sheet: OpenSheet) {
  return sheet.customer?.user?.name || sheet.name || `Ticket #${sheet.id}`;
}

function stylistsOnSheet(sheet: OpenSheet) {
  return [
    ...new Set(
      (sheet.items ?? []).map((i) => i.employee?.name).filter(Boolean),
    ),
  ];
}

export default function StylistFloorPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { formatMoney } = useSalonMoney();
  const { tr, locale } = useLocale();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [openSheets, setOpenSheets] = useState<OpenSheet[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [myDay, setMyDay] = useState<MyDay | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SelectedClient | null>(null);
  const [serviceKey, setServiceKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const employeeId = me?.user.employeeId ?? null;
  const canAdmin = canAccessSalonAdmin(me?.user.roles);
  const stylist = isStylist(me?.user.roles);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await getMe();
      setMe(profile);
      const eid = profile?.user.employeeId;
      const date = todayYmd();
      const [apts, svcs, sheets, day] = await Promise.all([
        api<Appointment[]>(
          `/v1/appointments?date=${date}${eid ? `&employee_id=${eid}` : ""}`,
          { tenantSlug: slug, auth: true },
        ).catch(() => []),
        api<ServiceRow[]>("/v1/catalog/services", {
          tenantSlug: slug,
          auth: true,
        }).catch(() => []),
        api<OpenSheet[]>("/v1/orders/open-sheets", {
          tenantSlug: slug,
          auth: true,
        }).catch(() => []),
        eid
          ? api<MyDay>(`/v1/payroll/my-day?date=${date}`, {
              tenantSlug: slug,
              auth: true,
            }).catch(() => null)
          : Promise.resolve(null),
      ]);
      setAppointments(
        eid
          ? apts.filter((a) => a.employeeId === eid || a.employee?.id === eid)
          : apts,
      );
      setServices(svcs);
      setOpenSheets(sheets);
      setMyDay(day);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("stylist.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [slug, tr]);

  useEffect(() => {
    load();
  }, [load]);

  const serviceOptions = useMemo(
    () =>
      services.map((s) => ({
        value: String(s.item.id),
        label: s.item.name,
        description: formatMoney(Number(s.item.price)),
      })),
    [services, formatMoney],
  );

  const selectedService = useMemo(
    () => services.find((s) => String(s.item.id) === serviceKey) ?? null,
    [services, serviceKey],
  );

  const selectedConsumables = selectedService?.consumables ?? [];

  const q = normalize(query);

  const matchedSheets = useMemo(() => {
    if (!q) return openSheets.slice(0, 8);
    return openSheets
      .filter((sheet) => {
        const label = normalize(sheetLabel(sheet));
        return label.includes(q) || String(sheet.id).includes(q);
      })
      .slice(0, 8);
  }, [openSheets, q]);

  const matchedAppointments = useMemo(() => {
    if (!q) return [];
    return appointments
      .filter((apt) => {
        const name = normalize(apt.name || apt.customer?.name || "");
        return name.includes(q);
      })
      .slice(0, 5);
  }, [appointments, q]);

  const canCreateNew =
    q.length >= 2 &&
    !matchedSheets.some((s) => normalize(sheetLabel(s)) === q) &&
    !selected;

  function pickSheet(sheet: OpenSheet) {
    setSelected({
      label: sheetLabel(sheet),
      sheetId: sheet.id,
      customerId: sheet.customer?.id ?? null,
      source: "sheet",
    });
    setQuery("");
    setMessage(null);
    setError(null);
  }

  function pickAppointment(apt: Appointment) {
    const label =
      apt.name || apt.customer?.name || tr("stylist.fallbackClient");
    const existing = openSheets.find((sheet) => {
      if (apt.customer?.id && sheet.customer?.id === apt.customer.id) return true;
      return normalize(sheetLabel(sheet)) === normalize(label);
    });
    if (existing) {
      pickSheet(existing);
      const itemId = ((apt.services ?? []) as AptService[])[0]?.service?.item
        ?.id;
      if (itemId) setServiceKey(String(itemId));
      return;
    }
    setSelected({
      label,
      customerId: apt.customer?.id ?? null,
      source: "appointment",
    });
    const itemId = ((apt.services ?? []) as AptService[])[0]?.service?.item
      ?.id;
    if (itemId) setServiceKey(String(itemId));
    setQuery("");
    setMessage(null);
  }

  function startNewClient(nameOverride?: string) {
    const label = (nameOverride ?? query).trim();
    if (label.length < 2) return;
    setSelected({ label, source: "new" });
    setQuery("");
    setMessage(null);
  }

  function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (matchedSheets.length === 1) {
      pickSheet(matchedSheets[0]);
      return;
    }
    if (canCreateNew) startNewClient();
  }

  function clearSelected() {
    setSelected(null);
    setServiceKey("");
  }

  async function logService(e: FormEvent) {
    e.preventDefault();
    if (!employeeId) {
      setError(tr("stylist.errorUnlinked"));
      return;
    }
    if (!selected || !serviceKey) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      let orderId = selected.sheetId;
      let created = false;

      if (!orderId) {
        const opened = await api<{ order: { id: number }; created: boolean }>(
          "/v1/orders/open-sheet",
          {
            method: "POST",
            tenantSlug: slug,
            auth: true,
            body: {
              name: selected.label,
              customer_id: selected.customerId ?? undefined,
              employee_id: employeeId,
            },
          },
        );
        orderId = opened.order.id;
        created = opened.created;
      }

      await api(`/v1/orders/${orderId}/items`, {
        method: "POST",
        tenantSlug: slug,
        auth: true,
        body: {
          item_id: Number(serviceKey),
          quantity: 1,
          employee_id: employeeId,
        },
      });

      setMessage(
        fill(
          created ? tr("stylist.msgCreated") : tr("stylist.msgAdded"),
          { id: orderId!, name: selected.label },
        ),
      );
      setServiceKey("");
      await load();
      setSelected({
        label: selected.label,
        sheetId: orderId,
        customerId: selected.customerId,
        source: "sheet",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("stylist.errorLog"));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  const showPicker = !selected;
  const displayName = me?.user.name ?? tr("stylist.fallbackStylist");
  const initial = displayName.trim().charAt(0).toUpperCase() || "·";

  return (
    <div className="relative min-h-[100svh] overflow-x-hidden text-brand-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 70% at 10% -10%, rgba(232,213,200,0.55) 0%, transparent 55%), radial-gradient(90% 50% at 100% 0%, rgba(196,165,116,0.22) 0%, transparent 50%), linear-gradient(180deg, #fbf7f1 0%, #f4efe8 42%, #f7f3ea 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236b5638' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <header className="sticky top-0 z-20 border-b border-brand-ink/[0.06] bg-[#fbf7f1]/80 px-4 py-3.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d4b88a] to-[#a89070] font-serif text-lg font-semibold text-white shadow-[0_8px_20px_-10px_rgba(107,86,56,0.55)]">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-brand-primary-dark uppercase">
                <FloreceLogo variant="mark" tone="gold" size="sm" className="!inline-flex" />
                {tr("stylist.floor")}
              </p>
              <h1 className="truncate font-serif text-[1.45rem] leading-tight font-semibold tracking-tight">
                {displayName}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {canAdmin ? (
              <Link
                href={`/s/${slug}/admin`}
                className="rounded-full px-3 py-2 text-xs font-semibold text-brand-text-muted transition hover:bg-white/70 hover:text-brand-ink"
              >
                {tr("stylist.admin")}
              </Link>
            ) : null}
            <LanguageToggle className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-brand-ink/8 bg-white/80 px-2.5 text-[11px] font-bold tracking-wide text-brand-ink shadow-sm transition hover:bg-white" />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-ink/8 bg-white/80 text-brand-ink shadow-sm transition hover:bg-white"
              aria-label={tr("stylist.logout")}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-5 px-4 py-5 pb-12">
        {error ? (
          <p className="animate-fade-up rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="animate-fade-up rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}

        {!employeeId && stylist ? (
          <div className="animate-fade-up rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
            {tr("stylist.unlink")}
          </div>
        ) : null}

        {employeeId ? (
          <section className="animate-fade-up overflow-hidden rounded-[1.6rem] border border-brand-ink/[0.05] bg-gradient-to-br from-[#2a241c] via-[#3a3228] to-[#1f1a15] p-5 text-[#f3efe9] shadow-[0_28px_60px_-28px_rgba(22,20,18,0.65)]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-[#d4b88a] uppercase">
                  {tr("stylist.myDay")}
                </p>
                <p className="mt-3 font-serif text-[2.35rem] leading-none font-semibold tracking-tight tabular-nums">
                  {formatMoney(myDay?.commission ?? 0)}
                </p>
                <p className="mt-2 text-sm text-white/55">
                  {tr("stylist.myDayHint")}
                  {myDay?.employee.commissionRate != null
                    ? ` ${fill(tr("stylist.commissionRate"), {
                        rate: myDay.employee.commissionRate,
                      })}`
                    : ""}
                </p>
              </div>
              <div className="rounded-2xl bg-white/8 px-3.5 py-2.5 text-right backdrop-blur-sm">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-white/45 uppercase">
                  {tr("stylist.services")}
                </p>
                <p className="mt-0.5 font-serif text-2xl font-semibold tabular-nums">
                  {myDay?.lineCount ?? 0}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
              <div className="bg-white/[0.04] px-3.5 py-3">
                <p className="text-[10px] font-semibold tracking-[0.1em] text-white/45 uppercase">
                  {tr("stylist.pendingPay")}
                </p>
                <p className="mt-1 text-base font-semibold tabular-nums text-[#e8d5c8]">
                  {formatMoney(myDay?.pendingCommission ?? 0)}
                </p>
              </div>
              <div className="bg-white/[0.04] px-3.5 py-3">
                <p className="text-[10px] font-semibold tracking-[0.1em] text-white/45 uppercase">
                  {tr("stylist.confirmed")}
                </p>
                <p className="mt-1 text-base font-semibold tabular-nums text-[#d4b88a]">
                  {formatMoney(myDay?.confirmedCommission ?? 0)}
                </p>
              </div>
            </div>

            {loading && !myDay ? (
              <p className="mt-4 text-sm text-white/50">{tr("stylist.loading")}</p>
            ) : !myDay?.lines.length ? (
              <p className="mt-4 text-sm text-white/50">
                {tr("stylist.myDayEmpty")}
              </p>
            ) : (
              <ul className="mt-4 max-h-48 space-y-0 overflow-y-auto divide-y divide-white/8">
                {myDay.lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-start justify-between gap-3 py-3 first:pt-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#f3efe9]">
                        {line.serviceName}
                      </p>
                      <p className="mt-0.5 text-xs text-white/45">
                        {line.customerName ||
                          line.orderName ||
                          `Ticket #${line.orderId}`}
                        {" · "}
                        {line.confirmed
                          ? tr("stylist.statusPaid")
                          : tr("stylist.statusOpen")}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-[#d4b88a]">
                        {formatMoney(line.commission)}
                      </p>
                      <p className="text-[11px] text-white/40 tabular-nums">
                        {tr("stylist.of")} {formatMoney(line.lineTotal)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        <section className="animate-fade-up-delay rounded-[1.6rem] border border-white/70 bg-white/75 p-5 shadow-[0_20px_50px_-30px_rgba(29,31,36,0.4)] backdrop-blur-md">
          <h2 className="font-serif text-[1.35rem] font-semibold tracking-tight">
            {tr("stylist.annotate")}
          </h2>
          <p className="mt-1 mb-5 text-sm leading-relaxed text-brand-text-muted">
            {tr("stylist.annotateHint")}
          </p>

          {showPicker ? (
            <div className="space-y-4">
              <div>
                <label className="label-field">{tr("stylist.searchOpen")}</label>
                <div className="relative">
                  <Search
                    size={18}
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-text-muted"
                  />
                  <input
                    className="input-field !rounded-2xl !border-brand-ink/8 !bg-white !py-3.5 !pr-4 !pl-11 !text-base shadow-sm transition focus:!border-brand-primary/50 focus:!ring-brand-primary/20"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onSearchKeyDown}
                    placeholder={tr("stylist.searchPlaceholder")}
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-brand-text-muted">
                  {tr("stylist.loading")}
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-brand-text-muted uppercase">
                    {q
                      ? fill(tr("stylist.results"), {
                          count: matchedSheets.length,
                        })
                      : fill(tr("stylist.openSheets"), {
                          count: openSheets.length,
                        })}
                  </p>

                  {matchedSheets.map((sheet) => {
                    const names = stylistsOnSheet(sheet);
                    const count = sheet.items?.length ?? 0;
                    return (
                      <button
                        key={sheet.id}
                        type="button"
                        onClick={() => pickSheet(sheet)}
                        className="group flex w-full items-center gap-3 rounded-2xl border border-brand-ink/[0.05] bg-gradient-to-r from-brand-warm/80 to-white px-3.5 py-3.5 text-left shadow-sm transition hover:border-brand-primary/25 hover:shadow-md active:scale-[0.985]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-primary-dark shadow-sm ring-1 ring-brand-ink/5">
                          <UserRound size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-brand-ink">
                            {sheetLabel(sheet)}
                          </span>
                          <span className="mt-0.5 block text-xs text-brand-text-muted">
                            {fill(tr("stylist.ticketMeta"), {
                              id: sheet.id,
                              count,
                              plural: count === 1 ? "" : "s",
                            })}
                            {names.length ? ` · ${names.join(", ")}` : ""}
                          </span>
                        </span>
                        <span className="flex items-center gap-0.5 text-xs font-semibold text-brand-primary-dark opacity-80 transition group-hover:opacity-100">
                          {tr("stylist.choose")}
                          <ChevronRight size={14} />
                        </span>
                      </button>
                    );
                  })}

                  {matchedAppointments.map((apt) => (
                    <button
                      key={`apt-${apt.id}`}
                      type="button"
                      onClick={() => pickAppointment(apt)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-brand-ink/12 bg-white/60 px-3.5 py-3.5 text-left transition hover:border-brand-primary/30 hover:bg-white active:scale-[0.985]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-peach/50 text-brand-primary-dark">
                        <CalendarDays size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-brand-ink">
                          {apt.name ||
                            apt.customer?.name ||
                            tr("stylist.fallbackClient")}
                        </span>
                        <span className="mt-0.5 block text-xs text-brand-text-muted">
                          {fill(tr("stylist.appointmentAt"), {
                            time: formatTime(apt.startTime, locale),
                          })}{" "}
                          · {tr("stylist.useClient")}
                        </span>
                      </span>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-brand-text-muted"
                      />
                    </button>
                  ))}

                  {!loading && !q && openSheets.length === 0 ? (
                    <p className="rounded-2xl bg-brand-warm/60 px-3.5 py-3.5 text-sm text-brand-text-muted">
                      {tr("stylist.noOpenSheets")}
                    </p>
                  ) : null}

                  {!loading &&
                  q &&
                  matchedSheets.length === 0 &&
                  matchedAppointments.length === 0 ? (
                    <p className="text-sm text-brand-text-muted">
                      {tr("stylist.noMatch")}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-peach/45 via-brand-warm to-white p-4 ring-1 ring-brand-primary/15">
                <div
                  aria-hidden
                  className="absolute -top-8 -right-6 h-24 w-24 rounded-full bg-brand-primary/15 blur-2xl"
                />
                <div className="relative mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-brand-primary-dark shadow-sm">
                    <UserPlus size={15} />
                  </span>
                  <p className="text-sm font-semibold text-brand-ink">
                    {tr("stylist.notInList")}
                  </p>
                </div>
                <p className="relative mb-3 text-xs leading-relaxed text-brand-text-muted">
                  {tr("stylist.notInListHint")}
                </p>
                <div className="relative flex gap-2">
                  <input
                    className="input-field !rounded-2xl !border-white/80 !bg-white/90 !py-3 !text-base shadow-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onSearchKeyDown}
                    placeholder={tr("stylist.clientPlaceholder")}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    disabled={query.trim().length < 2}
                    onClick={() => startNewClient()}
                    className="btn-primary inline-flex shrink-0 items-center gap-1.5 !rounded-2xl px-3.5 shadow-md disabled:opacity-40"
                  >
                    <Plus size={18} />
                    {tr("stylist.open")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={logService}
              className="animate-[fade-up_0.35s_ease-out] space-y-4"
            >
              <div className="flex items-start justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand-warm to-brand-peach/30 px-4 py-3.5 ring-1 ring-brand-ink/5">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-brand-text-muted uppercase">
                    {selected.source === "sheet"
                      ? fill(tr("stylist.sheetLabel"), {
                          id: selected.sheetId ?? "",
                        })
                      : selected.source === "appointment"
                        ? tr("stylist.fromApt")
                        : tr("stylist.newSheet")}
                  </p>
                  <p className="mt-0.5 truncate font-serif text-2xl font-semibold text-brand-ink">
                    {selected.label}
                  </p>
                  {selected.source === "new" ? (
                    <p className="mt-1 text-xs text-brand-text-muted">
                      {tr("stylist.newSheetHint")}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={clearSelected}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-text-muted shadow-sm transition hover:text-brand-ink"
                  aria-label={tr("stylist.changeClient")}
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="label-field">
                  {tr("stylist.serviceYouDid")}
                </label>
                <ModernSelect
                  placeholder={tr("stylist.pickService")}
                  value={serviceKey}
                  options={serviceOptions}
                  onChange={setServiceKey}
                  required
                />
                {selectedConsumables.length > 0 ? (
                  <div className="mt-3 rounded-2xl bg-brand-warm/70 px-3.5 py-3">
                    <p className="text-[11px] font-semibold tracking-wide text-brand-ink/55 uppercase">
                      {tr("stylist.consumablesTitle")}
                    </p>
                    <ul className="mt-1.5 space-y-1 text-sm text-brand-ink">
                      {selectedConsumables.map((c) => (
                        <li key={c.productId}>
                          {c.productName ?? `Producto #${c.productId}`}
                          <span className="text-brand-text-muted">
                            {" "}
                            ·{" "}
                            {formatStockQty(c.quantity, c.unit ?? "unit")}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-brand-text-muted">
                      {tr("stylist.consumablesHint")}
                    </p>
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={busy || !employeeId || !serviceKey}
                className="btn-primary flex w-full items-center justify-center gap-2 !rounded-2xl py-4 text-base shadow-[0_14px_30px_-12px_rgba(107,86,56,0.55)] disabled:opacity-50"
              >
                <Check size={18} />
                {busy
                  ? tr("stylist.saving")
                  : selected.source === "new"
                    ? tr("stylist.openAndLog")
                    : tr("stylist.logOnSheet")}
              </button>
            </form>
          )}
        </section>

        <section className="animate-fade-up-delay-2 rounded-[1.6rem] border border-white/70 bg-white/70 p-5 shadow-[0_20px_50px_-30px_rgba(29,31,36,0.35)] backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-warm text-brand-primary-dark">
              <CalendarDays size={17} />
            </span>
            <h2 className="font-serif text-[1.35rem] font-semibold tracking-tight">
              {tr("stylist.agenda")}
            </h2>
          </div>
          {loading ? (
            <p className="text-sm text-brand-text-muted">
              {tr("stylist.loading")}
            </p>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-brand-text-muted">
              {tr("stylist.noAppointments")}
            </p>
          ) : (
            <ul className="relative space-y-2 before:absolute before:top-3 before:bottom-3 before:left-[1.65rem] before:w-px before:bg-brand-ink/8">
              {appointments.map((apt) => {
                const aptServices = (apt.services ?? []) as AptService[];
                const servicesLabel =
                  aptServices
                    .map(
                      (s) =>
                        s.service?.item?.name ??
                        s.service?.name ??
                        tr("stylist.fallbackService"),
                    )
                    .filter(Boolean)
                    .join(", ") || tr("stylist.fromApt");
                return (
                  <li key={apt.id} className="relative">
                    <button
                      type="button"
                      onClick={() => pickAppointment(apt)}
                      className="flex w-full items-start gap-3 rounded-2xl px-1 py-2.5 text-left transition hover:bg-brand-warm/50 active:scale-[0.99]"
                    >
                      <span className="relative z-[1] shrink-0 rounded-xl bg-white px-2.5 py-1.5 text-sm font-semibold tabular-nums text-brand-ink shadow-sm ring-1 ring-brand-ink/6">
                        {formatTime(apt.startTime, locale)}
                      </span>
                      <span className="min-w-0 flex-1 pt-0.5">
                        <span className="block font-medium text-brand-ink">
                          {apt.name ||
                            apt.customer?.name ||
                            tr("stylist.fallbackClient")}
                        </span>
                        <span className="mt-0.5 block text-xs text-brand-text-muted">
                          {servicesLabel}
                          {apt.status?.name ? ` · ${apt.status.name}` : ""}
                        </span>
                      </span>
                      <ChevronRight
                        size={16}
                        className="mt-2 shrink-0 text-brand-text-muted"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
