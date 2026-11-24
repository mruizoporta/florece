"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { AdminPageHeader, LoadingSpinner, MessageBanner } from "@/components/admin/AdminUi";
import { formatDate } from "@/lib/format";

type FeedbackSummary = {
  from: string;
  to: string;
  sent: number;
  answered: number;
  average: number | null;
  distribution: number[];
  reviewClicks: number;
  byEmployee: Array<{ name: string; count: number; average: number }>;
  items: Array<{
    id: number;
    rating: number;
    comment: string | null;
    customerName: string | null;
    employeeName: string | null;
    serviceNames: string | null;
    reviewClicked: boolean;
    appointmentId: number | null;
    orderId: number | null;
    answeredAt: string;
  }>;
};

const ymd = (d: Date) => d.toLocaleDateString("en-CA");
const RANGES = [
  { label: "Este mes", days: 0 },
  { label: "90 días", days: 90 },
  { label: "Este año", days: -1 },
];

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? "text-amber-400" : "text-brand-ink/15"}
          fill="currentColor"
          strokeWidth={1.2}
        />
      ))}
    </span>
  );
}

export default function FeedbackAdminPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [range, setRange] = useState(0);
  const [data, setData] = useState<FeedbackSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlyLow, setOnlyLow] = useState(false);

  useEffect(() => {
    const now = new Date();
    const r = RANGES[range];
    const from =
      r.days === 0
        ? ymd(new Date(now.getFullYear(), now.getMonth(), 1))
        : r.days === -1
          ? `${now.getFullYear()}-01-01`
          : ymd(new Date(now.getTime() - r.days * 86_400_000));
    setData(null);
    setError(null);
    api<FeedbackSummary>(`/v1/feedback?from=${from}&to=${ymd(now)}`, { tenantSlug: slug, auth: true })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [slug, range]);

  const items = data ? (onlyLow ? data.items.filter((i) => i.rating <= 3) : data.items) : [];
  const maxDist = data ? Math.max(1, ...data.distribution) : 1;

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="Opiniones"
        subtitle="Lo que dicen tus clientas después de la visita. Las que ponen 4 o 5 estrellas reciben el link para reseñarte en Google."
      />
      <div className="mb-5 flex gap-1 rounded-xl bg-brand-ink/[0.05] p-1 text-sm" style={{ width: "fit-content" }}>
        {RANGES.map((r, i) => (
          <button
            key={r.label}
            type="button"
            aria-pressed={range === i}
            onClick={() => setRange(i)}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              range === i ? "bg-brand-elevated text-brand-ink shadow-sm" : "text-brand-text-muted hover:text-brand-ink"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error ? <MessageBanner message={error} type="error" /> : null}
      {!data && !error ? <LoadingSpinner /> : null}

      {data ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="admin-stat-card">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">Promedio</p>
              <p className="mt-3 font-serif text-3xl text-brand-ink">{data.average ?? "—"}</p>
              {data.average ? <Stars value={data.average} /> : null}
            </div>
            <div className="admin-stat-card">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">Respondieron</p>
              <p className="mt-3 font-serif text-3xl text-brand-ink">{data.answered}</p>
              <p className="mt-2 text-xs text-brand-text-muted">
                de {data.sent} pedidas{data.sent ? ` (${Math.round((data.answered / data.sent) * 100)}%)` : ""}
              </p>
            </div>
            <div className="admin-stat-card">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">Fueron a Google</p>
              <p className="mt-3 font-serif text-3xl text-brand-ink">{data.reviewClicks}</p>
              <p className="mt-2 text-xs text-brand-text-muted">abrieron el link de reseña</p>
            </div>
            <div className="admin-stat-card">
              <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-brand-text-muted uppercase">Estrellas</p>
              {[5, 4, 3, 2, 1].map((n) => (
                <div key={n} className="flex items-center gap-2 text-xs text-brand-text-muted">
                  <span className="w-3 tabular-nums">{n}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-ink/[0.06]">
                    <span
                      className="block h-full rounded-full bg-amber-400"
                      style={{ width: `${(data.distribution[n - 1] / maxDist) * 100}%` }}
                    />
                  </span>
                  <span className="w-5 text-right tabular-nums">{data.distribution[n - 1]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
            <section className="admin-card !p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-ink/[0.06] px-5 py-4">
                <h2 className="font-serif text-xl text-brand-ink">Comentarios</h2>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-text-muted">
                  <input
                    type="checkbox"
                    checked={onlyLow}
                    onChange={(e) => setOnlyLow(e.target.checked)}
                    className="h-4 w-4 accent-[var(--brand-primary)]"
                  />
                  Solo 3 estrellas o menos
                </label>
              </div>
              {items.length === 0 ? (
                <p className="px-6 py-14 text-center text-sm text-brand-text-muted">
                  {data.answered === 0
                    ? "Todavía no hay respuestas en este período. Pedí la opinión desde una cita concluida o un ticket cobrado."
                    : "Nada por acá."}
                </p>
              ) : (
                <ul className="divide-y divide-brand-ink/[0.06]">
                  {items.map((i) => (
                    <li key={i.id} className={`px-5 py-4 ${i.rating <= 3 ? "bg-red-500/[0.04]" : ""}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Stars value={i.rating} />
                          <span className="font-medium text-brand-ink">{i.customerName ?? "Clienta"}</span>
                        </div>
                        <span className="text-xs text-brand-text-muted">{formatDate(i.answeredAt)}</span>
                      </div>
                      {i.comment ? <p className="mt-1.5 whitespace-pre-wrap text-sm text-brand-ink">{i.comment}</p> : null}
                      <p className="mt-1 text-xs text-brand-text-muted">
                        {[i.serviceNames, i.employeeName ? `con ${i.employeeName}` : null].filter(Boolean).join(" · ")}
                        {i.reviewClicked ? " · fue a Google" : ""}
                        {i.appointmentId ? (
                          <>
                            {" · "}
                            <Link href={`/s/${slug}/admin/appointments/${i.appointmentId}`} className="underline underline-offset-2">
                              ver cita
                            </Link>
                          </>
                        ) : i.orderId ? (
                          <>
                            {" · "}
                            <Link href={`/s/${slug}/admin/orders/${i.orderId}`} className="underline underline-offset-2">
                              ver ticket
                            </Link>
                          </>
                        ) : null}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="admin-card">
              <h2 className="mb-3 font-serif text-lg text-brand-ink">Por profesional</h2>
              {data.byEmployee.length === 0 ? (
                <p className="text-sm text-brand-text-muted">Sin datos todavía.</p>
              ) : (
                <ul className="space-y-2.5">
                  {data.byEmployee.map((e) => (
                    <li key={e.name} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-brand-ink">{e.name}</span>
                      <span className="flex items-center gap-1.5 text-brand-text-muted">
                        <Stars value={e.average} size={12} />
                        <span className="tabular-nums">
                          {e.average} ({e.count})
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
