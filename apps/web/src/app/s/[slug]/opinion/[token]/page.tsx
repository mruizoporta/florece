"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Heart, Star } from "lucide-react";
import { api } from "@/lib/api";

type FeedbackView = {
  salonName: string;
  salonSlug: string;
  firstName: string | null;
  employeeName: string | null;
  serviceNames: string | null;
  answered: boolean;
  rating: number | null;
  googleReviewUrl: string | null;
};

const LABELS = ["", "Muy mal", "Mal", "Regular", "Bien", "¡Excelente!"];

export default function FeedbackPage() {
  const params = useParams();
  const token = params.token as string;
  const [view, setView] = useState<FeedbackView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api<FeedbackView>(`/public/feedback/${encodeURIComponent(token)}`)
      .then(setView)
      .catch(() => setError("Este enlace no existe o ya no está disponible."));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setSending(true);
    setError(null);
    try {
      setView(
        await api<FeedbackView>(`/public/feedback/${encodeURIComponent(token)}`, {
          method: "POST",
          body: { rating, comment },
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setSending(false);
    }
  }

  function openReview() {
    void api(`/public/feedback/${encodeURIComponent(token)}/review-click`, { method: "POST" }).catch(() => undefined);
  }

  const shown = hover || rating;

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-warm px-4 py-10">
      <div className="w-full max-w-md rounded-[1.75rem] bg-brand-elevated p-7 text-center shadow-sm">
        {!view ? (
          <p className="text-sm text-brand-text-muted">{error ?? "Cargando…"}</p>
        ) : view.answered ? (
          <>
            <Heart size={34} className="mx-auto text-brand-primary" fill="currentColor" />
            <h1 className="mt-4 font-serif text-3xl text-brand-ink">¡Gracias{view.firstName ? `, ${view.firstName}` : ""}!</h1>
            {view.googleReviewUrl ? (
              <>
                <p className="mt-3 text-brand-text-muted">
                  Nos alegra que te haya gustado. ¿Nos ayudás contándolo en Google? A otras clientas les sirve mucho.
                </p>
                <a
                  href={view.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={openReview}
                  className="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2 !py-3.5"
                >
                  <Star size={17} fill="currentColor" />
                  Dejar reseña en Google
                </a>
              </>
            ) : (
              <p className="mt-3 text-brand-text-muted">
                {view.rating != null && view.rating <= 3
                  ? `Lamentamos que no haya sido como esperabas. Tu comentario le llega directo a ${view.salonName} para mejorar.`
                  : `Tu opinión le llega directo a ${view.salonName}.`}
              </p>
            )}
          </>
        ) : (
          <form onSubmit={submit}>
            <p className="text-xs font-semibold tracking-[0.14em] text-brand-text-muted uppercase">{view.salonName}</p>
            <h1 className="mt-3 font-serif text-3xl text-brand-ink">
              {view.firstName ? `${view.firstName}, ¿cómo` : "¿Cómo"} te fue?
            </h1>
            {view.serviceNames || view.employeeName ? (
              <p className="mt-2 text-sm text-brand-text-muted">
                {view.serviceNames}
                {view.serviceNames && view.employeeName ? " · " : ""}
                {view.employeeName ? `con ${view.employeeName}` : ""}
              </p>
            ) : null}

            <div className="mt-6 flex justify-center gap-1.5" role="radiogroup" aria-label="Calificación" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} estrella${n === 1 ? "" : "s"}: ${LABELS[n]}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  className="p-1 transition hover:scale-110"
                >
                  <Star
                    size={38}
                    className={n <= shown ? "text-amber-400" : "text-brand-ink/15"}
                    fill="currentColor"
                    strokeWidth={1.2}
                  />
                </button>
              ))}
            </div>
            <p className="mt-1 h-5 text-sm font-medium text-brand-ink" aria-live="polite">
              {LABELS[shown]}
            </p>

            {rating ? (
              <>
                <label htmlFor="fb-comment" className="sr-only">
                  Comentario
                </label>
                <textarea
                  id="fb-comment"
                  className="input-field mt-4 min-h-[6rem] text-sm"
                  placeholder={rating <= 3 ? "¿Qué podemos mejorar? (opcional)" : "¿Algo que quieras contarnos? (opcional)"}
                  value={comment}
                  maxLength={2000}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button type="submit" className="btn-primary mt-4 w-full !py-3.5" disabled={sending}>
                  {sending ? "Enviando…" : "Enviar"}
                </button>
              </>
            ) : null}
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          </form>
        )}
      </div>
    </main>
  );
}
