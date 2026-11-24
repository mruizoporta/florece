"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Gift, Layers, Search } from "lucide-react";
import { api } from "@/lib/api";
import { AdminPageHeader, AdminPill, LoadingSpinner, MessageBanner } from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { ModernSelect } from "@/components/ui/ModernSelect";
import { formatDate } from "@/lib/format";
import { VOUCHER_STATUS, type Voucher } from "@/lib/vouchers";

const METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
];

type ServiceOption = { itemId: number; name: string; price: number };

export default function VouchersPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const opts = { tenantSlug: slug, auth: true };
  const { formatMoney } = useSalonMoney();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    kind: "giftcard" as Voucher["kind"],
    holder: "",
    phone: "",
    amount: "",
    serviceItemId: "",
    sessions: "5",
    price: "",
    expires: "",
    method: "cash",
  });

  useEffect(() => {
    Promise.all([
      api<Voucher[]>("/v1/vouchers", opts),
      api<{ services?: Array<{ item: { id: number; name: string; price: number | string } }> }>(
        "/v1/catalog/services",
        opts,
      ).catch(() => ({ services: [] })),
    ])
      .then(([rows, cat]) => {
        setVouchers(rows);
        const list = Array.isArray(cat) ? cat : (cat.services ?? []);
        setServices(
          list.map((s: { item: { id: number; name: string; price: number | string } }) => ({
            itemId: Number(s.item.id),
            name: s.item.name,
            price: Number(s.item.price),
          })),
        );
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const service = services.find((s) => String(s.itemId) === form.serviceItemId);
  const sessions = Math.trunc(Number(form.sessions)) || 0;
  const packagePrice = Number(form.price) || 0;
  const listTotal = service ? service.price * sessions : 0;
  const saving = listTotal > 0 && packagePrice > 0 ? listTotal - packagePrice : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[^a-z0-9 áéíóúñ]/g, "");
    if (!q) return vouchers;
    return vouchers.filter(
      (v) => v.code.toLowerCase().includes(q.replace(/\s/g, "")) || v.holderName.toLowerCase().includes(q),
    );
  }, [vouchers, query]);

  const active = vouchers.filter((v) => v.status === "active");
  const pendingValue = active.reduce(
    (s, v) =>
      s + (v.kind === "giftcard" ? v.balance : (v.price / v.sessionsTotal) * (v.sessionsTotal - v.sessionsUsed)),
    0,
  );

  async function sell(e: React.FormEvent) {
    e.preventDefault();
    const total = form.kind === "giftcard" ? Number(form.amount) : packagePrice;
    if (
      !window.confirm(
        `¿Cobrar ${formatMoney(total)} en ${METHODS.find((m) => m.value === form.method)?.label.toLowerCase()} por ${
          form.kind === "giftcard" ? "esta gift card" : `${sessions} sesiones de ${service?.name ?? "servicio"}`
        }?`,
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const v = await api<Voucher>("/v1/vouchers", {
        ...opts,
        method: "POST",
        body: {
          kind: form.kind,
          holder_name: form.holder,
          holder_phone: form.phone || null,
          ...(form.kind === "giftcard"
            ? { amount: Number(form.amount) }
            : { service_item_id: Number(form.serviceItemId), sessions, price: packagePrice }),
          expires_at: form.expires || null,
          method: form.method,
        },
      });
      router.push(`/s/${slug}/admin/vouchers/${v.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="Bonos y gift cards"
        subtitle="Vendé gift cards o paquetes de sesiones. Se canjean con su código en Venta rápida o en el ticket."
      />
      {error ? <MessageBanner message={error} type="error" /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
        <section className="admin-card !p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-ink/[0.06] px-5 py-4">
            <div>
              <p className="font-serif text-xl text-brand-ink">{active.length} vigentes</p>
              <p className="text-xs text-brand-text-muted">
                Por canjear: {formatMoney(pendingValue)} (ya cobrado, se cuenta como venta al usarse)
              </p>
            </div>
            <label className="relative w-full max-w-xs">
              <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-brand-text-muted" />
              <input
                className="input-field !pl-9"
                placeholder="Buscar por código o nombre"
                aria-label="Buscar bono"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm text-brand-text-muted">
              {vouchers.length === 0 ? "Todavía no vendiste bonos." : "Ningún bono coincide con la búsqueda."}
            </p>
          ) : (
            <ul className="divide-y divide-brand-ink/[0.06]">
              {filtered.map((v) => {
                const st = VOUCHER_STATUS[v.status];
                return (
                  <li key={v.id}>
                    <Link
                      href={`/s/${slug}/admin/vouchers/${v.id}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 transition hover:bg-brand-warm/60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-warm text-brand-ink">
                        {v.kind === "giftcard" ? <Gift size={16} /> : <Layers size={16} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-brand-ink">
                          {v.holderName} <span className="font-mono text-xs text-brand-text-muted">· {v.code}</span>
                        </p>
                        <p className="text-xs text-brand-text-muted">
                          {v.kind === "giftcard"
                            ? `Gift card de ${formatMoney(v.price)}`
                            : `Paquete ${v.sessionsTotal}× ${v.serviceName}`}
                          {v.createdAt ? ` · vendido ${formatDate(v.createdAt)}` : ""}
                          {v.expiresAt ? ` · vence ${formatDate(v.expiresAt)}` : ""}
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-brand-ink">
                        {v.kind === "giftcard"
                          ? `Saldo ${formatMoney(v.balance)}`
                          : `${v.sessionsTotal - v.sessionsUsed} de ${v.sessionsTotal} sesiones`}
                      </p>
                      <AdminPill tone={st.tone}>{st.label}</AdminPill>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <form onSubmit={sell} className="admin-card space-y-3 xl:sticky xl:top-24">
          <h2 className="font-serif text-lg text-brand-ink">Vender bono</h2>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-brand-ink/[0.05] p-1 text-sm" role="radiogroup" aria-label="Tipo de bono">
            {(
              [
                ["giftcard", "Gift card", Gift],
                ["package", "Paquete", Layers],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={form.kind === value}
                onClick={() => set({ kind: value })}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                  form.kind === value ? "bg-brand-elevated text-brand-ink shadow-sm" : "text-brand-text-muted hover:text-brand-ink"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
          <div>
            <label className="label-field" htmlFor="v-holder">Para quién</label>
            <input id="v-holder" className="input-field" value={form.holder} onChange={(e) => set({ holder: e.target.value })} required />
          </div>
          <div>
            <label className="label-field" htmlFor="v-phone">Teléfono (opcional)</label>
            <input id="v-phone" className="input-field" inputMode="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </div>

          {form.kind === "giftcard" ? (
            <div>
              <label className="label-field" htmlFor="v-amount">Monto</label>
              <input
                id="v-amount"
                className="input-field"
                type="number"
                min={1}
                step="0.01"
                value={form.amount}
                onChange={(e) => set({ amount: e.target.value })}
                required
              />
            </div>
          ) : (
            <>
              <ModernSelect
                label="Servicio"
                placeholder="Elegí el servicio"
                value={form.serviceItemId}
                options={services.map((s) => ({ value: String(s.itemId), label: s.name, description: formatMoney(s.price) }))}
                onChange={(v) => set({ serviceItemId: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field" htmlFor="v-sessions">Sesiones</label>
                  <input
                    id="v-sessions"
                    className="input-field"
                    type="number"
                    min={2}
                    max={100}
                    value={form.sessions}
                    onChange={(e) => set({ sessions: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label-field" htmlFor="v-price">Precio del paquete</label>
                  <input
                    id="v-price"
                    className="input-field"
                    type="number"
                    min={1}
                    step="0.01"
                    placeholder={listTotal ? String(listTotal) : ""}
                    value={form.price}
                    onChange={(e) => set({ price: e.target.value })}
                    required
                  />
                </div>
              </div>
              {listTotal > 0 ? (
                <p className="text-xs text-brand-text-muted">
                  Por separado serían {formatMoney(listTotal)}
                  {saving > 0 ? ` · ahorra ${formatMoney(saving)} (${Math.round((saving / listTotal) * 100)}%)` : ""}
                  {packagePrice > 0 && sessions > 0 ? ` · cada sesión vale ${formatMoney(packagePrice / sessions)}` : ""}
                </p>
              ) : null}
            </>
          )}

          <div>
            <label className="label-field" htmlFor="v-expires">Vence (opcional)</label>
            <input
              id="v-expires"
              className="input-field"
              type="date"
              min={new Date().toLocaleDateString("en-CA")}
              value={form.expires}
              onChange={(e) => set({ expires: e.target.value })}
            />
          </div>
          <ModernSelect
            label="Cobrado en"
            value={form.method}
            options={METHODS}
            onChange={(v) => set({ method: v })}
            required
          />
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Guardando…" : "Cobrar y crear bono"}
          </button>
        </form>
      </div>
    </div>
  );
}
