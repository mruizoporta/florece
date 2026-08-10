"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
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

function welcomeText(context: AssistantContext, locale: HelpLocale): string {
  if (locale === "en") {
    if (context === "landing") {
      return "Hi! I’m the Florece assistant. Ask about plans, trial, or payments — or pick a suggestion.";
    }
    if (context === "salon") {
      return "Hi! I can help with booking, services, hours, and contact. Pick a question or type one.";
    }
    return "Hi! Ask me about appointments, POS, catalog, or billing.";
  }
  if (context === "landing") {
    return "¡Hola! Soy el asistente de Florece. Preguntame por planes, prueba o pagos — o elegí una sugerencia.";
  }
  if (context === "salon") {
    return "¡Hola! Te ayudo con citas, servicios, horarios y contacto. Elegí una pregunta o escribí la tuya.";
  }
  return "¡Hola! Preguntame por citas, caja, catálogo o facturación.";
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
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () => assistantSuggestions(context, helpLocale),
    [context, helpLocale],
  );

  const waHref =
    whatsappUrl ||
    (context === "salon" ? undefined : SITE.whatsappUrl);

  useEffect(() => {
    if (!open) return;
    setMessages((prev) => {
      const welcome = welcomeText(context, helpLocale);
      if (prev.length === 0) {
        return [{ id: uid(), role: "bot", text: welcome }];
      }
      // Refresh the first welcome bubble when locale changes.
      if (prev[0]?.role === "bot" && prev.length === 1) {
        return [{ ...prev[0], text: welcome }];
      }
      return prev;
    });
  }, [open, context, helpLocale]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  function replyFor(query: string) {
    const matches = matchAssistantEntries(query, context, 1);
    const best = matches[0];
    if (!best || best.score < 4) {
      const fallback =
        helpLocale === "en"
          ? "I don’t have that answer yet. Try another question or message us on WhatsApp."
          : "No tengo esa respuesta todavía. Probá otra pregunta o escribinos por WhatsApp.";
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
    // slight delay for feel
    window.setTimeout(() => replyFor(q), 180);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  const position = offsetRight
    ? "right-20 bottom-6 sm:right-24"
    : "right-5 bottom-5";

  return (
    <div className={`fixed z-[60] ${position} ${className}`}>
      {open ? (
        <div className="mb-3 flex h-[min(32rem,70vh)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-black/10 bg-[#161412] text-[#f3efe9] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles size={14} className="text-[#c4a574]" />
                {tr("assistant.title")}
              </p>
              <p className="truncate text-[11px] text-white/45">
                {tr("assistant.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/70 transition hover:bg-white/12"
              aria-label={tr("assistant.close")}
            >
              <X size={16} />
            </button>
          </div>

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
                  {msg.entry && context === "salon" && slug && msg.entry.id === "salon-book" ? (
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
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold text-[#25D366] transition hover:bg-white/5"
              >
                <MessageCircle size={14} />
                {tr("assistant.whatsapp")}
              </a>
            ) : null}
          </div>
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
