"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import type { TenantSetting } from "@/lib/types";
import {
  AdminPageHeader,
  AdminSection,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { useLocale } from "@/components/LocaleProvider";
import { toCssColor, toStoredColor } from "@/lib/theme";

type ColorField = {
  key: keyof TenantSetting;
  label: string;
  hint: string;
  fallback: string;
};

const COLOR_FIELDS: ColorField[] = [
  {
    key: "buttonsBackgroundColor",
    label: "Botones · fondo",
    hint: "CTA Agendar y botones principales",
    fallback: "#ffd200",
  },
  {
    key: "buttonsTextColor",
    label: "Botones · texto",
    hint: "Texto encima del botón",
    fallback: "#1d1f24",
  },
  {
    key: "titlesColor",
    label: "Títulos",
    hint: "Nombre del salón y encabezados",
    fallback: "#1d1f24",
  },
  {
    key: "iconsColor",
    label: "Acentos / precios",
    hint: "Precios e íconos decorativos",
    fallback: "#c49a7c",
  },
  {
    key: "footerBackgroundColor",
    label: "Footer · fondo",
    hint: "Pie de página",
    fallback: "#1d1f24",
  },
  {
    key: "footerTextColor",
    label: "Footer · texto",
    hint: "Texto del pie",
    fallback: "#ffffff",
  },
  {
    key: "btnWhatsappBackgroundColor",
    label: "WhatsApp · fondo",
    hint: "Botón flotante",
    fallback: "#128c7e",
  },
  {
    key: "btnWhatsappTextColor",
    label: "WhatsApp · texto",
    hint: "Ícono del botón flotante",
    fallback: "#ffffff",
  },
];

function ColorPickerRow({
  label,
  hint,
  value,
  fallback,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  fallback: string;
  onChange: (stored: string) => void;
}) {
  const css = toCssColor(value, fallback);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-brand-ink/8 bg-[#faf8f4] p-3">
      <input
        type="color"
        aria-label={label}
        className="h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border-0 bg-transparent p-0"
        value={css}
        onChange={(e) => onChange(toStoredColor(e.target.value))}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-brand-ink">{label}</p>
        <p className="truncate text-xs text-brand-text-muted">{hint}</p>
      </div>
      <input
        className="input-field !w-[7.5rem] !rounded-xl !py-2 font-mono text-xs uppercase"
        value={css}
        onChange={(e) => onChange(toStoredColor(e.target.value))}
        spellCheck={false}
      />
    </div>
  );
}

export default function AdminAppearancePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const [setting, setSetting] = useState<TenantSetting>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
        body: {
          buttonsBackgroundColor: setting.buttonsBackgroundColor,
          buttonsTextColor: setting.buttonsTextColor,
          titlesColor: setting.titlesColor,
          iconsColor: setting.iconsColor,
          footerBackgroundColor: setting.footerBackgroundColor,
          footerTextColor: setting.footerTextColor,
          btnWhatsappBackgroundColor: setting.btnWhatsappBackgroundColor,
          btnWhatsappTextColor: setting.btnWhatsappTextColor,
          activeAppointment: setting.activeAppointment,
        },
      });
      setMessage("Apariencia guardada. Abrí el sitio público para ver los cambios.");
    } catch {
      setMessage("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof TenantSetting, value: string | boolean) {
    setSetting((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <LoadingSpinner />;

  const previewBtn = toCssColor(setting.buttonsBackgroundColor, "#ffd200");
  const previewBtnText = toCssColor(setting.buttonsTextColor, "#1d1f24");
  const previewTitle = toCssColor(setting.titlesColor, "#1d1f24");
  const previewFooter = toCssColor(setting.footerBackgroundColor, "#1d1f24");
  const previewFooterText = toCssColor(setting.footerTextColor, "#ffffff");

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.appearance")}
        subtitle="Colores y opciones de tu página pública — la que ven tus clientes al entrar al sitio."
        action={
          <Link
            href={`/s/${slug}`}
            target="_blank"
            className="btn-secondary inline-flex items-center gap-2 py-2.5 text-sm"
          >
            <ExternalLink size={14} />
            Ver sitio público
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        <AdminSection
          title="Colores"
          description="Se aplican a botones, títulos, precios y pie de la página pública."
        >
          <div
            className="mb-4 overflow-hidden rounded-2xl border border-brand-ink/8"
            style={{ backgroundColor: previewFooter }}
          >
            <div className="px-4 py-5">
              <p
                className="font-serif text-xl font-semibold"
                style={{
                  color:
                    previewTitle === "#1d1f24" ? previewFooterText : previewTitle,
                }}
              >
                {setting.companyName || "Tu salón"}
              </p>
              <button
                type="button"
                className="mt-3 rounded-xl px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: previewBtn, color: previewBtnText }}
              >
                Agendar cita
              </button>
              <p
                className="mt-3 text-xs opacity-70"
                style={{ color: previewFooterText }}
              >
                Vista previa del pie y botones
              </p>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {COLOR_FIELDS.map((f) => (
              <ColorPickerRow
                key={f.key}
                label={f.label}
                hint={f.hint}
                value={(setting[f.key] as string) ?? ""}
                fallback={f.fallback}
                onChange={(stored) => update(f.key, stored)}
              />
            ))}
          </div>
        </AdminSection>

        <AdminSection
          title="Reservas en el sitio"
          description="Controlá si los clientes pueden pedir cita desde la página pública."
        >
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-brand-ink/8 bg-[#faf8f4] px-4 py-3">
            <span className="text-sm font-medium text-brand-ink">
              Mostrar “Agendar cita” en el sitio
            </span>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!setting.activeAppointment}
              onChange={(e) => update("activeAppointment", e.target.checked)}
            />
          </label>
        </AdminSection>

        {message ? (
          <MessageBanner
            message={message}
            type={message.includes("Error") ? "error" : "success"}
          />
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? tr("admin.saving") : tr("admin.save")}
        </button>
      </form>
    </div>
  );
}
