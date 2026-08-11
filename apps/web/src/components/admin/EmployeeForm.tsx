"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import { api, apiUpload } from "@/lib/api";
import type { PublicEmployee, ScheduleEntry } from "@/lib/types";
import { WEEKDAYS } from "@/lib/format";
import {
  AdminSection,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { useLocale } from "@/components/LocaleProvider";
import { employeeImageUrl } from "@/lib/images";

type ScheduleRow = {
  weekday: number;
  start_time: string;
  end_time: string;
  status: boolean;
};

const emptySchedule = (): ScheduleRow[] =>
  WEEKDAYS.map((d) => ({
    weekday: d.value,
    start_time: "09:00",
    end_time: "18:00",
    status: d.value <= 6,
  }));

export function EmployeeForm({ employeeId }: { employeeId?: number }) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { tr } = useLocale();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [baseSalary, setBaseSalary] = useState("0");
  const [commissionRate, setCommissionRate] = useState("0");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [schedule, setSchedule] = useState<ScheduleRow[]>(emptySchedule());
  const [loading, setLoading] = useState(!!employeeId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    async function load() {
      try {
        const [emp, sched] = await Promise.all([
          api<PublicEmployee>(`/v1/employees/${employeeId}`, {
            tenantSlug: slug,
            auth: true,
          }),
          api<ScheduleEntry[]>(`/v1/employees/${employeeId}/schedule`, {
            tenantSlug: slug,
            auth: true,
          }),
        ]);
        setName(emp.name);
        setDescription(emp.description ?? "");
        setImage(emp.image ?? "");
        setPhone(emp.personalInfo?.phone ?? emp.phone ?? "");
        setEmail(emp.personalInfo?.email ?? emp.email ?? "");
        setBaseSalary(String(emp.baseSalary ?? 0));
        setCommissionRate(String(emp.commissionRate ?? 0));
        if (sched.length > 0) {
          setSchedule(
            WEEKDAYS.map((d) => {
              const row = sched.find((s) => s.weekday === d.value);
              return {
                weekday: d.value,
                start_time: (
                  row?.startTime ??
                  row?.start_time ??
                  "09:00"
                ).slice(0, 5),
                end_time: (row?.endTime ?? row?.end_time ?? "18:00").slice(
                  0,
                  5,
                ),
                status: row?.status ?? false,
              };
            }),
          );
        }
      } catch {
        setMessage("Error al cargar");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [employeeId, slug]);

  function updateSchedule(
    weekday: number,
    field: keyof ScheduleRow,
    value: string | boolean,
  ) {
    setSchedule((prev) =>
      prev.map((r) => (r.weekday === weekday ? { ...r, [field]: value } : r)),
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      let id = employeeId;
      const body = {
        name,
        description,
        image,
        phone,
        email,
        status: true,
        base_salary: Number(baseSalary) || 0,
        commission_rate: Number(commissionRate) || 0,
      };
      if (id) {
        await api(`/v1/employees/${id}`, {
          method: "PATCH",
          tenantSlug: slug,
          auth: true,
          body,
        });
      } else {
        const created = await api<{ id: number }>("/v1/employees", {
          method: "POST",
          tenantSlug: slug,
          auth: true,
          body,
        });
        id = created.id;
      }

      await api(`/v1/employees/${id}/schedule`, {
        method: "PUT",
        tenantSlug: slug,
        auth: true,
        body: { schedule: schedule.filter((s) => s.status) },
      });

      const socials = [
        instagram ? { social_id: 1, href: instagram } : null,
        facebook ? { social_id: 2, href: facebook } : null,
      ].filter(Boolean);
      if (socials.length > 0) {
        await api(`/v1/employees/${id}/socials`, {
          method: "PATCH",
          tenantSlug: slug,
          auth: true,
          body: { socials },
        }).catch(() => undefined);
      }

      router.push(`/s/${slug}/admin/employees`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  const photo = employeeImageUrl(image);

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-5">
      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <AdminSection
          title="Foto"
          description="Se muestra en el sitio y en el tablero."
        >
          <div className="overflow-hidden rounded-2xl bg-[#eceae6] aspect-[4/5]">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={name || "Foto"}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="font-serif text-6xl text-brand-ink/20">
                  {(name || "?").charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <label className="label-field">Foto</label>
            <label className="btn-secondary mb-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 !rounded-2xl py-2.5 text-sm">
              <Upload size={16} />
              Subir imagen
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  try {
                    const form = new FormData();
                    form.append("file", file);
                    form.append("kind", "employees");
                    const res = await apiUpload<{ path: string }>(
                      "/v1/storage/upload",
                      form,
                      { tenantSlug: slug, auth: true },
                    );
                    setImage(res.path);
                  } catch (err) {
                    setMessage(
                      err instanceof Error ? err.message : "Error al subir",
                    );
                  }
                }}
              />
            </label>
            <input
              className="input-field !rounded-2xl font-mono text-xs"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="/storage/… o /demo/employees/maria.jpg"
            />
          </div>
        </AdminSection>
        <div className="space-y-5">
          <AdminSection
            title="Perfil"
            description="Nombre y rol que ven tus clientes."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label-field">Nombre</label>
                <input
                  className="input-field !rounded-2xl"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label-field">Especialidad / descripción</label>
                <textarea
                  className="input-field min-h-24 !rounded-2xl"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Colorista y cortes damas"
                />
              </div>
            </div>
          </AdminSection>

          <AdminSection
            title="Contacto"
            description="Datos internos y redes opcionales."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Teléfono</label>
                <input
                  className="input-field !rounded-2xl"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">Email</label>
                <input
                  type="email"
                  className="input-field !rounded-2xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">Instagram</label>
                <input
                  className="input-field !rounded-2xl"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/…"
                />
              </div>
              <div>
                <label className="label-field">Facebook</label>
                <input
                  className="input-field !rounded-2xl"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/…"
                />
              </div>
            </div>
          </AdminSection>

          <AdminSection
            title="Compensación"
            description="Salario base mensual y comisión solo sobre servicios."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Salario base (C$/mes)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field !rounded-2xl"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">Comisión servicios (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="input-field !rounded-2xl"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
              </div>
            </div>
          </AdminSection>
        </div>
      </div>

      <AdminSection
        title="Horario semanal"
        description="Activá los días que atiende y definí entrada / salida."
      >
        <div className="space-y-2">
          {schedule.map((row) => {
            const day = WEEKDAYS.find((d) => d.value === row.weekday);
            return (
              <div
                key={row.weekday}
                className={`grid items-center gap-3 rounded-2xl border px-4 py-3 transition sm:grid-cols-[9rem_1fr] ${
                  row.status
                    ? "border-brand-ink/8 bg-brand-warm"
                    : "border-transparent bg-brand-ink/[0.02] opacity-70"
                }`}
              >
                <label className="flex cursor-pointer items-center gap-3">
                  <span
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                      row.status ? "bg-brand-primary" : "bg-brand-ink/15"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={row.status}
                      onChange={(e) =>
                        updateSchedule(row.weekday, "status", e.target.checked)
                      }
                    />
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
                        row.status ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </span>
                  <span className="text-sm font-medium text-brand-ink">
                    {day?.label}
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="time"
                    className="input-field max-w-[8.5rem] !rounded-xl !py-2.5"
                    value={row.start_time}
                    disabled={!row.status}
                    onChange={(e) =>
                      updateSchedule(row.weekday, "start_time", e.target.value)
                    }
                  />
                  <span className="text-xs text-brand-text-muted">a</span>
                  <input
                    type="time"
                    className="input-field max-w-[8.5rem] !rounded-xl !py-2.5"
                    value={row.end_time}
                    disabled={!row.status}
                    onChange={(e) =>
                      updateSchedule(row.weekday, "end_time", e.target.value)
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </AdminSection>

      {message ? <MessageBanner message={message} type="error" /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <Link
          href={`/s/${slug}/admin/employees`}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-text-muted transition hover:text-brand-ink"
        >
          <ArrowLeft size={16} />
          Volver al equipo
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary !rounded-2xl px-8 disabled:opacity-50"
        >
          {saving ? tr("admin.saving") : tr("admin.save")}
        </button>
      </div>
    </form>
  );
}
