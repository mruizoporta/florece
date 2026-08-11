"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Scissors,
  UserRound,
} from "lucide-react";
import { createAppointmentSchema } from "@florece/shared";
import { api } from "@/lib/api";
import { formatSlotTime } from "@/lib/time";
import { formatCurrency } from "@/lib/format";
import { useLocale } from "@/components/LocaleProvider";
import type {
  CatalogService,
  PublicEmployee,
  AvailableSlotsResponse,
} from "@/lib/types";
import { employeeImageUrl } from "@/lib/images";

const STEPS = ["services", "employee", "datetime", "contact", "confirm"] as const;
type Step = (typeof STEPS)[number];

type BookingWizardProps = {
  slug: string;
  services: CatalogService[];
  employees: PublicEmployee[];
  currencySymbol?: string;
};

function formatPrice(symbol: string, price: number) {
  return formatCurrency(price, symbol);
}

function formatPrettyDate(value: string, locale: string) {
  if (!value) return "";
  const d = new Date(`${value}T12:00:00`);
  return d.toLocaleDateString(locale === "en" ? "en" : "es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function BookingWizard({
  slug,
  services,
  employees,
  currencySymbol = "C$",
}: BookingWizardProps) {
  const { tr, locale } = useLocale();
  const money = currencySymbol.trim() || "C$";
  const [step, setStep] = useState<Step>("services");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(step);
  const chosenServices = useMemo(
    () => services.filter((s) => selectedServices.includes(s.id)),
    [services, selectedServices],
  );
  const totalDuration = useMemo(
    () => chosenServices.reduce((sum, s) => sum + s.durationTime, 0),
    [chosenServices],
  );
  const totalPrice = useMemo(
    () => chosenServices.reduce((sum, s) => sum + Number(s.price || 0), 0),
    [chosenServices],
  );
  const selectedEmployee = employees.find((e) => e.id === employeeId);
  const employeePhoto = employeeImageUrl(selectedEmployee?.image);

  const loadSlots = useCallback(async () => {
    if (!employeeId || !date || selectedServices.length === 0) return;
    setLoadingSlots(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        employee_id: String(employeeId),
        date,
        duration_minutes: String(totalDuration),
      });
      const data = await api<AvailableSlotsResponse>(
        `/v1/appointments/available-slots?${params}`,
        { tenantSlug: slug },
      );
      setSlots(data.slots ?? []);
    } catch (e) {
      setSlots([]);
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar horarios",
      );
    } finally {
      setLoadingSlots(false);
    }
  }, [slug, employeeId, date, totalDuration, selectedServices.length]);

  useEffect(() => {
    if (step === "datetime" && date) loadSlots();
  }, [step, date, loadSlots]);

  function toggleService(id: number) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function goTo(target: Step) {
    const targetIdx = STEPS.indexOf(target);
    if (targetIdx <= stepIndex) setStep(target);
  }

  function next() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  function back() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name,
        phone: phone || null,
        typeName: 'Web' as const,
        employeeId: employeeId!,
        date,
        time,
        serviceIds: selectedServices,
      };
      createAppointmentSchema.parse(payload);
      await api("/v1/appointments", {
        method: "POST",
        tenantSlug: slug,
        body: payload,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al agendar");
    } finally {
      setSubmitting(false);
    }
  }

  const canContinue =
    (step === "services" && selectedServices.length > 0) ||
    (step === "employee" && !!employeeId) ||
    (step === "datetime" && !!date && !!time) ||
    (step === "contact" && !!name.trim()) ||
    step === "confirm";

  const stepLabels: Record<Step, string> = {
    services: tr("booking.step.services"),
    employee: tr("booking.step.employee"),
    datetime: tr("booking.step.datetime"),
    contact: tr("booking.step.contact"),
    confirm: tr("booking.step.confirm"),
  };

  const stepHints: Partial<Record<Step, string>> = {
    services: tr("booking.selectServices"),
    employee: tr("booking.selectEmployee"),
    contact: tr("booking.contactHint"),
  };

  if (done) {
    return (
      <div className="booking-success-pop flex min-h-[60vh] flex-col items-center justify-center px-2 text-center">
        <div className="salon-check mb-7 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full shadow-[0_20px_40px_-18px_rgba(0,0,0,0.35)]">
          <Check size={30} strokeWidth={2.5} />
        </div>
        <p className="salon-title font-serif text-4xl font-medium tracking-tight sm:text-5xl">
          {tr("booking.success")}
        </p>
        <p className="mt-4 max-w-md text-[17px] leading-relaxed text-[#1a1a1a]/55">
          {name}
          <br />
          <span className="mt-1 inline-block capitalize">
            {formatPrettyDate(date, locale)} · {time}
          </span>
        </p>
        <a
          href={`/s/${slug}`}
          className="salon-btn mt-10 inline-flex rounded-full px-9 py-3.5 text-sm font-semibold tracking-wide transition hover:brightness-95"
        >
          {locale === "en" ? "Back to site" : "Volver al sitio"}
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-9">
        <div className="mb-6 flex gap-2">
          {STEPS.map((s, i) => {
            const doneStep = i < stepIndex;
            const active = i === stepIndex;
            return (
              <button
                key={s}
                type="button"
                onClick={() => goTo(s)}
                disabled={i > stepIndex}
                aria-label={stepLabels[s]}
                className="group relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.07] disabled:cursor-default"
              >
                <span
                  className={`absolute inset-y-0 left-0 origin-left rounded-full transition-all duration-500 ${
                    doneStep || active
                      ? "salon-progress-on w-full"
                      : "w-0"
                  } ${active ? "opacity-100" : doneStep ? "opacity-80" : ""}`}
                  style={
                    active
                      ? { animation: "bookingBarGrow 0.45s ease both" }
                      : undefined
                  }
                />
              </button>
            );
          })}
        </div>

        <p className="text-sm font-medium text-[#1a1a1a]/45">
          {stepIndex + 1}
          <span className="text-[#1a1a1a]/25"> / {STEPS.length}</span>
          <span className="mx-2 text-[#1a1a1a]/2">·</span>
          <span className="text-[#1a1a1a]/55">{stepLabels[step]}</span>
        </p>
        <h2 className="salon-title mt-2 font-serif text-[2.4rem] leading-[1.05] font-medium tracking-tight sm:text-5xl">
          {stepLabels[step]}
        </h2>
        {stepHints[step] ? (
          <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-[#1a1a1a]/5">
            {stepHints[step]}
          </p>
        ) : null}
      </div>

      <div key={step} className="booking-step-enter">
        {step === "services" && (
          <ul className="space-y-2.5">
            {services.map((s, idx) => {
              const selected = selectedServices.includes(s.id);
              return (
                <li
                  key={s.id}
                  className="booking-row"
                  style={{ animationDelay: `${idx * 45}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`flex w-full items-center gap-4 rounded-[1.35rem] px-4 py-4 text-left transition duration-300 sm:px-5 sm:py-[1.15rem] ${
                      selected
                        ? "salon-selected"
                        : "bg-white/55 ring-1 ring-black/[0.04] hover:bg-white/90 hover:shadow-[0_20px_40px_-30px_rgba(26,26,26,0.45)]"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                        selected
                          ? "salon-check"
                          : "bg-black/[0.04] text-transparent"
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-medium text-[#1a1a1a]">
                        {s.name}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-[#1a1a1a]/45">
                        <Clock3 size={14} strokeWidth={2} />
                        {s.durationTime} min
                      </p>
                    </div>
                    <span className="shrink-0 font-serif text-xl tracking-tight tabular-nums text-[#1a1a1a] sm:text-2xl">
                      {formatPrice(money, s.price)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {step === "employee" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {employees.map((e, idx) => {
              const selected = employeeId === e.id;
              const photo = employeeImageUrl(e.image);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEmployeeId(e.id)}
                  className={`booking-row group overflow-hidden rounded-[1.5rem] text-left transition duration-300 ${
                    selected
                      ? "salon-selected"
                      : "bg-white/55 ring-1 ring-black/[0.04] hover:bg-white/90"
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#e8e4df]">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <UserRound size={36} className="text-[#1a1a1a]/25" />
                      </div>
                    )}
                    {selected ? (
                      <span className="salon-check absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full shadow-sm">
                        <Check size={16} strokeWidth={2.75} />
                      </span>
                    ) : null}
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="truncate font-serif text-xl text-[#1a1a1a]">
                      {e.name}
                    </p>
                    {e.description ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#1a1a1a]/45">
                        {e.description}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === "datetime" && (
          <div className="space-y-8">
            <div>
              <label
                htmlFor="booking-date"
                className="mb-2.5 flex items-center gap-2 text-sm font-medium text-[#1a1a1a]"
              >
                <CalendarDays size={16} className="text-[#1a1a1a]/4" />
                {tr("booking.selectDate")}
              </label>
              <input
                id="booking-date"
                type="date"
                className="booking-input w-full rounded-[1.25rem] border-0 px-5 py-4 text-base text-[#1a1a1a] outline-none"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTime("");
                }}
              />
              {date ? (
                <p className="mt-3 capitalize text-[15px] text-[#1a1a1a]/5">
                  {formatPrettyDate(date, locale)}
                </p>
              ) : null}
            </div>

            {date ? (
              <div>
                <p className="mb-3.5 flex items-center gap-2 text-sm font-medium text-[#1a1a1a]">
                  <Clock3 size={16} className="text-[#1a1a1a]/4" />
                  {tr("booking.selectTime")}
                </p>
                {loadingSlots ? (
                  <p className="text-sm text-[#1a1a1a]/5">Cargando…</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((s, idx) => {
                      const slotTime = formatSlotTime(s.start);
                      const on = time === slotTime;
                      return (
                        <button
                          key={s.start}
                          type="button"
                          onClick={() => setTime(slotTime)}
                          className={`booking-row rounded-[1.1rem] px-3 py-3.5 text-sm font-semibold tabular-nums transition duration-300 ${
                            on
                              ? "salon-slot-on"
                              : "bg-white/70 text-[#1a1a1a] ring-1 ring-black/[0.05] hover:bg-white"
                          }`}
                          style={{ animationDelay: `${idx * 30}ms` }}
                        >
                          {slotTime}
                        </button>
                      );
                    })}
                  </div>
                )}
                {!loadingSlots && slots.length === 0 ? (
                  <p className="mt-2 text-sm text-[#1a1a1a]/5">
                    {tr("booking.noSlots")}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        {step === "contact" && (
          <div className="mx-auto max-w-lg space-y-6">
            <div>
              <label
                htmlFor="booking-name"
                className="mb-2.5 block text-sm font-medium text-[#1a1a1a]"
              >
                {tr("booking.name")}
              </label>
              <input
                id="booking-name"
                className="booking-input w-full rounded-[1.25rem] border-0 px-5 py-4 text-base text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder={tr("booking.namePlaceholder")}
              />
            </div>
            <div>
              <label
                htmlFor="booking-phone"
                className="mb-2.5 block text-sm font-medium text-[#1a1a1a]"
              >
                {tr("booking.phone")}
                <span className="ml-1.5 font-normal text-[#1a1a1a]/4">
                  ({tr("booking.optional")})
                </span>
              </label>
              <input
                id="booking-phone"
                className="booking-input w-full rounded-[1.25rem] border-0 px-5 py-4 text-base text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/3"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                placeholder={tr("booking.phonePlaceholder")}
              />
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="overflow-hidden rounded-[1.75rem] bg-white/70 shadow-[0_30px_60px_-40px_rgba(26,26,26,0.45)] ring-1 ring-black/[0.04]">
            <div
              className="px-6 py-7 sm:px-8"
              style={{
                background:
                  "linear-gradient(145deg, color-mix(in srgb, var(--salon-accent) 22%, white), color-mix(in srgb, var(--salon-accent) 8%, white))",
              }}
            >
              <p className="text-sm font-medium text-[#1a1a1a]/55">
                {tr("booking.summary")}
              </p>
              <p className="salon-title mt-2 font-serif text-4xl tracking-tight sm:text-5xl">
                {formatPrice(money, totalPrice)}
              </p>
              <p className="mt-2 text-[15px] text-[#1a1a1a]/55">
                {totalDuration} min
              </p>
            </div>

            <div className="divide-y divide-black/[0.05] px-2 py-1 sm:px-3">
              <div className="flex gap-4 px-4 py-5">
                <Scissors size={18} className="mt-0.5 shrink-0 text-[#1a1a1a]/35" />
                <div className="min-w-0">
                  <p className="text-sm text-[#1a1a1a]/5">
                    {tr("booking.step.services")}
                  </p>
                  <p className="mt-1 text-[16px] font-medium text-[#1a1a1a]">
                    {chosenServices.map((s) => s.name).join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 px-4 py-5">
                <div className="mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#eceae6]">
                  {employeePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={employeePhoto}
                      alt=""
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <UserRound size={16} className="text-[#1a1a1a]/3" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#1a1a1a]/5">
                    {tr("booking.step.employee")}
                  </p>
                  <p className="mt-1 text-[16px] font-medium text-[#1a1a1a]">
                    {selectedEmployee?.name ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 px-4 py-5">
                <CalendarDays
                  size={18}
                  className="mt-0.5 shrink-0 text-[#1a1a1a]/35"
                />
                <div className="min-w-0">
                  <p className="text-sm text-[#1a1a1a]/5">
                    {tr("booking.step.datetime")}
                  </p>
                  <p className="mt-1 text-[16px] font-medium capitalize text-[#1a1a1a]">
                    {formatPrettyDate(date, locale)} · {time}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 px-4 py-5">
                <UserRound
                  size={18}
                  className="mt-0.5 shrink-0 text-[#1a1a1a]/35"
                />
                <div className="min-w-0">
                  <p className="text-sm text-[#1a1a1a]/5">
                    {tr("booking.step.contact")}
                  </p>
                  <p className="mt-1 text-[16px] font-medium text-[#1a1a1a]">
                    {name}
                    {phone ? ` · ${phone}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="border-t border-black/[0.04] bg-[#f7f4f1]/80 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4 sm:px-8 sm:py-5">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={back}
                className="rounded-full px-4 py-3 text-sm font-semibold text-[#1a1a1a]/55 transition hover:bg-black/[0.04] hover:text-[#1a1a1a]"
              >
                {tr("booking.back")}
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-4">
              {selectedServices.length > 0 ? (
                <div className="hidden text-right sm:block">
                  <p className="text-[11px] font-medium tracking-wide text-[#1a1a1a]/4 uppercase">
                    {tr("booking.summary")}
                  </p>
                  <p className="font-serif text-xl tabular-nums text-[#1a1a1a]">
                    {formatPrice(money, totalPrice)}
                  </p>
                </div>
              ) : null}
              {step !== "confirm" ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canContinue}
                  className="salon-btn rounded-full px-8 py-3.5 text-sm font-semibold tracking-wide shadow-[0_16px_32px_-18px_rgba(0,0,0,0.45)] transition hover:brightness-95 disabled:opacity-35 disabled:shadow-none"
                >
                  {tr("booking.next")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="salon-btn rounded-full px-8 py-3.5 text-sm font-semibold tracking-wide shadow-[0_16px_32px_-18px_rgba(0,0,0,0.45)] transition hover:brightness-95 disabled:opacity-35"
                >
                  {submitting ? "…" : tr("booking.submit")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
