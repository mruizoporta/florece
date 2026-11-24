"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { BadgePercent, Pause, Pencil, Play, Plus, Ticket, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { AdminPageHeader, AdminPill, LoadingSpinner, MessageBanner } from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { ModernSelect } from "@/components/ui/ModernSelect";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

type Promotion = {
  id: number;
  name: string;
  kind: "coupon" | "auto";
  code: string | null;
  discountType: "percent" | "amount";
  value: number;
  appliesTo: "all" | "services" | "products" | "items";
  itemIds: number[];
  weekdays: number[];
  fromTime: string | null;
  toTime: string | null;
  firstVisitOnly: boolean;
  minTotal: number | null;
  startsOn: string | null;
  endsOn: string | null;
  maxUses: number | null;
  usesCount: number;
  showOnBooking: boolean;
  active: boolean;
  summary: string;
  given: number;
};

type ListResponse = {
  promotions: Promotion[];
  last30: Partial<Record<"manual" | "coupon" | "auto", { amount: number; count: number }>>;
};

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const emptyForm = (kind: Promotion["kind"]) => ({
  kind,
  name: "",
  code: "",
  discountType: "percent" as Promotion["discountType"],
  value: "",
  appliesTo: "all" as Promotion["appliesTo"],
  itemIds: [] as number[],
  weekdays: [] as number[],
  fromTime: "",
  toTime: "",
  firstVisitOnly: false,
  minTotal: "",
  startsOn: "",
  endsOn: "",
  maxUses: "",
  showOnBooking: false,
});
type FormState = ReturnType<typeof emptyForm>;

