"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Banknote, HandCoins, Landmark, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { AdminModal, AdminSection, MessageBanner } from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { formatDate } from "@/lib/format";

export type PayrollPayment = {
  id: number;
  kind: "payment" | "advance";
  periodFrom: string | null;
  periodTo: string | null;
  base: number;
  commission: number;
  bonus: number;
  deduction: number;
  advances: number;
  amount: number;
  method: string;
  note: string | null;
  paidAt: string;
  applied: boolean;
  cancelled: boolean;
};

type PayMethod = "cash" | "transfer";

const METHODS: Array<{ value: PayMethod; label: string; icon: typeof Banknote }> = [
  { value: "cash", label: "Efectivo", icon: Banknote },
  { value: "transfer", label: "Transferencia", icon: Landmark },
];

export const PAY_METHOD_LABEL: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

function MethodPicker({ value, onChange }: { value: PayMethod; onChange: (m: PayMethod) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {METHODS.map(({ value: m, label, icon: Icon }) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            value === m
              ? "bg-brand-ink text-brand-base"
              : "bg-brand-warm text-brand-ink hover:bg-brand-primary/30"
          }`}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}

/** Liquidar el período, dar adelantos y ver el historial de pagos de un profesional. */
export function PayrollPayments({
  slug,
  employeeId,
  employeeName,
  from,
  to,
  baseProrated,
  commission,
}: {
  slug: string;
  employeeId: string;
  employeeName: string;
  from: string;
  to: string;
  baseProrated: number;
  commission: number;
}) {
  const { formatMoney } = useSalonMoney();
  const [payments, setPayments] = useState<PayrollPayment[]>([]);
  const [pendingAdvances, setPendingAdvances] = useState(0);
  const [bonus, setBonus] = useState("");
  const [deduction, setDeduction] = useState("");
  const [method, setMethod] = useState<PayMethod>("cash");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [advanceOpen, setAdvanceOpen] = useState(false);

  const load = useCallback(() => {
    api<{ pendingAdvances: number; payments: PayrollPayment[] }>(
      `/v1/payroll/employees/${employeeId}/payments`,
      { tenantSlug: slug, auth: true },
    )
      .then((res) => {
        setPayments(res.payments);
        setPendingAdvances(res.pendingAdvances);
      })
      .catch(() => {
        setPayments([]);
        setPendingAdvances(0);
      });
  }, [slug, employeeId]);

  useEffect(load, [load]);

  const bonusNum = Number(bonus) || 0;
  const deductionNum = Number(deduction) || 0;
  const toHand = baseProrated + commission + bonusNum - deductionNum - pendingAdvances;
  const paidPeriod = payments.find(
    (p) =>
      p.kind === "payment" &&
      !p.cancelled &&
      p.periodFrom != null &&
      p.periodTo != null &&
      p.periodFrom <= to &&
      p.periodTo >= from,
  );

  async function pay(e: FormEvent) {
    e.preventDefault();
    if (!window.confirm(`¿Registrar el pago de ${formatMoney(toHand)} a ${employeeName}?`)) return;
    setSaving(true);
    setMessage(null);
    try {
      await api(`/v1/payroll/employees/${employeeId}/payments`, {
        method: "POST",
        tenantSlug: slug,
        auth: true,
        body: { from, to, bonus: bonusNum, deduction: deductionNum, method, note },
      });
      setBonus("");
      setDeduction("");
      setNote("");
      setMessage({ text: "Pago registrado. Quedó como gasto «Sueldos» en Utilidad.", type: "success" });
      load();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Error", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function cancel(p: PayrollPayment) {
    const what = p.kind === "advance" ? "este adelanto" : "este pago";
    if (!window.confirm(`¿Anular ${what} de ${formatMoney(p.amount)}? También se borra su gasto.`)) return;
    try {
      await api(`/v1/payroll/payments/${p.id}/cancel`, { method: "PATCH", tenantSlug: slug, auth: true });
      load();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Error", type: "error" });
    }
  }

  const rows: Array<[string, number, string?]> = [
    ["Base prorrateada", baseProrated],
    ["Comisión", commission],
    ...(bonusNum ? ([["Bono", bonusNum, "+"]] as Array<[string, number, string]>) : []),
    ...(deductionNum ? ([["Deducción", -deductionNum]] as Array<[string, number]>) : []),
    ...(pendingAdvances ? ([["Adelantos a descontar", -pendingAdvances]] as Array<[string, number]>) : []),
  ];

  return (
    <>
      <section className="admin-card space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl text-brand-ink">Pagar este período</h2>
            <p className="text-sm text-brand-text-muted">
              Del {formatDate(`${from}T12:00:00`)} al {formatDate(`${to}T12:00:00`)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdvanceOpen(true)}
            className="btn-secondary inline-flex items-center gap-1.5 py-2 text-sm"
          >
            <HandCoins size={15} />
            Dar adelanto
          </button>
        </div>

        {paidPeriod ? (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
            Este período ya está pagado ({formatMoney(paidPeriod.amount)} el{" "}
            {formatDate(paidPeriod.paidAt)}).{" "}
            <Link href={`/s/${slug}/admin/payroll/payments/${paidPeriod.id}`} className="font-semibold underline">
              Ver recibo
            </Link>
          </div>
        ) : (
          <form onSubmit={pay} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label-field">Bono (opcional)</label>
                  <input
                    className="input-field"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label-field">Deducción (opcional)</label>
                  <input
                    className="input-field"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={deduction}
                    onChange={(e) => setDeduction(e.target.value)}
                    placeholder="Ej. faltante, préstamo"
                  />
                </div>
              </div>
              <div>
                <label className="label-field">Forma de pago</label>
                <MethodPicker value={method} onChange={setMethod} />
              </div>
              <div>
                <label className="label-field">Nota (opcional)</label>
                <input
                  className="input-field"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej. bono por meta de ventas"
                />
              </div>
            </div>

            <div className="flex flex-col rounded-2xl bg-brand-warm/70 p-4">
              <dl className="space-y-1.5 text-sm">
                {rows.map(([label, value, sign]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-brand-text-muted">{label}</dt>
                    <dd className="tabular-nums text-brand-ink">
                      {value < 0 ? `− ${formatMoney(-value)}` : `${sign ?? ""}${formatMoney(value)}`}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 border-t border-brand-ink/10 pt-3">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">
                  A entregar
                </p>
                <p className={`font-serif text-3xl tracking-tight ${toHand < 0 ? "text-red-700" : "text-brand-ink"}`}>
                  {formatMoney(toHand)}
                </p>
                {toHand < 0 ? (
                  <p className="text-xs text-red-700">Los descuentos superan lo que se le debe.</p>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={saving || toHand < 0}
                className="btn-primary mt-4 w-full disabled:opacity-50"
              >
                {saving ? "Registrando…" : "Registrar pago"}
              </button>
            </div>
          </form>
        )}

        {message ? <MessageBanner message={message.text} type={message.type} /> : null}
      </section>

      <AdminSection title="Historial de pagos" description="Pagos y adelantos. Cada uno queda como gasto «Sueldos» en Utilidad.">
        {payments.length === 0 ? (
          <p className="text-sm text-brand-text-muted">Todavía no hay pagos registrados.</p>
        ) : (
          <ul className="divide-y divide-brand-ink/[0.06]">
            {payments.map((p) => (
              <li
                key={p.id}
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 py-3 ${p.cancelled ? "opacity-55" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-brand-ink">
                    {p.kind === "advance"
                      ? "Adelanto"
                      : `Pago del ${formatDate(`${p.periodFrom}T12:00:00`)} al ${formatDate(`${p.periodTo}T12:00:00`)}`}
                  </p>
                  <p className="text-xs text-brand-text-muted">
                    {formatDate(p.paidAt)} · {PAY_METHOD_LABEL[p.method] ?? p.method}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    p.cancelled
                      ? "bg-red-500/12 text-red-700"
                      : p.kind === "advance"
                        ? p.applied
                          ? "bg-brand-ink/[0.06] text-brand-text-muted"
                          : "bg-amber-500/15 text-amber-800"
                        : "bg-emerald-500/12 text-emerald-700"
                  }`}
                >
                  {p.cancelled
                    ? "Anulado"
                    : p.kind === "advance"
                      ? p.applied
                        ? "Descontado"
                        : "Por descontar"
                      : "Pagado"}
                </span>
                <span className={`w-28 text-right font-semibold tabular-nums text-brand-ink ${p.cancelled ? "line-through" : ""}`}>
                  {formatMoney(p.amount)}
                </span>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/s/${slug}/admin/payroll/payments/${p.id}`}
                    aria-label="Ver recibo"
                    title="Recibo"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-ink/10 text-brand-text-muted transition hover:text-brand-ink"
                  >
                    <Printer size={15} />
                  </Link>
                  {!p.cancelled && !(p.kind === "advance" && p.applied) ? (
                    <button
                      type="button"
                      onClick={() => cancel(p)}
                      className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-brand-text-muted transition hover:text-red-700"
                    >
                      Anular
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>

      <AdvanceModal
        open={advanceOpen}
        slug={slug}
        employeeId={employeeId}
        employeeName={employeeName}
        onClose={() => setAdvanceOpen(false)}
        onSaved={() => {
          setAdvanceOpen(false);
          load();
        }}
      />
    </>
  );
}

function AdvanceModal({
  open,
  slug,
  employeeId,
  employeeName,
  onClose,
  onSaved,
}: {
  open: boolean;
  slug: string;
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PayMethod>("cash");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount("");
      setMethod("cash");
      setNote("");
      setError(null);
    }
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api(`/v1/payroll/employees/${employeeId}/advances`, {
        method: "POST",
        tenantSlug: slug,
        auth: true,
        body: { amount: Number(amount), method, note },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminModal open={open} onClose={onClose} title={`Adelanto · ${employeeName}`}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-brand-text-muted">
          Se descuenta solo en su próximo pago.
        </p>
        <div>
          <label className="label-field">Monto</label>
          <input
            className="input-field"
            type="number"
            min={0.01}
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="label-field">Forma de pago</label>
          <MethodPicker value={method} onChange={setMethod} />
        </div>
        <div>
          <label className="label-field">Nota (opcional)</label>
          <input className="input-field" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error ? <MessageBanner message={error} type="error" /> : null}
        <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-50">
          {saving ? "Registrando…" : "Registrar adelanto"}
        </button>
      </form>
    </AdminModal>
  );
}
