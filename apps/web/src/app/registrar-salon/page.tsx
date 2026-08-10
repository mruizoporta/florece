"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerSalonSchema } from "@florece/shared";
import { registerSalon } from "@/lib/auth";
import { ApiError, setAccessToken, setStoredTenantSlug } from "@/lib/api";
import { ModernSelect } from "@/components/ui/ModernSelect";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RegisterSalonPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    salonName: "",
    slug: "",
    adminName: "",
    email: "",
    password: "",
    billingRegion: "NI" as "NI" | "US",
    locale: "es" as "es" | "en",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const input = registerSalonSchema.parse(form);
      const result = await registerSalon(input);
      if (result.accessToken) setAccessToken(result.accessToken);
      setStoredTenantSlug(result.tenant.slug);
      router.push(`/s/${result.tenant.slug}/admin`);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError("Error al registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-brand-warm px-4 py-12">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="mb-8 inline-block font-serif text-2xl font-semibold text-brand-ink"
        >
          Florece
        </Link>

        <div className="rounded-2xl border border-brand-ink/8 bg-brand-elevated p-8 shadow-sm">
          <h1 className="font-serif mb-2 text-3xl text-brand-ink">
            Registrar salón
          </h1>
          <p className="mb-6 text-sm text-brand-text-muted">
            Crea tu espacio en minutos. Tu código URL será único.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Nombre del salón</label>
              <input
                className="input-field"
                value={form.salonName}
                onChange={(e) => update("salonName", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-field">Código URL (slug)</label>
              <input
                className="input-field"
                placeholder="mi-salon"
                value={form.slug}
                onChange={(e) =>
                  update("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                required
              />
              <p className="mt-1 text-xs text-brand-text-muted">
                florece.app/s/{form.slug || "mi-salon"}
              </p>
            </div>
            <div>
              <label className="label-field">Tu nombre</label>
              <input
                className="input-field"
                value={form.adminName}
                onChange={(e) => update("adminName", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-field">Correo electrónico</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-field">Contraseña</label>
              <input
                type="password"
                className="input-field"
                minLength={8}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ModernSelect
                label="Región"
                value={form.billingRegion}
                options={[
                  { value: "NI", label: "Nicaragua" },
                  { value: "US", label: "Estados Unidos" },
                ]}
                onChange={(v) => update("billingRegion", v as "NI" | "US")}
              />
              <ModernSelect
                label="Idioma"
                value={form.locale}
                options={[
                  { value: "es", label: "Español" },
                  { value: "en", label: "English" },
                ]}
                onChange={(v) => update("locale", v as "es" | "en")}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Creando…" : "Crear salón"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
