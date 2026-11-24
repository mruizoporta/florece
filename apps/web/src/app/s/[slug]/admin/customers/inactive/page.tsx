"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Mail, MessageCircle, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { AdminPageHeader, LoadingSpinner, MessageBanner } from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { formatDate } from "@/lib/format";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";

type InactiveCustomer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  lastVisit: string;
  daysAway: number;
  visits: number;
  spent: number;
  lastService: string | null;
  lastContactedAt: string | null;
};

const DAY_OPTIONS = [30, 60, 90, 180];
const RECENT_CONTACT_DAYS = 14;
const DEFAULT_TEMPLATE =
  "¡Hola {nombre}! 🌸 Te extrañamos en {salon}. Hace un tiempo que no te vemos y nos encantaría consentirte otra vez. ¿Te agendamos {servicio} esta semana? Respondé este mensaje y te buscamos un espacio.";

function fillTemplate(template: string, c: InactiveCustomer, salon: string) {
  const first = c.name.split(" ")[0] || c.name;
  return template
    .replaceAll("{nombre}", first)
    .replaceAll("{salon}", salon || "el salón")
    .replaceAll("{servicio}", c.lastService ? `tu próximo ${c.lastService}` : "tu próxima cita");
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export default function InactiveCustomersPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { formatMoney } = useSalonMoney();
  const storageKey = `florece_reactivation_template_${slug}`;
  const [days, setDays] = useState(60);
  const [rows, setRows] = useState<InactiveCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salonName, setSalonName] = useState("");
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [hideRecent, setHideRecent] = useState(true);

  // La plantilla editada se recuerda en este navegador (comodidad, no dato del salón).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setTemplate(saved);
    } catch {
      /* sin almacenamiento: queda la plantilla por defecto */
    }
  }, [storageKey]);

  function saveTemplate(value: string) {
    setTemplate(value);
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      /* ignorar */
    }
  }

  useEffect(() => {
    api<{ setting?: { companyName?: string | null } }>("/v1/settings", { tenantSlug: slug, auth: true })
      .then((d) => setSalonName(d.setting?.companyName?.trim() ?? ""))
      .catch(() => undefined);
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<{ customers: InactiveCustomer[] }>(`/v1/customers/inactive?days=${days}`, { tenantSlug: slug, auth: true })
      .then((d) => !cancelled && setRows(d.customers))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Error"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, days]);

  const recent = (c: InactiveCustomer) =>
    c.lastContactedAt != null && daysSince(c.lastContactedAt) < RECENT_CONTACT_DAYS;
  const visible = useMemo(() => (hideRecent ? rows.filter((c) => !recent(c)) : rows), [rows, hideRecent]);
  const hiddenCount = rows.length - visible.length;
  const potential = visible.reduce((sum, c) => sum + (c.visits ? c.spent / c.visits : 0), 0);

  async function markContacted(c: InactiveCustomer) {
    try {
      const res = await api<{ lastContactedAt: string }>(`/v1/customers/${c.id}/contacted`, {
        method: "PATCH",
        tenantSlug: slug,
        auth: true,
      });
      setRows((prev) => prev.map((r) => (r.id === c.id ? { ...r, lastContactedAt: res.lastContactedAt } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="pb-16">
      <Link
        href={`/s/${slug}/admin/customers`}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-brand-text-muted transition hover:text-brand-ink"
      >
        <ArrowLeft size={16} />
        Clientes
      </Link>
      <AdminPageHeader
        title="Recuperar clientas"
        subtitle="Las que vinieron y no volvieron. Escribiles por WhatsApp con un toque."
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl bg-brand-ink/[0.05] p-1 text-sm">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                days === d ? "bg-brand-elevated text-brand-ink shadow-sm" : "text-brand-text-muted hover:text-brand-ink"
              }`}
            >
              +{d} días
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-text-muted">
          <input
            type="checkbox"
            checked={hideRecent}
            onChange={(e) => setHideRecent(e.target.checked)}
            className="h-4 w-4 accent-[var(--brand-primary)]"
          />
          Ocultar las que ya contacté (últimos {RECENT_CONTACT_DAYS} días)
        </label>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <section className="admin-card !p-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-brand-ink/[0.06] px-5 py-4">
            <p className="font-serif text-xl text-brand-ink">
              {visible.length} clienta{visible.length === 1 ? "" : "s"} sin venir hace +{days} días
            </p>
            {potential > 0 ? (
              <p className="text-sm text-brand-text-muted">
                Si vuelven una vez: ~{formatMoney(potential)}
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="p-5">
              <MessageBanner message={error} type="error" />
            </div>
          ) : loading ? (
            <LoadingSpinner />
          ) : visible.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-serif text-xl text-brand-ink">¡Nadie por recuperar!</p>
              <p className="mt-1 text-sm text-brand-text-muted">
                {hiddenCount > 0
                  ? `${hiddenCount} ya ${hiddenCount === 1 ? "fue contactada" : "fueron contactadas"} hace poco.`
                  : `Todas tus clientas vinieron en los últimos ${days} días o ya tienen cita.`}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-brand-ink/[0.06]">
              {visible.map((c) => {
                const wa = normalizeWhatsAppPhone(c.phone);
                const text = fillTemplate(template, c, salonName);
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/s/${slug}/admin/customers/${c.id}`}
                        className="font-medium text-brand-ink underline-offset-2 hover:underline"
                      >
                        {c.name}
                      </Link>
                      <p className="text-xs text-brand-text-muted">
                        Última visita {formatDate(c.lastVisit)} · hace {c.daysAway} días
                        {c.lastService ? ` · ${c.lastService}` : ""}
                      </p>
                      <p className="text-xs text-brand-text-muted">
                        {c.visits} visita{c.visits === 1 ? "" : "s"}
                        {c.spent > 0 ? ` · gastó ${formatMoney(c.spent)}` : ""}
                        {c.lastContactedAt ? (
                          <span className="ml-1 font-semibold text-emerald-700">
                            · <Check size={11} className="-mt-0.5 inline" strokeWidth={3} /> contactada{" "}
                            {formatDate(c.lastContactedAt)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {wa ? (
                        <a
                          href={`https://wa.me/${wa}?text=${encodeURIComponent(text)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markContacted(c)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          <MessageCircle size={14} />
                          WhatsApp
                        </a>
                      ) : c.email ? (
                        <a
                          href={`mailto:${c.email}?subject=${encodeURIComponent(`Te extrañamos en ${salonName || "el salón"}`)}&body=${encodeURIComponent(text)}`}
                          onClick={() => markContacted(c)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-ink/10 px-3 py-2 text-xs font-semibold text-brand-ink transition hover:bg-brand-warm"
                        >
                          <Mail size={14} />
                          Correo
                        </a>
                      ) : (
                        <span className="text-xs text-brand-text-muted">Sin teléfono ni correo</span>
                      )}
                      {!c.lastContactedAt || !recent(c) ? (
                        <button
                          type="button"
                          onClick={() => markContacted(c)}
                          title="Marcar como contactada sin abrir WhatsApp"
                          aria-label={`Marcar a ${c.name} como contactada`}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-ink/10 text-brand-text-muted transition hover:text-brand-ink"
                        >
                          <Check size={15} />
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="admin-card space-y-3 xl:sticky xl:top-24">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-serif text-lg text-brand-ink">Mensaje</h2>
            {template !== DEFAULT_TEMPLATE ? (
              <button
                type="button"
                onClick={() => saveTemplate(DEFAULT_TEMPLATE)}
                className="inline-flex items-center gap-1 text-xs text-brand-text-muted hover:text-brand-ink"
              >
                <RotateCcw size={12} />
                Original
              </button>
            ) : null}
          </div>
          <textarea
            className="input-field min-h-[10rem] text-sm leading-relaxed"
            value={template}
            onChange={(e) => saveTemplate(e.target.value)}
            aria-label="Plantilla del mensaje"
          />
          <p className="text-xs text-brand-text-muted">
            Se reemplazan solos: <code>{"{nombre}"}</code>, <code>{"{salon}"}</code> y{" "}
            <code>{"{servicio}"}</code> (su último servicio). Podés ajustar el texto en WhatsApp antes de enviarlo.
          </p>
          {visible[0] ? (
            <div className="rounded-2xl bg-brand-warm/70 p-3 text-sm text-brand-ink">
              <p className="mb-1 text-[11px] font-semibold tracking-[0.12em] text-brand-text-muted uppercase">
                Así le llega a {visible[0].name.split(" ")[0]}
              </p>
              {fillTemplate(template, visible[0], salonName)}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
