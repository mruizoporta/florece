"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Check,
  Clock3,
  Scissors,
  UserRound,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Appointment } from "@/lib/types";
import { useLocale } from "@/components/LocaleProvider";
import {
  AdminEmptyState,
  AdminModal,
  AdminPageHeader,
  AdminPrimaryButton,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import {
  connectAppointmentsSocket,
  playNewAppointmentBeep,
  type AppointmentRealtimeEvent,
} from "@/lib/appointments-socket";
import { salonTodayYmd } from "@/lib/dates";
import { employeeImageUrl } from "@/lib/images";
import { AppointmentWhatsAppActions } from "@/components/admin/AppointmentWhatsAppActions";
import Link from "next/link";
import { getMe } from "@/lib/auth";

type StatusRow = { id: number; name: string; color?: string | null };

const BOARD_COLUMNS: Array<{
  name: string;
  tone: string;
  header: string;
  icon: typeof Clock3;
}> = [
  {
    name: "Pendiente",
    tone: "border-amber-200/80 bg-amber-50/50",
    header: "text-amber-800",
    icon: Clock3,
  },
  {
    name: "En espera",
    tone: "border-sky-200/80 bg-sky-50/50",
    header: "text-sky-800",
    icon: UserRound,
  },
  {
    name: "Atendiendo",
    tone: "border-violet-200/80 bg-violet-50/40",
    header: "text-violet-800",
    icon: Scissors,
  },
  {
    name: "Concluido",
    tone: "border-emerald-200/80 bg-emerald-50/40",
    header: "text-emerald-800",
    icon: Check,
  },
];

function formatTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function serviceNames(a: Appointment) {
  const list = a.services ?? [];
  if (!list.length) return null;
  return list
    .map((s) => s.name)
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");
}

export default function AdminBoardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr, locale } = useLocale();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashName, setFlashName] = useState("");
  const [flashPhone, setFlashPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [flashOpen, setFlashOpen] = useState(false);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [salonName, setSalonName] = useState<string | null>(null);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const toastTimerRef = useRef<number | null>(null);

  const today = salonTodayYmd();

  useEffect(() => {
    getMe()
      .then((me) => setSalonName(me?.tenant?.name ?? null))
      .catch(() => setSalonName(null));
  }, []);

  const statusByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of statuses) map.set(s.name, s.id);
    return map;
  }, [statuses]);

  const load = useCallback(async () => {
    try {
      const [data, statusRows] = await Promise.all([
        api<Appointment[]>(`/v1/appointments?date=${today}`, {
          tenantSlug: slug,
          auth: true,
        }),
        api<StatusRow[]>("/v1/appointments/statuses", {
          tenantSlug: slug,
          auth: true,
        }).catch(() => [] as StatusRow[]),
      ]);
      setAppointments(Array.isArray(data) ? data : []);
      setStatuses(Array.isArray(statusRows) ? statusRows : []);
      knownIdsRef.current = new Set(
        (Array.isArray(data) ? data : []).map((a) => a.id),
      );
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [slug, today]);

  const showToast = useCallback((text: string) => {
    setToast(text);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = connectAppointmentsSocket(slug);

    const refreshQuiet = async () => {
      try {
        const data = await api<Appointment[]>(`/v1/appointments?date=${today}`, {
          tenantSlug: slug,
          auth: true,
        });
        setAppointments(data);
        knownIdsRef.current = new Set(data.map((a) => a.id));
      } catch {
        /* keep current list */
      }
    };

    const onCreated = (event: AppointmentRealtimeEvent) => {
      if (event.date !== today) return;
      const isNew = !knownIdsRef.current.has(event.id);
      void refreshQuiet().then(() => {
        if (!isNew) return;
        playNewAppointmentBeep();
        showToast(
          event.name
            ? `${tr("board.newAppointment")}: ${event.name}`
            : tr("board.newAppointment"),
        );
      });
    };

    const onUpdated = (event: AppointmentRealtimeEvent) => {
      if (event.date !== today && !knownIdsRef.current.has(event.id)) return;
      void refreshQuiet();
    };

    socket.on("connect", () => setLive(true));
    socket.on("disconnect", () => setLive(false));
    socket.on("appointment:created", onCreated);
    socket.on("appointment:updated", onUpdated);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("appointment:created", onCreated);
      socket.off("appointment:updated", onUpdated);
      socket.disconnect();
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [slug, today, showToast, tr]);

  const columns = useMemo(() => {
    return BOARD_COLUMNS.map((col) => ({
      ...col,
      statusId: statusByName.get(col.name),
      items: appointments
        .filter((a) => a.status?.name === col.name)
        .sort((a, b) => {
          const ta = a.startTime ? new Date(a.startTime).getTime() : 0;
          const tb = b.startTime ? new Date(b.startTime).getTime() : 0;
          return ta - tb;
        }),
    }));
  }, [appointments, statusByName]);

  async function moveToStatus(id: number, statusId?: number) {
    if (!statusId) {
      setMessage("Estado no configurado para este salón");
      return;
    }
    setMovingId(id);
    setMessage(null);
    try {
      await api(`/v1/appointments/${id}/status`, {
        method: "PATCH",
        tenantSlug: slug,
        auth: true,
        body: { status_id: statusId },
      });
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setMovingId(null);
    }
  }

  async function cancelAppointment(id: number) {
    setMovingId(id);
    try {
      await api(`/v1/appointments/${id}/cancel`, {
        method: "PATCH",
        tenantSlug: slug,
        auth: true,
      });
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setMovingId(null);
    }
  }

  async function createFlash() {
    if (!flashName.trim()) return;
    try {
      await api("/v1/appointments/simple", {
        method: "POST",
        tenantSlug: slug,
        auth: true,
        body: { name: flashName, phone: flashPhone || null, service_ids: [] },
      });
      setFlashName("");
      setFlashPhone("");
      setFlashOpen(false);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    }
  }

  const totalActive = columns.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.board")}
        subtitle={`${locale === "en" ? "Today's flow" : "Flujo de hoy"} — ${new Date().toLocaleDateString(
          locale === "en" ? "en-US" : "es-NI",
          { dateStyle: "full" },
        )}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                live
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-brand-surface text-brand-text-muted"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  live ? "animate-pulse bg-emerald-500" : "bg-brand-ink/25"
                }`}
              />
              {live ? tr("board.liveOn") : tr("board.liveOff")}
            </span>
            <AdminPrimaryButton onClick={() => setFlashOpen(true)}>
              {tr("board.flash")}
            </AdminPrimaryButton>
          </div>
        }
      />

      {message ? (
        <div className="mb-4">
          <MessageBanner message={message} type="error" />
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner />
      ) : totalActive === 0 ? (
        <AdminEmptyState
          title="No hay citas para hoy"
          description="Creá una cita rápida o esperá reservas en vivo."
          action={
            <AdminPrimaryButton onClick={() => setFlashOpen(true)}>
              {tr("board.flash")}
            </AdminPrimaryButton>
          }
        />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-w-max gap-4 lg:min-w-0 lg:grid lg:grid-cols-4">
            {columns.map((col) => {
              const Icon = col.icon;
              return (
                <section
                  key={col.name}
                  className={`flex w-[18.5rem] shrink-0 flex-col rounded-[1.35rem] border lg:w-auto ${col.tone}`}
                >
                  <header className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/80 ${col.header}`}
                      >
                        <Icon size={15} strokeWidth={2.25} />
                      </span>
                      <div>
                        <p className={`text-sm font-semibold ${col.header}`}>
                          {col.name}
                        </p>
                        <p className="text-[11px] text-brand-text-muted">
                          {col.items.length}{" "}
                          {col.items.length === 1 ? "cita" : "citas"}
                        </p>
                      </div>
                    </div>
                  </header>

                  <div className="flex flex-1 flex-col gap-2.5 px-3 pb-3 pt-1">
                    {col.items.length === 0 ? (
                      <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-brand-ink/10 bg-white/40 px-3 text-center text-xs text-brand-text-muted">
                        Sin citas
                      </div>
                    ) : (
                      col.items.map((a) => {
                        const photo = employeeImageUrl(a.employee?.image);
                        const busy = movingId === a.id;
                        const services = serviceNames(a);
                        return (
                          <article
                            key={a.id}
                            className={`rounded-2xl border border-white/80 bg-white p-3.5 shadow-[0_10px_28px_-22px_rgba(29,31,36,0.55)] transition ${
                              busy ? "opacity-60" : "hover:-translate-y-0.5"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Link
                                  href={`/s/${slug}/admin/appointments/${a.id}`}
                                  className="truncate font-medium text-brand-ink hover:underline"
                                >
                                  {a.name}
                                </Link>
                                <p className="mt-0.5 text-xs font-semibold tabular-nums text-brand-ink/70">
                                  {formatTime(a.startTime)}
                                  {a.endTime
                                    ? ` – ${formatTime(a.endTime)}`
                                    : ""}
                                </p>
                              </div>
                              <button
                                type="button"
                                aria-label={tr("board.cancel")}
                                title={tr("board.cancel")}
                                disabled={busy}
                                onClick={() => cancelAppointment(a.id)}
                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-brand-text-muted transition hover:bg-red-50 hover:text-red-600"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-warm">
                                {photo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={photo}
                                    alt=""
                                    className="h-full w-full object-cover object-top"
                                  />
                                ) : (
                                  <span className="font-serif text-xs text-brand-ink">
                                    {(a.employee?.name ?? "?").charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-brand-ink">
                                  {a.employee?.name ?? "Sin asignar"}
                                </p>
                                {services ? (
                                  <p className="truncate text-[11px] text-brand-text-muted">
                                    {services}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            <AppointmentWhatsAppActions
                              appointment={a}
                              salonName={salonName}
                              locale={locale === "en" ? "en" : "es"}
                              variant="compact"
                              className="mt-2.5"
                            />

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {(() => {
                                const flow = BOARD_COLUMNS.map((c) => c.name);
                                const idx = flow.indexOf(col.name);
                                const prev = idx > 0 ? flow[idx - 1] : null;
                                const next =
                                  idx < flow.length - 1 ? flow[idx + 1] : null;
                                return (
                                  <>
                                    {prev ? (
                                      <button
                                        type="button"
                                        disabled={
                                          busy || !statusByName.get(prev)
                                        }
                                        onClick={() =>
                                          moveToStatus(
                                            a.id,
                                            statusByName.get(prev),
                                          )
                                        }
                                        className="rounded-full bg-brand-ink/[0.04] px-2.5 py-1 text-[11px] font-medium text-brand-ink/70 transition hover:bg-white hover:text-brand-ink disabled:opacity-40"
                                      >
                                        ← {prev}
                                      </button>
                                    ) : null}
                                    {next ? (
                                      <button
                                        type="button"
                                        disabled={
                                          busy || !statusByName.get(next)
                                        }
                                        onClick={() =>
                                          moveToStatus(
                                            a.id,
                                            statusByName.get(next),
                                          )
                                        }
                                        className="rounded-full bg-brand-primary/35 px-2.5 py-1 text-[11px] font-semibold text-brand-ink transition hover:bg-brand-primary/55 disabled:opacity-40"
                                      >
                                        {next} →
                                      </button>
                                    ) : null}
                                  </>
                                );
                              })()}
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      <AdminModal
        open={flashOpen}
        onClose={() => setFlashOpen(false)}
        title={tr("board.flash")}
        description="Walk-in sin hora reservada."
      >
        <div className="space-y-4">
          <div>
            <label className="label-field">Nombre</label>
            <input
              className="input-field !rounded-2xl"
              value={flashName}
              onChange={(e) => setFlashName(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field">Teléfono</label>
            <input
              className="input-field !rounded-2xl"
              value={flashPhone}
              onChange={(e) => setFlashPhone(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={createFlash}
            className="btn-primary w-full !rounded-2xl"
          >
            {tr("admin.create")}
          </button>
        </div>
      </AdminModal>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-brand-primary/30 bg-brand-ink px-4 py-3 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
