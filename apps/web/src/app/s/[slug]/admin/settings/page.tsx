"use client";

import { FormEvent, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
} from "lucide-react";
import { api } from "@/lib/api";
import type { TenantSetting } from "@/lib/types";
import {
  AdminPageHeader,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { useLocale } from "@/components/LocaleProvider";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { ModernSelect } from "@/components/ui/ModernSelect";

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

  const preview = [
    { icon: Phone, value: setting.phone },
    { icon: MessageCircle, value: setting.whatsapp },
    { icon: Mail, value: setting.mailContact },
    { icon: Clock, value: setting.schedules },
    { icon: MapPin, value: setting.address || setting.location },
  ].filter((row) => row.value?.trim());

  return (
    <div className="pb-24">
      <AdminPageHeader
        title={tr("admin.settings")}
        subtitle="Identidad, contacto y ubicación que ven tus clientas en el sitio."
        action={
          <Link
            href={`/s/${slug}/admin/appearance`}
            className="btn-secondary inline-flex items-center gap-2 py-2.5 text-sm"
          >
            <Palette size={15} strokeWidth={2} />
            Apariencia
          </Link>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
      >
        <aside className="admin-card overflow-hidden !p-0 lg:sticky lg:top-24 lg:order-last">
          <div className="relative bg-[radial-gradient(120%_90%_at_0%_0%,rgba(196,165,116,0.35),transparent_60%),linear-gradient(160deg,var(--brand-warm),var(--brand-elevated))] px-5 pt-5 pb-6">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">
              Así te ven
            </p>
            <span className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary font-serif text-2xl text-brand-on-primary shadow-sm">
              {company.charAt(0).toUpperCase()}
            </span>
            <p className="mt-3 font-serif text-2xl leading-tight text-brand-ink">{company}</p>
            {setting.aboutUs?.trim() ? (
              <p className="mt-1.5 line-clamp-3 text-sm text-brand-text-muted">{setting.aboutUs}</p>
            ) : null}
          </div>
          <ul className="space-y-2.5 px-5 py-4 text-sm">
            {preview.length === 0 ? (
              <li className="text-brand-text-muted">Completá tus datos de contacto.</li>
            ) : (
              preview.map(({ icon: Icon, value }, i) => (
                <li key={i} className="flex items-start gap-2.5 text-brand-ink">
                  <Icon size={15} className="mt-0.5 shrink-0 text-brand-primary-dark" />
                  <span className="min-w-0 break-words">{value}</span>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-brand-ink/[0.06] px-5 py-3.5">
            <Link
              href={`/s/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline underline-offset-2"
            >
              Ver sitio público
              <ExternalLink size={14} />
            </Link>
          </div>
        </aside>

        <div className="space-y-5">
        <section className="admin-card space-y-5">
          <div className="flex items-start gap-3">
            <span
              className="admin-stat-icon shrink-0"
              style={{ "--accent": "196, 165, 116", "--accent-light": "224, 201, 160" } as CSSProperties}
            >
              <Building2 size={17} strokeWidth={2} />
            </span>
            <div>
              <h2 className="font-serif text-xl text-brand-ink">Identidad</h2>
              <p className="mt-0.5 text-sm text-brand-text-muted">
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
                placeholder={
                  (setting.currencySymbol ?? "").toUpperCase().includes("RD")
                    ? "RD$"
                    : "C$"
                }
              />
            </div>
          </div>
        </section>

        <section className="admin-card space-y-5">
          <div className="flex items-start gap-3">
            <span
              className="admin-stat-icon shrink-0"
              style={{ "--accent": "5, 150, 105", "--accent-light": "110, 231, 183" } as CSSProperties}
            >
              <Phone size={17} strokeWidth={2} />
            </span>
            <div>
              <h2 className="font-serif text-xl text-brand-ink">Contacto</h2>
              <p className="mt-0.5 text-sm text-brand-text-muted">
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
                placeholder={
                  (setting.currencySymbol ?? "").toUpperCase().includes("RD")
                    ? "809 555 0000"
                    : "8888 0000"
                }
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
                  placeholder={
                    (setting.currencySymbol ?? "").toUpperCase().includes("RD")
                      ? "18095550000"
                      : "50588880000"
                  }
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
          <div className="border-t border-brand-ink/[0.06] space-y-4 pt-5">
            <ToggleSwitch
              label="Recordatorios automáticos por correo"
              description="Le avisamos a la clienta 24 horas y 2 horas antes de su cita, con tu WhatsApp para reprogramar."
              checked={setting.appointmentReminders ?? true}
              onChange={(value) => update("appointmentReminders", value)}
            />
            <ToggleSwitch
              label="Lector de código de barras"
              description="Agrega el campo «Código de barras» a los productos y en Venta rápida podés escanear para cobrar. Activalo si tenés un lector USB o Bluetooth."
              checked={setting.barcodeScanner ?? false}
              onChange={(value) => update("barcodeScanner", value)}
            />
            <ToggleSwitch
              label="Pedir opinión después de la cita"
              description="Al día siguiente de una cita concluida le mandamos por correo una encuesta de 1 a 5 estrellas. También podés pedirla por WhatsApp desde la cita."
              checked={setting.feedbackRequests ?? true}
              onChange={(value) => update("feedbackRequests", value)}
            />
            <div>
              <label className="label-field" htmlFor="google-review-url">Link de reseñas en Google</label>
              <input
                id="google-review-url"
                className="input-field !rounded-2xl"
                value={setting.googleReviewUrl ?? ""}
                onChange={(e) => update("googleReviewUrl", e.target.value)}
                placeholder="https://g.page/r/…/review"
              />
              <p className="mt-1 text-xs text-brand-text-muted">
                En tu Perfil de Empresa de Google: «Pedir reseñas» → copiá el link. Se lo mostramos solo a quien te pone 4 o 5
                estrellas.
              </p>
            </div>
          </div>
          <div className="space-y-4 border-t border-brand-ink/[0.06] pt-5">
            <div>
              <h3 className="text-sm font-semibold text-brand-ink">Descuentos al cobrar</h3>
              <p className="text-xs text-brand-text-muted">
                Cupones y promociones automáticas se arman en{" "}
                <Link href={`/s/${slug}/admin/promotions`} className="underline underline-offset-2">
                  Promociones
                </Link>
                .
              </p>
            </div>
            <ModernSelect
              label="¿Quién puede dar descuentos a mano?"
              value={setting.manualDiscounts ?? "admin"}
              options={[
                { value: "off", label: "Nadie", description: "Solo cupones y promociones" },
                { value: "admin", label: "Solo la administración" },
                { value: "cashier", label: "Administración y caja", description: "La caja con un tope" },
              ]}
              onChange={(v) => update("manualDiscounts", v)}
            />
            {setting.manualDiscounts === "cashier" ? (
              <div>
                <label className="label-field" htmlFor="discount-max">Tope para la caja (%)</label>
                <input
                  id="discount-max"
                  type="number"
                  min={0}
                  max={100}
                  className="input-field !rounded-2xl"
                  value={setting.manualDiscountMaxPct ?? 20}
                  onChange={(e) => update("manualDiscountMaxPct", e.target.value)}
                />
                <p className="mt-1 text-xs text-brand-text-muted">La administración no tiene tope. Siempre se pide el motivo.</p>
              </div>
            ) : null}
            <ToggleSwitch
              label="Sumar cupón y promoción"
              description="Si está apagado y un ticket califica para las dos, se aplica solo la que más descuenta."
              checked={setting.stackPromotions ?? false}
              onChange={(value) => update("stackPromotions", value)}
            />
          </div>
        </section>

        <section className="admin-card space-y-5">
          <div className="flex items-start gap-3">
            <span
              className="admin-stat-icon shrink-0"
              style={{ "--accent": "2, 132, 199", "--accent-light": "125, 211, 252" } as CSSProperties}
            >
              <MapPin size={17} strokeWidth={2} />
            </span>
            <div>
              <h2 className="font-serif text-xl text-brand-ink">Ubicación</h2>
              <p className="mt-0.5 text-sm text-brand-text-muted">
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
                placeholder={
                  (setting.currencySymbol ?? "").toUpperCase().includes("RD")
                    ? "Santo Domingo, República Dominicana"
                    : "Managua, Nicaragua"
                }
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

        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-brand-ink/[0.06] bg-brand-elevated/90 px-4 py-3 shadow-[0_16px_36px_-18px_rgba(29,31,36,0.45)] backdrop-blur">
          <p className="text-sm text-brand-text-muted">Los cambios se ven en tu sitio al guardar.</p>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary shrink-0 disabled:opacity-50"
          >
            {saving ? tr("admin.saving") : tr("admin.save")}
          </button>
        </div>
        </div>
      </form>
    </div>
  );
}
