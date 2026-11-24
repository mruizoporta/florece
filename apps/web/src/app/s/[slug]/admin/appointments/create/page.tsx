"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createAppointmentSchema } from "@florece/shared";
import { api } from "@/lib/api";
import { formatSlotTime } from "@/lib/time";
import type {
  AvailableSlotsResponse,
  CatalogService,
  PublicEmployee,
} from "@/lib/types";
import { AdminPageHeader, MessageBanner } from "@/components/admin/AdminUi";
import { ModernSelect } from "@/components/ui/ModernSelect";
import { useLocale } from "@/components/LocaleProvider";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { Check, Search, X } from "lucide-react";

export default function AdminAppointmentCreatePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const { formatMoney } = useSalonMoney();

  const [services, setServices] = useState<CatalogService[]>([]);
  const [employees, setEmployees] = useState<PublicEmployee[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [query, setQuery] = useState("");
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalDuration = useMemo(() => {
    const sum = services
      .filter((s) => selectedServices.includes(s.id))
      .reduce((acc, s) => acc + (Number(s.durationTime) || 0), 0);
    return Number.isFinite(sum) ? sum : 0;
  }, [services, selectedServices]);

  useEffect(() => {
    async function load() {
      const [svc, emp] = await Promise.all([
        api<
          Array<{
            id: number;
            durationTime?: number;
            duration_time?: number;
            item: {
              name: string;
              price: number;
              description: string;
              slug: string;
            };
          }>
        >("/v1/catalog/services", { tenantSlug: slug, auth: true }).catch(
          () => [],
        ),
        api<PublicEmployee[]>("/v1/employees", {
          tenantSlug: slug,
          auth: true,
        }).catch(() => []),
      ]);
      setServices(
        svc.map((s) => ({
          id: Number(s.id),
          name: s.item.name,
          slug: s.item.slug,
          description: s.item.description,
          price: Number(s.item.price),
          durationTime: Number(s.durationTime ?? s.duration_time) || 0,
        })),
      );
      setEmployees(
        emp.map((e) => ({
          ...e,
          id: Number(e.id),
        })),
      );
    }
    load();
  }, [slug]);

  const loadSlots = useCallback(async () => {
    if (!employeeId || !date || totalDuration <= 0) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        employee_id: String(employeeId),
        date,
        duration_minutes: String(totalDuration),
      });
      const data = await api<AvailableSlotsResponse>(
        `/v1/appointments/available-slots?${q}`,
        { tenantSlug: slug },
      );
      setSlots(data.slots ?? []);
    } catch (err) {
      setSlots([]);
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar horarios",
      );
    } finally {
      setLoadingSlots(false);
    }
  }, [slug, employeeId, date, totalDuration]);

  useEffect(() => {
    if (date && employeeId && totalDuration > 0) {
      void loadSlots();
    } else {
      setSlots([]);
    }
  }, [date, employeeId, totalDuration, loadSlots]);

  function toggleService(id: number) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setTime("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        phone: phone || null,
        typeName: 'Local' as const,
        employeeId: employeeId!,
        date,
        time,
        serviceIds: selectedServices,
      };
      createAppointmentSchema.parse(payload);
      await api("/v1/appointments", {
        method: "POST",
        tenantSlug: slug,
        auth: true,
        body: payload,
      });
      router.push(`/s/${slug}/admin/appointments`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  const employeeOptions = employees.map((e) => ({
    value: String(e.id),
    label: e.name,
    description: e.description || undefined,
  }));

  const chosen = services.filter((s) => selectedServices.includes(s.id));
  const totalPrice = chosen.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
  const needle = query.trim().toLowerCase();
  const visibleServices = needle
    ? services.filter((s) => s.name.toLowerCase().includes(needle))
    : services;
  const employeeName = employees.find((e) => e.id === employeeId)?.name;
  const canSubmit =
    !saving && Boolean(time) && Boolean(employeeId) && chosen.length > 0 && Boolean(name.trim());

  return (
    <div className="pb-16">
      <AdminPageHeader title={tr("admin.appointmentsCreate")} />

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
      >
        <div className="space-y-5">
          <section className="admin-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-xl text-brand-ink">
                {tr("booking.selectServices")}
              </h2>
              {chosen.length > 0 ? (
                <span className="rounded-full bg-brand-primary/20 px-2.5 py-1 text-xs font-semibold text-brand-primary-dark">
                  {chosen.length} {chosen.length === 1 ? "elegido" : "elegidos"}
                </span>
              ) : null}
            </div>

            {services.length > 6 ? (
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-text-muted"
                />
                <input
                  type="search"
                  className="input-field !pl-10"
                  placeholder="Buscar servicio…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            ) : null}

            {/* Lista con altura fija: con muchos servicios se desplaza en lugar de estirar la página. */}
            <ul className="-mx-1 max-h-[22rem] space-y-1 overflow-y-auto px-1">
              {visibleServices.length === 0 ? (
                <li className="py-6 text-center text-sm text-brand-text-muted">
                  Ningún servicio coincide con «{query}».
                </li>
              ) : (
                visibleServices.map((s) => {
                  const active = selectedServices.includes(s.id);
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => toggleService(s.id)}
                        aria-pressed={active}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition ${
                          active
                            ? "border-brand-primary/60 bg-brand-primary/15"
                            : "border-transparent hover:bg-brand-ink/[0.04]"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition ${
                            active
                              ? "bg-brand-primary text-brand-on-primary"
                              : "border border-brand-ink/20"
                          }`}
                        >
                          {active ? <Check size={13} strokeWidth={3} /> : null}
                        </span>
                        <span className="min-w-0 flex-1 text-sm leading-snug font-medium text-brand-ink">
                          {s.name}
                        </span>
                        <span className="shrink-0 text-xs text-brand-text-muted tabular-nums">
                          {s.durationTime} min
                        </span>
                        <span className="w-20 shrink-0 text-right text-sm font-semibold text-brand-ink tabular-nums">
                          {formatMoney(s.price)}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <section className="admin-card space-y-5">
            <h2 className="font-serif text-xl text-brand-ink">Cuándo y con quién</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <ModernSelect
                label={tr("booking.selectEmployee")}
                placeholder="Elegir profesional"
                value={employeeId ? String(employeeId) : ""}
                options={employeeOptions}
                onChange={(v) => {
                  setEmployeeId(v ? Number(v) : null);
                  setTime("");
                }}
                required
              />
              <div>
                <label className="label-field">{tr("booking.selectDate")}</label>
                <input
                  type="date"
                  className="input-field"
                  value={date}
                  min={new Date().toLocaleDateString("en-CA")}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setTime("");
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-field">{tr("booking.selectTime")}</label>
              {!date || chosen.length === 0 || !employeeId ? (
                <p className="rounded-xl bg-brand-ink/[0.04] px-4 py-3 text-sm text-brand-text-muted">
                  Elegí servicios, profesional y fecha para ver los horarios libres.
                </p>
              ) : loadingSlots ? (
                <p className="text-sm text-brand-text-muted">{tr("admin.loading")}</p>
              ) : slots.length === 0 ? (
                <p className="rounded-xl bg-brand-ink/[0.04] px-4 py-3 text-sm text-brand-text-muted">
                  {tr("booking.noSlots")} Probá otro día o profesional.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {slots.map((s) => {
                    const t = formatSlotTime(s.start);
                    const active = time === t;
                    return (
                      <button
                        key={s.start}
                        type="button"
                        onClick={() => setTime(t)}
                        className={`rounded-xl px-2 py-2 text-sm font-semibold tabular-nums transition ${
                          active
                            ? "bg-brand-primary text-brand-on-primary shadow-sm"
                            : "border border-brand-ink/10 text-brand-ink hover:border-brand-primary/60"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="admin-card space-y-4">
            <h2 className="font-serif text-xl text-brand-ink">Clienta</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">{tr("booking.name")}</label>
                <input
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label-field">{tr("booking.phone")}</label>
                <input
                  className="input-field"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="admin-card space-y-4 lg:sticky lg:top-24">
          <h2 className="font-serif text-xl text-brand-ink">Resumen</h2>
          {chosen.length === 0 ? (
            <p className="text-sm text-brand-text-muted">Todavía no elegiste servicios.</p>
          ) : (
            <ul className="space-y-1.5">
              {chosen.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-brand-ink">{s.name}</span>
                  <span className="tabular-nums text-brand-text-muted">{formatMoney(s.price)}</span>
                  <button
                    type="button"
                    onClick={() => toggleService(s.id)}
                    aria-label={`Quitar ${s.name}`}
                    className="rounded-full p-0.5 text-brand-text-muted hover:bg-brand-ink/[0.06] hover:text-brand-ink"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <dl className="space-y-1.5 border-t border-brand-ink/[0.08] pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-brand-text-muted">Profesional</dt>
              <dd className="truncate text-brand-ink">{employeeName ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-brand-text-muted">Fecha y hora</dt>
              <dd className="text-brand-ink tabular-nums">
                {date ? `${date.split("-").reverse().join("/")}${time ? ` · ${time}` : ""}` : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-brand-text-muted">Duración</dt>
              <dd className="text-brand-ink tabular-nums">{totalDuration ? `${totalDuration} min` : "—"}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 pt-2">
              <dt className="font-semibold text-brand-ink">Total</dt>
              <dd className="font-serif text-2xl text-brand-ink tabular-nums">{formatMoney(totalPrice)}</dd>
            </div>
          </dl>

          {error ? <MessageBanner message={error} type="error" /> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary w-full disabled:opacity-40"
          >
            {saving ? tr("admin.saving") : tr("admin.create")}
          </button>
        </aside>
      </form>
    </div>
  );
}
