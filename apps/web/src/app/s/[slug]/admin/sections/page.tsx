"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { TenantSection } from "@/lib/types";
import {
  AdminPageHeader,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { useLocale } from "@/components/LocaleProvider";

type SectionBlock = {
  id: string;
  title: string;
  description: string;
  toggleKey: keyof TenantSection;
  fields: { key: keyof TenantSection; label: string; placeholder?: string }[];
};

const BLOCKS: SectionBlock[] = [
  {
    id: "about",
    title: "Sobre nosotros",
    description: "Historia y propuesta del salón en la web pública.",
    toggleKey: "aboutUsShowSection",
    fields: [{ key: "aboutUsText", label: "Título de sección", placeholder: "Sobre nosotros" }],
  },
  {
    id: "team",
    title: "Equipo",
    description: "Muestra a tus profesionales.",
    toggleKey: "employeesShowSection",
    fields: [{ key: "employeesText", label: "Título de sección", placeholder: "Nuestro equipo" }],
  },
  {
    id: "services",
    title: "Servicios",
    description: "Catálogo de servicios en la home.",
    toggleKey: "servicesShowSection",
    fields: [{ key: "servicesText", label: "Título de sección", placeholder: "Nuestros servicios" }],
  },
  {
    id: "products",
    title: "Productos",
    description: "Productos destacados para venta.",
    toggleKey: "productsShowSection",
    fields: [{ key: "productsText", label: "Título de sección", placeholder: "Productos" }],
  },
  {
    id: "instagram",
    title: "Instagram",
    description: "Feed social en la página del salón.",
    toggleKey: "instagramShowSection",
    fields: [
      {
        key: "instagramText",
        label: "Título de sección",
        placeholder: "Seguinos en Instagram",
      },
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    description: "Bloque de contacto rápido.",
    toggleKey: "whatsappShowSection",
    fields: [
      { key: "whatsappTitle1", label: "Título 1", placeholder: "¿Listo para tu cita?" },
      { key: "whatsappTitle2", label: "Título 2", placeholder: "Escribinos" },
      { key: "whatsappTitle3", label: "Título 3", placeholder: "Te respondemos pronto" },
      {
        key: "btnWhatsappButtonText",
        label: "Texto del botón",
        placeholder: "Chatear por WhatsApp",
      },
    ],
  },
];

export default function AdminSectionsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const [section, setSection] = useState<TenantSection>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<{ section: TenantSection }>("/v1/settings", {
          tenantSlug: slug,
          auth: true,
        });
        setSection(data.section ?? {});
      } catch {
        setSection({});
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
      await api("/v1/settings/sections", {
        method: "PATCH",
        tenantSlug: slug,
        auth: true,
        body: section,
      });
      setMessage("Cambios guardados");
    } catch {
      setMessage("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof TenantSection, value: string | boolean) {
    setSection((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.sections")}
        subtitle="Activá y personalizá lo que se ve en la web pública del salón."
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {BLOCKS.map((block) => {
          const enabled = !!section[block.toggleKey];
          return (
            <section
              key={block.id}
              className={`admin-card transition ${
                enabled ? "ring-1 ring-brand-primary/35" : "opacity-90"
              }`}
            >
              <ToggleSwitch
                checked={enabled}
                onChange={(v) => update(block.toggleKey, v)}
                label={block.title}
                description={block.description}
              />

              {enabled ? (
                <div className="mt-5 grid gap-4 border-t border-brand-ink/6 pt-5 sm:grid-cols-2">
                  {block.fields.map((field) => (
                    <div
                      key={field.key}
                      className={block.fields.length === 1 ? "sm:col-span-2" : ""}
                    >
                      <label className="label-field">{field.label}</label>
                      <input
                        className="input-field"
                        placeholder={field.placeholder}
                        value={(section[field.key] as string) ?? ""}
                        onChange={(e) => update(field.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}

        <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-ink/8 bg-white/95 p-3 shadow-lg shadow-brand-ink/10 backdrop-blur">
          {message ? (
            <div className="min-w-0 flex-1">
              <MessageBanner
                message={message}
                type={message.includes("Error") ? "error" : "success"}
              />
            </div>
          ) : (
            <p className="flex-1 px-2 text-sm text-brand-text-muted">
              Los cambios se aplican en el sitio público al guardar.
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? tr("admin.saving") : tr("admin.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