export default function PromotionsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const opts = useMemo(() => ({ tenantSlug: slug, auth: true }), [slug]);
  const { formatMoney } = useSalonMoney();
  const [data, setData] = useState<ListResponse | null>(null);
  const [items, setItems] = useState<Array<{ id: number; name: string; kind: "Servicio" | "Producto" }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api<ListResponse>("/v1/promotions", opts));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }, [opts]);

  useEffect(() => {
    void load();
    Promise.all([
      api<Array<{ item: { id: number; name: string } }>>("/v1/catalog/services", opts).catch(() => []),
      api<Array<{ item: { id: number; name: string } }>>("/v1/catalog/products?for=sale", opts).catch(() => []),
    ]).then(([svcs, prods]) =>
      setItems([
        ...svcs.map((s) => ({ id: Number(s.item.id), name: s.item.name, kind: "Servicio" as const })),
        ...prods.map((p) => ({ id: Number(p.item.id), name: p.item.name, kind: "Producto" as const })),
      ]),
    );
  }, [load, opts]);

  function edit(p: Promotion) {
    setEditingId(p.id);
    setForm({
      kind: p.kind,
      name: p.name,
      code: p.code ?? "",
      discountType: p.discountType,
      value: String(p.value),
      appliesTo: p.appliesTo,
      itemIds: p.itemIds,
      weekdays: p.weekdays,
      fromTime: p.fromTime ?? "",
      toTime: p.toTime ?? "",
      firstVisitOnly: p.firstVisitOnly,
      minTotal: p.minTotal != null ? String(p.minTotal) : "",
      startsOn: p.startsOn ?? "",
      endsOn: p.endsOn ?? "",
      maxUses: p.maxUses != null ? String(p.maxUses) : "",
      showOnBooking: p.showOnBooking,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setError(null);
    try {
      await api(editingId ? `/v1/promotions/${editingId}` : "/v1/promotions", {
        ...opts,
        method: editingId ? "PATCH" : "POST",
        body: {
          kind: form.kind,
          name: form.name,
          code: form.code || null,
          discount_type: form.discountType,
          value: Number(form.value),
          applies_to: form.appliesTo,
          item_ids: form.itemIds,
          weekdays: form.weekdays,
          from_time: form.fromTime || null,
          to_time: form.toTime || null,
          first_visit_only: form.firstVisitOnly,
          min_total: form.minTotal === "" ? null : Number(form.minTotal),
          starts_on: form.startsOn || null,
          ends_on: form.endsOn || null,
          max_uses: form.maxUses === "" ? null : Number(form.maxUses),
          show_on_booking: form.showOnBooking,
        },
      });
      setForm(null);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(p: Promotion) {
    setError(null);
    try {
      await api(`/v1/promotions/${p.id}`, {
        ...opts,
        method: "PATCH",
        body: {
          ...{
            name: p.name,
            code: p.code,
            discount_type: p.discountType,
            value: p.value,
            applies_to: p.appliesTo,
            item_ids: p.itemIds,
            weekdays: p.weekdays,
            from_time: p.fromTime,
            to_time: p.toTime,
            first_visit_only: p.firstVisitOnly,
            min_total: p.minTotal,
            starts_on: p.startsOn,
            ends_on: p.endsOn,
            max_uses: p.maxUses,
            show_on_booking: p.showOnBooking,
          },
          active: !p.active,
        },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function remove(p: Promotion) {
    if (!window.confirm(`¿Borrar «${p.name}»?`)) return;
    setError(null);
    try {
      await api(`/v1/promotions/${p.id}`, { ...opts, method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  const set = (patch: Partial<FormState>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const last = data?.last30 ?? {};

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="Promociones"
        subtitle="Cupones con código y promociones que se aplican solas al cobrar. Quién puede dar descuentos a mano se elige en Ajustes."
        action={
          form ? null : (
            <div className="flex gap-2">
              <button type="button" className="btn-secondary inline-flex items-center gap-1.5 text-sm" onClick={() => setForm(emptyForm("coupon"))}>
                <Ticket size={15} />
                Nuevo cupón
              </button>
              <button type="button" className="btn-primary inline-flex items-center gap-1.5 text-sm" onClick={() => setForm(emptyForm("auto"))}>
                <Plus size={15} />
                Nueva promoción
              </button>
            </div>
          )
        }
      />
      {error ? <MessageBanner message={error} type="error" /> : null}

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {(
          [
            ["auto", "Promociones automáticas"],
            ["coupon", "Cupones"],
            ["manual", "Descuentos a mano"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="admin-stat-card">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">{label}</p>
            <p className="mt-3 font-serif text-3xl text-brand-ink">{formatMoney(last[key]?.amount ?? 0)}</p>
            <p className="mt-2 text-xs text-brand-text-muted">
              descontado en {last[key]?.count ?? 0} tickets · últimos 30 días
            </p>
          </div>
        ))}
      </div>

      {form ? (
        <form onSubmit={save} className="admin-card mb-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-brand-ink">
              {editingId ? "Editar" : "Nuevo"} {form.kind === "coupon" ? "cupón" : "promoción automática"}
            </h2>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => {
                setForm(null);
                setEditingId(null);
              }}
              className="text-brand-text-muted hover:text-brand-ink"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-brand-text-muted">
            {form.kind === "coupon"
              ? "La clienta dice el código al pagar (o lo ponen en caja). Sirve para campañas en Instagram o WhatsApp."
              : "Se aplica sola en caja cuando el ticket cumple las condiciones. La caja la puede quitar."}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field" htmlFor="pr-name">Nombre</label>
              <input
                id="pr-name"
                className="input-field"
                required
                maxLength={120}
                placeholder={form.kind === "coupon" ? "Campaña de verano" : "Martes de uñas"}
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
              />
            </div>
            {form.kind === "coupon" ? (
              <div>
                <label className="label-field" htmlFor="pr-code">Código</label>
                <input
                  id="pr-code"
                  className="input-field font-mono uppercase"
                  required
                  minLength={3}
                  maxLength={30}
                  placeholder="VERANO20"
                  value={form.code}
                  onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
                />
              </div>
            ) : null}
            <div>
              <p className="label-field">Descuento</p>
              <div className="flex gap-2">
                <div className="flex rounded-xl bg-brand-ink/[0.05] p-1 text-sm" role="radiogroup" aria-label="Tipo de descuento">
                  {(
                    [
                      ["percent", "%"],
                      ["amount", "Monto"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={form.discountType === v}
                      onClick={() => set({ discountType: v })}
                      className={`rounded-lg px-3 py-1.5 font-medium ${
                        form.discountType === v ? "bg-brand-elevated text-brand-ink shadow-sm" : "text-brand-text-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  className="input-field"
                  required
                  min={0.01}
                  max={form.discountType === "percent" ? 100 : undefined}
                  step="0.01"
                  aria-label="Valor del descuento"
                  value={form.value}
                  onChange={(e) => set({ value: e.target.value })}
                />
              </div>
            </div>
            <ModernSelect
              label="Aplica a"
              value={form.appliesTo}
              options={[
                { value: "all", label: "Todo el ticket" },
                { value: "services", label: "Solo servicios" },
                { value: "products", label: "Solo productos" },
                { value: "items", label: "Servicios o productos elegidos" },
              ]}
              onChange={(v) => set({ appliesTo: v as FormState["appliesTo"] })}
            />
          </div>

          {form.appliesTo === "items" ? (
            <fieldset>
              <legend className="label-field">Cuáles</legend>
              <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
                {items.map((it) => {
                  const on = form.itemIds.includes(it.id);
                  return (
                    <button
                      key={it.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        set({ itemIds: on ? form.itemIds.filter((x) => x !== it.id) : [...form.itemIds, it.id] })
                      }
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        on ? "border-brand-ink bg-brand-ink text-white" : "border-brand-ink/15 text-brand-ink hover:border-brand-ink/40"
                      }`}
                    >
                      {it.name}
                      <span className="opacity-60"> · {it.kind}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          <div className="space-y-4 rounded-2xl bg-brand-warm/50 p-4">
            <p className="text-sm font-semibold text-brand-ink">Condiciones (todas opcionales)</p>
            <fieldset>
              <legend className="label-field">Días</legend>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d, i) => {
                  const n = i + 1;
                  const on = form.weekdays.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={on}
                      aria-label={DAY_LABELS[i]}
                      title={DAY_LABELS[i]}
                      onClick={() => set({ weekdays: on ? form.weekdays.filter((x) => x !== n) : [...form.weekdays, n] })}
                      className={`h-9 w-9 rounded-full border text-sm font-medium transition ${
                        on ? "border-brand-ink bg-brand-ink text-white" : "border-brand-ink/15 text-brand-ink"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-brand-text-muted">Sin marcar = todos los días.</p>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="label-field" htmlFor="pr-from">Desde la hora</label>
                <input id="pr-from" type="time" className="input-field" value={form.fromTime} onChange={(e) => set({ fromTime: e.target.value })} />
              </div>
              <div>
                <label className="label-field" htmlFor="pr-to">Hasta la hora</label>
                <input id="pr-to" type="time" className="input-field" value={form.toTime} onChange={(e) => set({ toTime: e.target.value })} />
              </div>
              <div>
                <label className="label-field" htmlFor="pr-starts">Vale desde</label>
                <input id="pr-starts" type="date" className="input-field" value={form.startsOn} onChange={(e) => set({ startsOn: e.target.value })} />
              </div>
              <div>
                <label className="label-field" htmlFor="pr-ends">Vale hasta</label>
                <input id="pr-ends" type="date" className="input-field" value={form.endsOn} onChange={(e) => set({ endsOn: e.target.value })} />
              </div>
              <div>
                <label className="label-field" htmlFor="pr-min">Compra mínima</label>
                <input
                  id="pr-min"
                  type="number"
                  min={0}
                  step="0.01"
                  className="input-field"
                  value={form.minTotal}
                  onChange={(e) => set({ minTotal: e.target.value })}
                />
              </div>
              <div>
                <label className="label-field" htmlFor="pr-max">Usos en total</label>
                <input
                  id="pr-max"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Sin límite"
                  className="input-field"
                  value={form.maxUses}
                  onChange={(e) => set({ maxUses: e.target.value })}
                />
              </div>
            </div>
            <ToggleSwitch
              label="Solo primera visita"
              description="La clienta tiene que estar cargada en el ticket y no tener compras anteriores."
              checked={form.firstVisitOnly}
              onChange={(v) => set({ firstVisitOnly: v })}
            />
            {form.kind === "auto" ? (
              <ToggleSwitch
                label="Mostrar en la reserva web"
                description="Aparece como aviso cuando la clienta reserva, para que elija ese día u horario."
                checked={form.showOnBooking}
                onChange={(v) => set({ showOnBooking: v })}
              />
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setForm(null);
                setEditingId(null);
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      ) : null}

      {!data ? (
        <LoadingSpinner />
      ) : data.promotions.length === 0 ? (
        <div className="admin-card py-14 text-center text-sm text-brand-text-muted">
          Todavía no hay promociones. Probá con un cupón para Instagram o un «martes 20%» para llenar los días flojos.
        </div>
      ) : (
        <ul className="admin-card divide-y divide-brand-ink/[0.06] !p-0">
          {data.promotions.map((p) => (
            <li key={p.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 ${p.active ? "" : "opacity-60"}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-warm text-brand-ink">
                {p.kind === "coupon" ? <Ticket size={16} /> : <BadgePercent size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-brand-ink">
                  {p.name}
                  {p.code ? <span className="font-mono text-xs text-brand-text-muted">{p.code}</span> : null}
                  {!p.active ? <AdminPill tone="muted">Pausada</AdminPill> : null}
                  {p.showOnBooking ? <AdminPill tone="success">En la reserva</AdminPill> : null}
                </p>
                <p className="text-xs text-brand-text-muted">{p.summary}</p>
                <p className="text-xs text-brand-text-muted">
                  {p.usesCount} uso{p.usesCount === 1 ? "" : "s"}
                  {p.maxUses ? ` de ${p.maxUses}` : ""} · {formatMoney(p.given)} descontado
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggle(p)}
                  aria-label={p.active ? `Pausar ${p.name}` : `Activar ${p.name}`}
                  title={p.active ? "Pausar" : "Activar"}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-ink/10 text-brand-text-muted hover:text-brand-ink"
                >
                  {p.active ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => edit(p)}
                  aria-label={`Editar ${p.name}`}
                  title="Editar"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-ink/10 text-brand-text-muted hover:text-brand-ink"
                >
                  <Pencil size={14} />
                </button>
                {p.usesCount === 0 ? (
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    aria-label={`Borrar ${p.name}`}
                    title="Borrar"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-ink/10 text-brand-text-muted hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
