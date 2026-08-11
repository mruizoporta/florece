"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  LifeBuoy,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  assistantSuggestions,
  matchAssistantEntries,
  tHelp,
  type AssistantContext,
  type AssistantEntry,
} from "@/lib/assistant-kb";
import { useLocale } from "@/components/LocaleProvider";
import type { HelpLocale } from "@/lib/help-manual";
import { SITE } from "@/lib/site";
import { api, ApiError } from "@/lib/api";

type ChatMsg = {
  id: string;
  role: "user" | "bot";
  text: string;
  entry?: AssistantEntry;
};

type Props = {
  context: AssistantContext;
  /** Salon slug for admin deep-links / public booking */
  slug?: string;
  /** Tenant WhatsApp digits or full wa.me URL for salon context */
  whatsappUrl?: string;
  /** Offset when another FAB sits on the right (e.g. salon WA) */
  offsetRight?: boolean;
  className?: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function welcomeText(
  context: AssistantContext,
  locale: HelpLocale,
  supportReady: boolean,
): string {
  if (locale === "en") {
    if (context === "landing") {
      return supportReady
        ? "Hi! I’m the Florece assistant. Ask about plans, trial, or payments — or open a support ticket."
        : "Hi! I’m the Florece assistant. Ask about plans, trial, stylist floor, or payments — or pick a suggestion.";
    }
    if (context === "salon") {
      return "Hi! I can help with booking, services, hours, and contact. Pick a question or type one.";
    }
    return supportReady
      ? "Hi! Ask about appointments, POS, commissions, or billing — or open a support ticket."
      : "Hi! Ask me about appointments, POS, stylist floor, commissions, or billing.";
  }
  if (context === "landing") {
    return supportReady
      ? "¡Hola! Soy el asistente de Florece. Preguntame por planes o prueba — o abrí un ticket de soporte."
      : "¡Hola! Soy el asistente de Florece. Preguntame por planes, prueba, piso del estilista o pagos — o elegí una sugerencia.";
  }
  if (context === "salon") {
    return "¡Hola! Te ayudo con citas, servicios, horarios y contacto. Elegí una pregunta o escribí la tuya.";
  }
  return supportReady
    ? "¡Hola! Preguntame por citas, caja o facturación — o abrí un ticket de soporte."
    : "¡Hola! Preguntame por citas, caja, piso del estilista, comisiones o facturación.";
}

/** Tickets de producto Florece: landing (público) y admin (logueado). No en sitio público del salón. */
function ticketsEnabled(context: AssistantContext) {
  return context === "landing" || context === "admin";
}

export function HelpAssistant({
  context,
  slug,
  whatsappUrl,
  offsetRight = false,
  className = "",
}: Props) {
  const { locale, tr } = useLocale();
  const helpLocale: HelpLocale = locale === "en" ? "en" : "es";
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "ticket">("chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [supportReady, setSupportReady] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketBody, setTicketBody] = useState("");
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketBusy, setTicketBusy] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const publicTicket = context === "landing";
  const canTicket = ticketsEnabled(context);

  const suggestions = useMemo(
    () => assistantSuggestions(context, helpLocale),
    [context, helpLocale],
  );

  const waHref =
    whatsappUrl ||
    (context === "salon" ? undefined : SITE.whatsappUrl);

  useEffect(() => {
    if (!open || !canTicket) return;
    api<{ configured: boolean }>("/support/status")
      .then((r) => setSupportReady(Boolean(r?.configured)))
      .catch(() => setSupportReady(false));
  }, [open, canTicket]);

  useEffect(() => {
    if (!open) return;
    setMessages((prev) => {
      const welcome = welcomeText(context, helpLocale, supportReady);
      if (prev.length === 0) {
        return [{ id: uid(), role: "bot", text: welcome }];
      }
      if (prev[0]?.role === "bot" && prev.length === 1) {
        return [{ ...prev[0], text: welcome }];
      }
      return prev;
    });
  }, [open, context, helpLocale, supportReady]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open, mode]);

  function replyFor(query: string) {
    const matches = matchAssistantEntries(query, context, 1);
    const best = matches[0];
    if (!best || best.score < 4) {
      const fallback =
        helpLocale === "en"
          ? supportReady && canTicket
            ? "I don’t have that answer yet. Open a support ticket or message us on WhatsApp."
            : "I don’t have that answer yet. Try another question or message us on WhatsApp."
          : supportReady && canTicket
            ? "No tengo esa respuesta todavía. Podés abrir un ticket de soporte o escribir por WhatsApp."
            : "No tengo esa respuesta todavía. Probá otra pregunta o escribinos por WhatsApp.";
      setTicketSubject(query.slice(0, 120));
      setMessages((m) => [
        ...m,
        { id: uid(), role: "bot", text: fallback },
      ]);
      return;
    }
    setMessages((m) => [
      ...m,
      {
        id: uid(),
        role: "bot",
        text: tHelp(best.entry.answer, helpLocale),
        entry: best.entry,
      },
    ]);
  }

  function ask(text: string) {
    const q = text.trim();
    if (!q) return;
    setMessages((m) => [...m, { id: uid(), role: "user", text: q }]);
    setInput("");
    window.setTimeout(() => replyFor(q), 180);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  async function submitTicket(e: FormEvent) {
    e.preventDefault();
    setTicketError("");
    setTicketBusy(true);
    try {
      const payload = {
        subject: ticketSubject.trim(),
        body: ticketBody.trim(),
        priority: "NORMAL" as const,
      };
      const data = publicTicket
        ? await api<{ number?: string; ticket?: { number?: string } }>(
            "/support/tickets/public",
            {
              method: "POST",
              body: {
                ...payload,
                name: ticketName.trim(),
                email: ticketEmail.trim(),
              },
            },
          )
        : await api<{ number?: string; ticket?: { number?: string } }>(
            "/support/tickets",
            { method: "POST", auth: true, body: payload },
          );
      const num = data?.number ?? data?.ticket?.number;
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "bot",
          text: num
            ? tr("assistant.ticketOk").replace("{num}", String(num))
            : tr("assistant.ticketOkGeneric"),
        },
      ]);
      setTicketSubject("");
      setTicketBody("");
      setTicketName("");
      setTicketEmail("");
      setMode("chat");
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : tr("assistant.ticketError");
      setTicketError(msg);
    } finally {
      setTicketBusy(false);
    }
  }

  const position = offsetRight
    ? "right-20 bottom-6 sm:right-24"
    : "right-5 bottom-5";

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#c4a574]/50";

  return (
    <div className={`fixed z-[60] ${position} ${className}`}>
      {open ? (
        <div className="mb-3 flex h-[min(32rem,70vh)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-black/10 bg-[#161412] text-[#f3efe9] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles size={14} className="text-[#c4a574]" />
                {mode === "ticket"
                  ? tr("assistant.ticketTitle")
                  : tr("assistant.title")}
              </p>
              <p className="truncate text-[11px] text-white/45">
                {mode === "ticket"
                  ? tr("assistant.ticketSubtitle")
                  : tr("assistant.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setMode("chat");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/70 transition hover:bg-white/12"
              aria-label={tr("assistant.close")}
            >
              <X size={16} />
            </button>
          </div>

          {mode === "ticket" ? (
            <form
              onSubmit={submitTicket}
              className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3"
            >
              <p className="text-[12px] leading-relaxed text-white/55">
                {publicTicket
                  ? tr("assistant.ticketHintPublic")
                  : tr("assistant.ticketHintAuth")}
              </p>
              {publicTicket ? (
                <>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/40">
                      {tr("assistant.ticketName")}
                    </label>
                    <input
                      required
                      value={ticketName}
                      onChange={(e) => setTicketName(e.target.value)}
                      className={inputClass}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/40">
                      {tr("assistant.ticketEmail")}
                    </label>
                    <input
                      required
                      type="email"
                      value={ticketEmail}
                      onChange={(e) => setTicketEmail(e.target.value)}
                      className={inputClass}
                      autoComplete="email"
                    />
                  </div>
                </>
              ) : null}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/40">
                  {tr("assistant.ticketSubject")}
                </label>
                <input
                  required
                  minLength={3}
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/40">
                  {tr("assistant.ticketBody")}
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={5}
                  value={ticketBody}
                  onChange={(e) => setTicketBody(e.target.value)}
                  className={`${inputClass} min-h-[7rem] resize-none`}
                />
              </div>
              {ticketError ? (
                <p className="text-xs font-medium text-rose-300">{ticketError}</p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("chat")}
                  className="rounded-xl border border-white/15 px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/5"
                >
                  {tr("assistant.ticketBack")}
                </button>
                <button
                  type="submit"
                  disabled={ticketBusy || !supportReady}
                  className="flex-1 rounded-xl bg-[#c4a574] px-3 py-2.5 text-sm font-semibold text-[#161412] transition hover:brightness-105 disabled:opacity-50"
                >
                  {ticketBusy
                    ? tr("assistant.ticketSending")
                    : tr("assistant.ticketSend")}
                </button>
              </div>
              {!supportReady ? (
                <p className="text-[11px] text-white/45">
                  {tr("assistant.supportUnavailable")}
                </p>
              ) : null}
            </form>
          ) : (
            <>
              <div
                ref={listRef}
                className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-[#c4a574] text-[#161412]"
                          : "bg-white/8 text-white/90"
                      }`}
                    >
                      {msg.text}
                      {msg.entry && context === "admin" && slug ? (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {msg.entry.helpTopic ? (
                            <Link
                              href={`/s/${slug}/admin/help?topic=${msg.entry.helpTopic}`}
                              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-[#c4a574] transition hover:bg-white/15"
                              onClick={() => setOpen(false)}
                            >
                              {tr("assistant.openGuide")}
                              <ArrowUpRight size={12} />
                            </Link>
                          ) : null}
                          {msg.entry.adminHref ? (
                            <Link
                              href={`/s/${slug}/admin${msg.entry.adminHref}`}
                              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/15"
                              onClick={() => setOpen(false)}
                            >
                              {tr("assistant.openPanel")}
                              <ArrowUpRight size={12} />
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                      {msg.entry &&
                      context === "salon" &&
                      slug &&
                      msg.entry.id === "salon-book" ? (
                        <div className="mt-2.5">
                          <Link
                            href={`/s/${slug}/agendar`}
                            className="inline-flex items-center gap-1 rounded-full bg-[#c4a574] px-2.5 py-1 text-[11px] font-semibold text-[#161412]"
                            onClick={() => setOpen(false)}
                          >
                            {tr("salon.book")}
                            <ArrowUpRight size={12} />
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {messages.length <= 1 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => ask(s.label)}
                        className="rounded-full border border-white/12 bg-white/5 px-2.5 py-1.5 text-left text-[11px] font-medium text-white/75 transition hover:border-[#c4a574]/40 hover:text-white"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="border-t border-white/10 p-3">
                <form onSubmit={onSubmit} className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={tr("assistant.placeholder")}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#c4a574]/50"
                  />
                  <button
                    type="submit"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c4a574] text-[#161412] transition hover:brightness-105"
                    aria-label={tr("assistant.send")}
                  >
                    <Send size={16} />
                  </button>
                </form>
                <div className="mt-2 flex flex-col gap-1">
                  {supportReady && canTicket ? (
                    <button
                      type="button"
                      onClick={() => setMode("ticket")}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold text-[#c4a574] transition hover:bg-white/5"
                    >
                      <LifeBuoy size={14} />
                      {tr("assistant.ticketOpen")}
                    </button>
                  ) : null}
                  {waHref ? (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold text-[#25D366] transition hover:bg-white/5"
                    >
                      <MessageCircle size={14} />
                      {tr("assistant.whatsapp")}
                    </a>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#161412] text-[#c4a574] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)] ring-1 ring-white/10 transition hover:scale-105"
        aria-label={open ? tr("assistant.close") : tr("assistant.open")}
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>
    </div>
  );
}
