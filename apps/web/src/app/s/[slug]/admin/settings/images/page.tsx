"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ImageIcon, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import type { TenantSetting } from "@/lib/types";
import {
  AdminModal,
  AdminPageHeader,
  AdminPill,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { useLocale } from "@/components/LocaleProvider";
import {
  bannerUrl,
  isPlaceholderAsset,
  logoUrl,
  imageUrl,
} from "@/lib/images";

type ImageSlot = {
  key: keyof TenantSetting;
  label: string;
  hint: string;
  aspect: string;
  span?: string;
  preview: (filename?: string | null) => string | null;
};

const IMAGE_SLOTS: ImageSlot[] = [
  {
    key: "logo",
    label: "Logo",
    hint: "Header y favicon",
    aspect: "aspect-square",
    preview: logoUrl,
  },
  {
    key: "banner",
    label: "Banner",
    hint: "Imagen principal del home",
    aspect: "aspect-[21/9]",
    span: "sm:col-span-2",
    preview: bannerUrl,
  },
  {
    key: "imageParallax",
    label: "Parallax",
    hint: "Fondo decorativo",
    aspect: "aspect-[16/10]",
    preview: (f) => imageUrl("parallax", f),
  },
  {
    key: "imageLeft",
    label: "Imagen izquierda",
    hint: "Bloque visual izquierdo",
    aspect: "aspect-[4/5]",
    preview: (f) => imageUrl("left", f),
  },
  {
    key: "imageRight",
    label: "Imagen derecha",
    hint: "Bloque visual derecho",
    aspect: "aspect-[4/5]",
    preview: (f) => imageUrl("right", f),
  },
];

export default function AdminSettingsImagesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tr } = useLocale();
  const [setting, setSetting] = useState<TenantSetting>({});
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<keyof TenantSetting | null>(null);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

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

  const activeSlot = useMemo(
    () => IMAGE_SLOTS.find((s) => s.key === activeKey) ?? null,
    [activeKey],
  );

  function openSlot(slot: ImageSlot) {
    setActiveKey(slot.key);
    setDraft((setting[slot.key] as string) ?? "");
    setMessage(null);
  }

  async function saveSlot() {
    if (!activeKey) return;
    setSaving(true);
    setMessage(null);
    try {
      const filename = draft.trim();
      await api("/v1/settings", {
        method: "PATCH",
        tenantSlug: slug,
        auth: true,
        body: { [activeKey]: filename || null },
      });
      if (filename) {
        await api("/v1/settings/upload", {
          method: "POST",
          tenantSlug: slug,
          auth: true,
          body: { field: String(activeKey), filename },
        }).catch(() => undefined);
      }
      setSetting((prev) => ({ ...prev, [activeKey]: filename }));
      setImgError((prev) => ({ ...prev, [String(activeKey)]: false }));
      setActiveKey(null);
      setMessage("Imagen actualizada");
    } catch {
      setMessage("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.settingsImages")}
        subtitle="Vista previa y edición de las imágenes del sitio público."
      />

      {message ? (
        <div className="mb-5">
          <MessageBanner
            message={message}
            type={message.includes("Error") ? "error" : "success"}
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {IMAGE_SLOTS.map((slot) => {
          const filename = (setting[slot.key] as string) ?? "";
          const src =
            !imgError[String(slot.key)] && !isPlaceholderAsset(filename)
              ? slot.preview(filename)
              : null;
          const ready = Boolean(src);

          return (
            <button
              key={slot.key}
              type="button"
              onClick={() => openSlot(slot)}
              className={`group admin-card !p-0 overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-28px_rgba(29,31,36,0.5)] ${
                slot.span ?? ""
              }`}
            >
              <div
                className={`relative w-full overflow-hidden bg-[#f3f0ea] ${slot.aspect}`}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={slot.label}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    onError={() =>
                      setImgError((prev) => ({
                        ...prev,
                        [String(slot.key)]: true,
                      }))
                    }
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-brand-text-muted">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80">
                      <ImageIcon size={22} />
                    </span>
                    <span className="text-xs">Sin imagen</span>
                  </div>
                )}
                <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-ink opacity-0 shadow-sm transition group-hover:opacity-100">
                  <Pencil size={14} />
                </span>
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-brand-ink">{slot.label}</p>
                  <p className="mt-0.5 truncate text-xs text-brand-text-muted">
                    {slot.hint}
                  </p>
                  {filename && !isPlaceholderAsset(filename) ? (
                    <p className="mt-1 truncate font-mono text-[11px] text-brand-text-muted">
                      {filename}
                    </p>
                  ) : null}
                </div>
                <AdminPill tone={ready ? "success" : "muted"}>
                  {ready ? "Activa" : "Vacía"}
                </AdminPill>
              </div>
            </button>
          );
        })}
      </div>

      <AdminModal
        open={!!activeSlot}
        onClose={() => setActiveKey(null)}
        title={activeSlot?.label ?? "Imagen"}
        description={activeSlot?.hint}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDraft("")}
              className="btn-secondary flex-1 !rounded-xl py-2.5 text-sm"
            >
              Quitar
            </button>
            <button
              type="button"
              onClick={saveSlot}
              disabled={saving}
              className="btn-primary flex-[1.4] !rounded-xl py-2.5 text-sm disabled:opacity-50"
            >
              {saving ? tr("admin.saving") : "Guardar"}
            </button>
          </div>
        }
      >
        {activeSlot ? (
          <div className="space-y-4">
            <div
              className={`overflow-hidden rounded-2xl bg-[#f3f0ea] ${activeSlot.aspect}`}
            >
              {!isPlaceholderAsset(draft) && activeSlot.preview(draft) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeSlot.preview(draft)!}
                  alt={activeSlot.label}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-brand-text-muted">
                  <ImageIcon size={28} />
                  <p className="text-sm">Vista previa</p>
                </div>
              )}
            </div>
            <div>
              <label className="label-field">Nombre de archivo</label>
              <input
                className="input-field !rounded-xl"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="ej. logo-salon.png"
              />
              <p className="mt-2 text-xs leading-relaxed text-brand-text-muted">
                Podés usar una ruta pública (ej.{" "}
                <span className="font-mono">/demo/site/logo.jpg</span>) o el
                nombre exacto del archivo en el storage del salón.
              </p>
            </div>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}
