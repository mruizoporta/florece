"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { platformApi } from "@/lib/platform-api";
import {
  PlatformPageHeader,
  PlatformSurface,
} from "@/components/platform/PlatformUi";

type Plan = { slug: string; name: string };

export default function PlatformTenantNewPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    platformApi<Plan[]>("/plans").then(setPlans).catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const created = await platformApi<{
        id: number;
        temporaryPassword?: string;
      }>("/tenants", {
        method: "POST",
        body: {
          salonName: String(fd.get("salonName") || ""),
          slug: String(fd.get("slug") || "") || undefined,
          ownerName: String(fd.get("ownerName") || ""),
          ownerEmail: String(fd.get("ownerEmail") || ""),
          planSlug: String(fd.get("planSlug") || "") || undefined,
          trialDays: Number(fd.get("trialDays") || 14),
          adminNote: String(fd.get("adminNote") || "") || undefined,
          billingRegion: "NI",
          locale: "es",
        },
      });
      if (created.temporaryPassword) {
        setTempPassword(created.temporaryPassword);
      }
      router.push(`/admin/tenants/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PlatformPageHeader
        eyebrow="Onboarding"
        title="Nuevo salón"
        description="Creá el tenant y un admin con contraseña temporal."
      />

      <PlatformSurface>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label-field">Nombre del salón</label>
            <input name="salonName" className="input-field" required />
          </div>
          <div>
            <label className="label-field">Slug (opcional)</label>
            <input name="slug" className="input-field" placeholder="mi-salon" />
          </div>
          <div>
            <label className="label-field">Nombre del dueño</label>
            <input name="ownerName" className="input-field" required />
          </div>
          <div>
            <label className="label-field">Email del dueño</label>
            <input
              name="ownerEmail"
              type="email"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-field">Plan</label>
            <select name="planSlug" className="input-field" defaultValue="basico">
              {plans.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Días de trial</label>
            <input
              name="trialDays"
              type="number"
              min={0}
              max={365}
              defaultValue={14}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Nota interna</label>
            <textarea name="adminNote" className="input-field" rows={3} />
          </div>
          {error ? (
            <p className="rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {tempPassword ? (
            <p className="rounded-2xl bg-brand-warm px-3 py-2 text-sm">
              Contraseña temporal: <strong>{tempPassword}</strong>
            </p>
          ) : null}
          <button
            type="submit"
            className="btn-primary w-full !rounded-2xl"
            disabled={loading}
          >
            {loading ? "Creando…" : "Crear salón"}
          </button>
        </form>
      </PlatformSurface>
    </div>
  );
}
