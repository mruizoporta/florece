"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { LoadingSpinner, MessageBanner } from "@/components/admin/AdminUi";
import { useSalonMoney } from "@/components/admin/SalonMoneyProvider";
import { PAY_METHOD_LABEL, type PayrollPayment } from "@/components/admin/PayrollPayments";
import { formatDate, formatDateTime } from "@/lib/format";

type Receipt = PayrollPayment & {
  employeeId: number;
  employeeName: string;
  salonName: string;
};

export default function PayrollReceiptPage() {
  const params = useParams();
  const slug = params.slug as string;
  const paymentId = params.paymentId as string;
  const { formatMoney } = useSalonMoney();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Receipt>(`/v1/payroll/payments/${paymentId}`, { tenantSlug: slug, auth: true })
      .then(setReceipt)
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [slug, paymentId]);

  if (error) return <MessageBanner message={error} type="error" />;
  if (!receipt) return <LoadingSpinner />;

  const isAdvance = receipt.kind === "advance";
  const lines: Array<[string, number]> = isAdvance
    ? []
    : ([
        ["Salario base (proporcional)", receipt.base],
        ["Comisiones", receipt.commission],
        ["Bono", receipt.bonus],
        ["Deducciones", -receipt.deduction],
        ["Adelantos descontados", -receipt.advances],
      ] as Array<[string, number]>).filter(([, v]) => v !== 0);

  return (
    <div className="space-y-5 pb-10">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/s/${slug}/admin/payroll/${receipt.employeeId}${
            receipt.periodFrom ? `?from=${receipt.periodFrom}&to=${receipt.periodTo}` : ""
          }`}
          className="inline-flex items-center gap-1.5 text-sm text-brand-text-muted transition hover:text-brand-ink"
        >
          <ArrowLeft size={16} />
          Volver a {receipt.employeeName}
        </Link>
        <button type="button" onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2">
          <Printer size={16} />
          Imprimir
        </button>
      </div>

      {/* Colores fijos: el recibo se imprime en papel blanco aunque el panel esté en modo oscuro. */}
      <article
        className="ticket-print mx-auto w-full max-w-sm rounded-2xl p-6 font-mono text-sm shadow-sm"
        style={{ background: "#fff", color: "#1d1f24" }}
      >
        <header className="text-center">
          <p className="text-base font-bold">{receipt.salonName}</p>
          <p className="mt-1 text-xs uppercase tracking-widest">
            {isAdvance ? "Comprobante de adelanto" : "Recibo de pago"} #{receipt.id}
          </p>
          {receipt.cancelled ? <p className="mt-2 font-bold">*** ANULADO ***</p> : null}
        </header>

        <dl className="mt-5 space-y-1 border-t border-dashed border-black/30 pt-3">
          <div className="flex justify-between gap-3">
            <dt>Profesional</dt>
            <dd className="text-right font-semibold">{receipt.employeeName}</dd>
          </div>
          {!isAdvance ? (
            <div className="flex justify-between gap-3">
              <dt>Período</dt>
              <dd className="text-right">
                {formatDate(`${receipt.periodFrom}T12:00:00`)} – {formatDate(`${receipt.periodTo}T12:00:00`)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt>Fecha</dt>
            <dd className="text-right">{formatDateTime(receipt.paidAt)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Forma de pago</dt>
            <dd className="text-right">{PAY_METHOD_LABEL[receipt.method] ?? receipt.method}</dd>
          </div>
        </dl>

        {lines.length > 0 ? (
          <dl className="mt-3 space-y-1 border-t border-dashed border-black/30 pt-3">
            {lines.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt>{label}</dt>
                <dd className="tabular-nums">
                  {value < 0 ? `-${formatMoney(-value)}` : formatMoney(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-black/30 pt-3">
          <span className="font-bold">{isAdvance ? "ADELANTO" : "TOTAL RECIBIDO"}</span>
          <span className="text-lg font-bold tabular-nums">{formatMoney(receipt.amount)}</span>
        </div>

        {receipt.note ? <p className="mt-3 text-xs">Nota: {receipt.note}</p> : null}

        <div className="mt-14 text-center">
          <div className="mx-auto w-48 border-t border-black/60" />
          <p className="mt-1 text-xs">Firma de {receipt.employeeName}</p>
        </div>
      </article>
    </div>
  );
}
