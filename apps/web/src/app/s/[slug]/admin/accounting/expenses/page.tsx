"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  AdminPageHeader,
  LoadingSpinner,
  MessageBanner,
} from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { useLocale } from "@/components/LocaleProvider";

type Category = { id: number; name: string; slug: string };
type Expense = {
  id: number;
  amount: number;
  currency: string;
  method: string;
  spentAt: string;
  note?: string | null;
  category: { id: number; name: string; slug: string } | null;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function methodLabel(method: string) {
  const m = method.toLowerCase();
  if (m === "cash") return "Efectivo";
  if (m === "card") return "Tarjeta";
  if (m === "transfer") return "Transferencia";
  return "Otro";
}

export default function AccountingExpensesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { formatMoney } = useSalonMoney();
  const { tr } = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [spentAt, setSpentAt] = useState(todayIso);
  const [note, setNote] = useState("");

  async function reload() {
    const [cats, list] = await Promise.all([
      api<Category[]>("/v1/accounting/expense-categories", {
        auth: true,
        tenantSlug: slug,
      }),
      api<Expense[]>("/v1/accounting/expenses", {
        auth: true,
        tenantSlug: slug,
      }),
    ]);
    setCategories(cats);
    setExpenses(list);
    if (!categoryId && cats[0]) setCategoryId(String(cats[0].id));
  }

  useEffect(() => {
    reload()
      .catch(() => setMessage("No se pudieron cargar los egresos"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api("/v1/accounting/expenses", {
        method: "POST",
        auth: true,
        tenantSlug: slug,
        body: {
          categoryId: Number(categoryId),
          amount: Number(amount),
          method,
          spentAt: new Date(spentAt).toISOString(),
          note: note.trim() || undefined,
        },
      });
      setAmount("");
      setNote("");
      setMessageType("success");
      setMessage("Egreso registrado");
      await reload();
    } catch {
      setMessageType("error");
      setMessage("No se pudo guardar el egreso");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este egreso?")) return;
    try {
      await api(`/v1/accounting/expenses/${id}`, {
        method: "DELETE",
        auth: true,
        tenantSlug: slug,
      });
      await reload();
    } catch {
      setMessageType("error");
      setMessage("No se pudo eliminar");
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <AdminPageHeader
        title={tr("admin.expenses")}
        subtitle={tr("expenses.subtitle")}
      />

      {message ? (
        <MessageBanner type={messageType} message={message} />
      ) : null}

      <form
        onSubmit={handleCreate}
        className="admin-card mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="text-sm lg:col-span-1">
          <span className="mb-1 block text-brand-text-muted">Categoría</span>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input-field py-2"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-brand-text-muted">Monto</span>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-brand-text-muted">Método</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="input-field py-2"
          >
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
            <option value="other">Otro</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-brand-text-muted">Fecha</span>
          <input
            type="date"
            required
            value={spentAt}
            onChange={(e) => setSpentAt(e.target.value)}
            className="input-field py-2"
          />
        </label>
        <label className="text-sm sm:col-span-2 lg:col-span-4">
          <span className="mb-1 block text-brand-text-muted">Nota</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input-field py-2"
            placeholder="Opcional"
          />
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={saving} className="btn-primary w-full py-2.5 text-sm">
            {saving ? "Guardando…" : "Agregar"}
          </button>
        </div>
      </form>

      <div className="admin-card overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-brand-ink/[0.06] text-xs uppercase tracking-wide text-brand-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Método</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-brand-text-muted">
                  Sin egresos registrados
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-brand-ink/[0.04] last:border-0"
                >
                  <td className="px-4 py-3 text-brand-ink">
                    {new Date(e.spentAt).toLocaleDateString("es")}
                    {e.note ? (
                      <span className="mt-0.5 block text-xs text-brand-text-muted">
                        {e.note}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{e.category?.name ?? "—"}</td>
                  <td className="px-4 py-3">{methodLabel(e.method)}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatMoney(e.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(e.id)}
                      className="btn-danger-ghost"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
