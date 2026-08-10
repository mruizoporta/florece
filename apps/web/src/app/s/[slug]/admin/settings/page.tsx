"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building2,
  ExternalLink,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
} from "lucide-react";
import { api } from "@/lib/api";
import type { TenantSetting } from "@/lib/types";
import {
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { useLocale } from "@/components/LocaleProvider";

export default function AdminSettingsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const [setting, setSetting] = useState<TenantSetting>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    async function load() {
      try {
        const data = await api<{ setting: TenantSetting }>("/v1/settings", {
          tenantSlug: slug,
          auth: true,
        });
        setSetting(data.setting ?? {});
      } catch {
        setSetting({});
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api("/v1/settings", {
        method: "PATCH",
        tenantSlug: slug,
        auth: true,
        body: setting,
      });
      setMessageType("success");
      setMessage("Datos guardados");
    } catch {
      setMessageType("error");
      setMessage("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof TenantSetting, value: string | boolean) {
    setSetting((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <LoadingSpinner />;

  const company = setting.companyName?.trim() || slug;

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[2.15rem] font-semibold tracking-tight text-brand-ink sm:text-4xl">
            {tr("admin.settings")}
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-brand-text-muted">
            Identidad, contacto y ubicación que ven tus clientas en el sitio.
          </p>
        </div>
        <Link
          href={`/s/${slug}/admin/appearance`}
          className="btn-secondary inline-flex items-center gap-2 py-2.5 text-sm"
        >
          <Palette size={15} strokeWidth={2} />
          Apariencia
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="admin-card overflow-hidden !p-0">
          <div className="bg-[linear-gradient(145deg,#f7f3eb_0%,#fff_60%)] px-5 py-6 text-[#1a1c22] sm:px-7">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d4a574]/35 text-[#1a1c22]">
                <Building2 size={24} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.08em] text-[#6b6860] uppercase">
                  Vista previa
                </p>
                <p className="mt-1 truncate font-serif text-2xl text-[#1a1c22]">
                  {company}
                </p>
                <p className="mt-0.5 text-sm text-[#6b6860]">
                  {setting.phone || setting.whatsapp || "Sin teléfono"}
                  {setting.address ? ` · ${setting.address}` : ""}
                </p>
              </div>
              <Link
                href={`/s/${slug}`}
                target="_blank"
                className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-[#1a1c22] underline-offset-2 hover:underline"
              >
                Ver sitio
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>

        <section className="admin-card space-y-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-warm text-brand-ink">
              <Building2 size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-brand-ink">Identidad</h2>
              <p className="mt-1 text-sm text-brand-text-muted">
                Nombre público, descripción y moneda.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label-field">Nombre del salón</label>
              <input
                className="input-field !rounded-2xl"
                value={setting.companyName ?? ""}
                onChange={(e) => update("companyName", e.target.value)}
                placeholder="Ej. Salón Aurora"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Sobre nosotros</label>
              <textarea
                className="input-field min-h-28 !rounded-2xl"
                value={setting.aboutUs ?? ""}
                onChange={(e) => update("aboutUs", e.target.value)}
                placeholder="Una frase corta sobre tu estilo y experiencia"
              />
            </div>
            <div>
              <label className="label-field">Horario</label>
              <input
                className="input-field !rounded-2xl"
                value={setting.schedules ?? ""}
                onChange={(e) => update("schedules", e.target.value)}
                placeholder="Lun–Sáb 9:00–18:00"
              />
            </div>
            <div>
              <label className="label-field">Símbolo de moneda</label>
              <input
                className="input-field !rounded-2xl"
                value={setting.currencySymbol ?? ""}
                onChange={(e) => update("currencySymbol", e.target.value)}
                placeholder="C$"
              />
            </div>
          </div>
        </section>

        <section className="admin-card space-y-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-warm text-brand-ink">
              <Phone size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-brand-ink">Contacto</h2>
              <p className="mt-1 text-sm text-brand-text-muted">
                Canales que aparecen en el sitio y en WhatsApp.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Email</label>
              <input
                className="input-field !rounded-2xl"
                type="email"
                value={setting.mailContact ?? ""}
                onChange={(e) => update("mailContact", e.target.value)}
                placeholder="hola@tusalon.com"
              />
            </div>
            <div>
              <label className="label-field">Teléfono</label>
              <input
                className="input-field !rounded-2xl"
                value={setting.phone ?? ""}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="8888 0000"
              />
            </div>
            <div>
              <label className="label-field">WhatsApp</label>
              <div className="relative">
                <MessageCircle
                  size={15}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-text-muted"
                />
                <input
                  className="input-field !rounded-2xl !pl-10"
                  value={setting.whatsapp ?? ""}
                  onChange={(e) => update("whatsapp", e.target.value)}
                  placeholder="50588880000"
                />
              </div>
            </div>
            <div>
              <label className="label-field">Instagram</label>
              <input
                className="input-field !rounded-2xl"
                value={setting.instagramHref ?? ""}
                onChange={(e) => update("instagramHref", e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
        </section>

        <section className="admin-card space-y-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-warm text-brand-ink">
              <MapPin size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-brand-ink">Ubicación</h2>
              <p className="mt-1 text-sm text-brand-text-muted">
                Dirección y mapa para el pie del sitio.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Dirección</label>
              <input
                className="input-field !rounded-2xl"
                value={setting.address ?? ""}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Calle, ciudad"
              />
            </div>
            <div>
              <label className="label-field">Ubicación / zona</label>
              <input
                className="input-field !rounded-2xl"
                value={setting.location ?? ""}
                onChange={(e) => update("location", e.target.value)}
                placeholder="Managua, Nicaragua"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Mapa embed (HTML iframe)</label>
              <textarea
                className="input-field min-h-28 !rounded-2xl font-mono text-xs"
                value={setting.embeddedContentMap ?? ""}
                onChange={(e) => update("embeddedContentMap", e.target.value)}
                placeholder='<iframe src="https://maps.google.com/..." ...></iframe>'
              />
            </div>
          </div>
        </section>

        {message ? (
          <MessageBanner message={message} type={messageType} />
        ) : null}

        <div className="sticky bottom-4 z-10 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary shadow-[0_16px_36px_-18px_rgba(29,31,36,0.55)] disabled:opacity-50"
          >
            {saving ? tr("admin.saving") : tr("admin.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
