"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Ban, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { getMe } from "@/lib/auth";
import { AdminPill, LoadingSpinner, MessageBanner } from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { formatDate, formatDateTime } from "@/lib/format";
import { VOUCHER_STATUS, type Voucher } from "@/lib/vouchers";

type VoucherDetail = Voucher & {
  salonName: string;
  uses: Array<{ orderId: number; at: string | null; amount: number; sessions: number }>;
};

export default function VoucherDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;
  const { formatMoney } = useSalonMoney();
  const [v, setV] = useState<VoucherDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<VoucherDetail>(`/v1/vouchers/${id}`, { tenantSlug: slug, auth: true })
      .then(setV)
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
    getMe()
      .then((me) => setIsAdmin(Boolean(me?.user?.roles?.includes("Admin"))))
      .catch(() => undefined);
  }, [slug, id]);

  async function cancel() {
    if (!v || !window.confirm("¿Anular este bono? Su venta también se anula y sale de caja.")) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await api<Voucher>(`/v1/vouchers/${id}/cancel`, { tenantSlug: slug, auth: true, method: "PATCH" });
      setV({ ...v, ...updated });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (!v) return error ? <MessageBanner message={error} type="error" /> : <LoadingSpinner />;

  const st = VOUCHER_STATUS[v.status];
  const left = v.sessionsTotal - v.sessionsUsed;
  const untouched = v.kind === "giftcard" ? v.balance === v.price : v.sessionsUsed === 0;

  return (
    <div className="space-y-5 pb-10">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/s/${slug}/admin/vouchers`}
          className="inline-flex items-center gap-1.5 text-sm text-brand-text-muted transition hover:text-brand-ink"
        >
          <ArrowLeft size={16} />
          Bonos
        </Link>
        <div className="flex gap-2">
          {isAdmin && v.status !== "cancelled" && untouched ? (
            <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={cancel} disabled={busy}>
              <Ban size={16} />
              Anular
            </button>
          ) : null}
          <button type="button" onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2">
            <Printer size={16} />
            Imprimir
          </button>
        </div>
      </div>
      {error ? <MessageBanner message={error} type="error" /> : null}

      {/* Colores fijos: se imprime en papel blanco aunque el panel esté en modo oscuro. */}
      <article
        className="ticket-print mx-auto w-full max-w-sm rounded-2xl p-6 text-center shadow-sm"
        style={{ background: "#fff", color: "#1d1f24" }}
      >
        <p className="text-base font-bold">{v.salonName}</p>
        <p className="mt-1 text-xs tracking-widest uppercase">{v.kind === "giftcard" ? "Gift card" : "Paquete de sesiones"}</p>
        <p className="mt-5 text-sm">Para</p>
        <p className="font-serif text-2xl">{v.holderName}</p>
        <p className="mt-4 text-3xl font-bold tabular-nums">
          {v.kind === "giftcard" ? formatMoney(v.price) : `${v.sessionsTotal} × ${v.serviceName}`}
        </p>
        <div className="mx-auto mt-5 w-fit rounded-xl border-2 border-dashed border-black/40 px-5 py-2">
          <p className="text-[10px] tracking-widest uppercase">Código</p>
          <p className="font-mono text-2xl font-bold tracking-[0.2em]">{v.code}</p>
        </div>
        <p className="mt-4 text-xs">
          {v.expiresAt ? `Válido hasta el ${formatDate(v.expiresAt)}` : "Sin vencimiento"}
          {v.createdAt ? ` · emitido ${formatDate(v.createdAt)}` : ""}
        </p>
        {v.status === "cancelled" ? <p className="mt-2 font-bold">*** ANULADO ***</p> : null}
      </article>

      <section className="no-print admin-card mx-auto max-w-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-serif text-xl text-brand-ink">
            {v.kind === "giftcard" ? `Saldo ${formatMoney(v.balance)}` : `Quedan ${left} de ${v.sessionsTotal} sesiones`}
          </p>
          <AdminPill tone={st.tone}>{st.label}</AdminPill>
        </div>
        <p className="mt-1 text-sm text-brand-text-muted">
          Cobrado {formatMoney(v.price)}
          {v.kind === "package" ? ` · cada sesión vale ${formatMoney(v.price / v.sessionsTotal)}` : ""}
          {v.holderPhone ? ` · ${v.holderPhone}` : ""}
          {v.saleOrderId ? (
            <>
              {" · "}
              <Link href={`/s/${slug}/admin/orders/${v.saleOrderId}`} className="underline underline-offset-2">
                venta #{v.saleOrderId}
              </Link>
            </>
          ) : null}
        </p>
        <h2 className="mt-5 mb-2 text-sm font-semibold text-brand-ink">Canjes</h2>
        {v.uses.length === 0 ? (
          <p className="text-sm text-brand-text-muted">Todavía no se usó.</p>
        ) : (
          <ul className="divide-y divide-brand-ink/[0.06] text-sm">
            {v.uses.map((u) => (
              <li key={`${u.orderId}-${u.amount}`} className="flex justify-between gap-3 py-2">
                <Link href={`/s/${slug}/admin/orders/${u.orderId}`} className="text-brand-ink underline-offset-2 hover:underline">
                  Ticket #{u.orderId}
                  {u.at ? <span className="text-brand-text-muted"> · {formatDateTime(u.at)}</span> : null}
                </Link>
                <span className="tabular-nums text-brand-ink">
                  {u.sessions ? `${u.sessions} sesión${u.sessions === 1 ? "" : "es"} · ` : ""}
                  {formatMoney(u.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
