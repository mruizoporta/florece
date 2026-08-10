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

export default function AdminAppointmentCreatePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { tr } = useLocale();

  const [services, setServices] = useState<CatalogService[]>([]);
  const [employees, setEmployees] = useState<PublicEmployee[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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
        typeId: 1,
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

  return (
    <div>
      <AdminPageHeader title={tr("admin.appointmentsCreate")} />

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-2xl space-y-8 rounded-3xl border border-brand-ink/8 bg-white p-6 shadow-sm sm:p-8"
      >
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <label className="label-field mb-0">
              {tr("booking.selectServices")}
            </label>
            {totalDuration > 0 ? (
              <span className="text-xs font-medium text-brand-text-muted">
                {totalDuration} min
              </span>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {services.map((s) => {
              const active = selectedServices.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-brand-primary bg-brand-primary/15 shadow-[0_0_0_1px_var(--brand-primary)]"
                      : "border-brand-ink/10 bg-brand-warm/40 hover:border-brand-ink/20"
                  }`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-medium text-brand-ink">{s.name}</span>
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                        active
                          ? "bg-brand-primary text-brand-ink"
                          : "border border-brand-ink/15 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-brand-text-muted">
                    {s.durationTime} min · ${s.price}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

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

        <section className="space-y-3">
          <label className="label-field">{tr("booking.selectDate")}</label>
          <input
            type="date"
            className="input-field rounded-2xl py-3.5"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              setDate(e.target.value);
              setTime("");
            }}
            required
          />
        </section>

        {date ? (
          <section className="space-y-3">
            <label className="label-field">{tr("booking.selectTime")}</label>
            {selectedServices.length === 0 || totalDuration <= 0 ? (
              <p className="rounded-2xl bg-brand-warm px-4 py-3 text-sm text-brand-text-muted">
                Seleccioná al menos un servicio para ver horarios.
              </p>
            ) : !employeeId ? (
              <p className="rounded-2xl bg-brand-warm px-4 py-3 text-sm text-brand-text-muted">
                Elegí un profesional para ver horarios.
              </p>
            ) : loadingSlots ? (
              <p className="text-sm text-brand-text-muted">
                {tr("admin.loading")}
              </p>
            ) : slots.length === 0 ? (
              <p className="rounded-2xl bg-brand-warm px-4 py-3 text-sm text-brand-text-muted">
                {tr("booking.noSlots")} Probá lunes a sábado (09:00–18:00).
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => {
                  const t = formatSlotTime(s.start);
                  const active = time === t;
                  return (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => setTime(t)}
                      className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "bg-brand-primary text-brand-ink shadow-sm"
                          : "border border-brand-ink/10 bg-brand-warm/50 text-brand-ink hover:border-brand-primary/60 hover:bg-white"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">{tr("booking.name")}</label>
            <input
              className="input-field rounded-2xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-field">{tr("booking.phone")}</label>
            <input
              className="input-field rounded-2xl"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </section>

        {error ? <MessageBanner message={error} type="error" /> : null}

        <button
          type="submit"
          disabled={
            saving ||
            !time ||
            !employeeId ||
            selectedServices.length === 0 ||
            !name.trim()
          }
          className="btn-primary w-full disabled:opacity-40 sm:w-auto"
        >
          {saving ? tr("admin.saving") : tr("admin.create")}
        </button>
      </form>
    </div>
  );
}
