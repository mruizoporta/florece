"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { BellRing, Check, MessageCircle, X } from "lucide-react";
import { api } from "@/lib/api";
import { AdminPageHeader, AdminPill, LoadingSpinner, MessageBanner } from "@/components/admin/AdminUi";
import { ModernSelect } from "@/components/ui/ModernSelect";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";

type Entry = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  date: string;
  employeeId: number | null;
  employeeName: string | null;
  serviceNames: string | null;
  durationMinutes: number;
  note: string | null;
  status: "waiting" | "booked" | "dropped";
  source: "web" | "panel";
  slotFreedAt: string | null;
  notifiedAt: string | null;
};

const prettyDay = (ymd: string) =>
  new Date(`${ymd}T12:00:00`).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
const titleDay = (ymd: string) => prettyDay(ymd).replace(/^./, (c) => c.toUpperCase());

export default function WaitlistPage() {
  const params = useParams();
  const slug = params.slug as string;
  const opts = useMemo(() => ({ tenantSlug: slug, auth: true }), [slug]);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: number; name: string }>>([]);
  const [salonName, setSalonName] = useState("");
  const [free, setFree] = useState<Record<number, string[]>>({});
  const asked = useRef(new Set<number>());
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", date: "", employeeId: "", note: "" });

  const load = useCallback(async () => {
    try {
      setEntries(await api<Entry[]>("/v1/waitlist", opts));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }, [opts]);

  useEffect(() => {
    void load();
    api<Array<{ id: number | string; name: string }>>("/v1/employees", opts)
      .then((rows) => setEmployees(rows.map((e) => ({ id: Number(e.id), name: e.name }))))
      .catch(() => undefined);
    api<{ setting?: { companyName?: string | null } }>("/v1/settings", opts)
      .then((d) => setSalonName(d.setting?.companyName?.trim() ?? ""))
      .catch(() => undefined);
  }, [load, opts]);

  // Horarios libres hoy para cada espera con profesional elegida (la que pidió).
  useEffect(() => {
    const pending = (entries ?? []).filter((e) => e.status === "waiting" && e.employeeId && !asked.current.has(e.id));
    for (const e of pending.slice(0, 20)) {
      asked.current.add(e.id);
      const q = new URLSearchParams({
        employee_id: String(e.employeeId),
        date: e.date,
        duration_minutes: String(e.durationMinutes),
      });
      api<{ slots?: Array<{ start: string }> }>(`/v1/appointments/available-slots?${q}`, { tenantSlug: slug })
        .then((d) => setFree((prev) => ({ ...prev, [e.id]: (d.slots ?? []).map((s) => s.start.slice(0, 5)) })))
        .catch(() => setFree((prev) => ({ ...prev, [e.id]: [] })));
    }
  }, [entries, slug]);

  async function setStatus(e: Entry, status: Entry["status"]) {
    setError(null);
    try {
      await api(`/v1/waitlist/${e.id}`, { ...opts, method: "PATCH", body: { status } });
      setEntries((prev) => prev?.map((x) => (x.id === e.id ? { ...x, status } : x)) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function add(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/v1/waitlist", {
        ...opts,
        method: "POST",
        body: {
          name: form.name,
          phone: form.phone,
          date: form.date,
          employee_id: form.employeeId ? Number(form.employeeId) : null,
          note: form.note || null,
        },
      });
      setForm({ name: "", phone: "", date: form.date, employeeId: form.employeeId, note: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const visible = (entries ?? []).filter((e) => showAll || e.status === "waiting");
  const byDate = visible.reduce<Record<string, Entry[]>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="Lista de espera"
        subtitle="Clientas que quieren un día lleno. Cuando se cancela una cita ese día, las que dejaron correo reciben aviso solo; al resto escribiles desde acá."
      />
      {error ? <MessageBanner message={error} type="error" /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <section className="space-y-4">
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-brand-text-muted">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="h-4 w-4 accent-[var(--brand-primary)]"
            />
            Mostrar también las que ya agendaron o se quitaron
          </label>
          {!entries ? (
            <LoadingSpinner />
          ) : visible.length === 0 ? (
            <div className="admin-card py-14 text-center text-sm text-brand-text-muted">
              Nadie esperando. Cuando un día no tiene horarios, en la reserva web aparece «Avisame si se libera».
            </div>
          ) : (
            Object.entries(byDate).map(([date, list]) => (
              <div key={date} className="admin-card !p-0">
                <p className="border-b border-brand-ink/[0.06] px-5 py-3 font-serif text-lg text-brand-ink">
                  {titleDay(date)}{" "}
                  <span className="font-sans text-sm text-brand-text-muted">· {list.length} esperando</span>
                </p>
                <ul className="divide-y divide-brand-ink/[0.06]">
                  {list.map((e) => {
                    const wa = normalizeWhatsAppPhone(e.phone);
                    const slots = free[e.id] ?? [];
                    const freed = e.status === "waiting" && (e.slotFreedAt || slots.length > 0);
                    const text = `¡Hola ${e.name.split(" ")[0]}! Se liberó un espacio el ${prettyDay(e.date)}${
                      slots.length ? ` (por ejemplo a las ${slots.slice(0, 3).join(", ")})` : ""
                    } en ${salonName || "el salón"}. ¿Te lo agendamos?`;
                    return (
                      <li
                        key={e.id}
                        className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 ${freed ? "bg-emerald-500/[0.06]" : ""}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 font-medium text-brand-ink">
                            {e.name}
                            {freed ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                <BellRing size={11} />
                                Hay lugar
                              </span>
                            ) : null}
                            {e.status !== "waiting" ? (
                              <AdminPill tone={e.status === "booked" ? "success" : "muted"}>
                                {e.status === "booked" ? "Agendó" : "Quitada"}
                              </AdminPill>
                            ) : null}
                          </p>
                          <p className="text-xs text-brand-text-muted">
                            {e.phone}
                            {e.employeeName ? ` · con ${e.employeeName}` : " · cualquier profesional"}
                            {e.serviceNames ? ` · ${e.serviceNames}` : ""}
                            {e.source === "web" ? " · desde la web" : ""}
                            {e.notifiedAt ? " · avisada por correo" : ""}
                          </p>
                          {slots.length ? (
                            <p className="text-xs text-emerald-700">Libre: {slots.slice(0, 8).join(" · ")}</p>
                          ) : null}
                          {e.note ? <p className="text-xs text-brand-ink">{e.note}</p> : null}
                        </div>
                        {e.status === "waiting" ? (
                          <div className="flex shrink-0 items-center gap-1.5">
                            {wa ? (
                              <a
                                href={`https://wa.me/${wa}?text=${encodeURIComponent(text)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                              >
                                <MessageCircle size={14} />
                                WhatsApp
                              </a>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setStatus(e, "booked")}
                              title="Ya agendó"
                              aria-label={`Marcar que ${e.name} ya agendó`}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-ink/10 text-brand-text-muted transition hover:text-emerald-700"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatus(e, "dropped")}
                              title="Quitar de la lista"
                              aria-label={`Quitar a ${e.name} de la lista`}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-ink/10 text-brand-text-muted transition hover:text-red-600"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setStatus(e, "waiting")}
                            className="text-xs text-brand-text-muted underline-offset-2 hover:underline"
                          >
                            Volver a la lista
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </section>

        <form onSubmit={add} className="admin-card space-y-3 xl:sticky xl:top-24">
          <h2 className="font-serif text-lg text-brand-ink">Anotar a alguien</h2>
          <div>
            <label className="label-field" htmlFor="wl-name">Nombre</label>
            <input id="wl-name" className="input-field" value={form.name} onChange={(e) => set({ name: e.target.value })} required />
          </div>
          <div>
            <label className="label-field" htmlFor="wl-phone">Teléfono / WhatsApp</label>
            <input
              id="wl-phone"
              className="input-field"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-field" htmlFor="wl-date">Día</label>
            <input
              id="wl-date"
              type="date"
              className="input-field"
              min={new Date().toLocaleDateString("en-CA")}
              value={form.date}
              onChange={(e) => set({ date: e.target.value })}
              required
            />
          </div>
          <ModernSelect
            label="Profesional"
            value={form.employeeId}
            options={[{ value: "", label: "Cualquiera" }, ...employees.map((e) => ({ value: String(e.id), label: e.name }))]}
            onChange={(v) => set({ employeeId: v })}
          />
          <div>
            <label className="label-field" htmlFor="wl-note">Nota</label>
            <input
              id="wl-note"
              className="input-field"
              placeholder="Ej: prefiere en la tarde, uñas acrílicas"
              value={form.note}
              onChange={(e) => set({ note: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Anotando…" : "Anotar en la lista"}
          </button>
        </form>
      </div>
    </div>
  );
}
