"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Search,
  Sparkles,
} from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import {
  filterHelpArticles,
  HELP_ARTICLES,
  HELP_CATEGORIES,
  HELP_QUICK_START,
  tHelp,
  type HelpArticle,
  type HelpCategoryId,
  type HelpLocale,
} from "@/lib/help-manual";

const PROGRESS_KEY = "florece_help_progress";

function loadProgress(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveProgress(next: Record<string, boolean>) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function articleHref(slug: string, article: HelpArticle) {
  if (article.href == null) return null;
  return `/s/${slug}/admin${article.href}`;
}

export function HelpManual({ slug }: { slug: string }) {
  const { locale } = useLocale();
  const lang = (locale === "en" ? "en" : "es") as HelpLocale;
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategoryId | "all">("all");
  const [openId, setOpenId] = useState<string | null>(initialTopic);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProgress(loadProgress());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialTopic && HELP_ARTICLES.some((a) => a.id === initialTopic)) {
      setOpenId(initialTopic);
      const article = HELP_ARTICLES.find((a) => a.id === initialTopic);
      if (article) setCategory(article.category);
    }
  }, [initialTopic]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const articles = useMemo(
    () => filterHelpArticles(query, category),
    [query, category],
  );

  const doneCount = HELP_QUICK_START.filter((q) => progress[q.articleId]).length;
  const progressPct = Math.round((doneCount / HELP_QUICK_START.length) * 100);

  function toggleStepDone(articleId: string) {
    setProgress((prev) => {
      const next = { ...prev, [articleId]: !prev[articleId] };
      saveProgress(next);
      return next;
    });
  }

  function toggleArticle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-brand-ink/[0.06] bg-gradient-to-br from-[#f7f3ef] via-white to-[#efe6da] px-6 py-8 sm:px-10 sm:py-10">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-primary/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-brand-peach/40 blur-3xl"
          aria-hidden
        />
        <div
          className={`relative ${mounted ? "animate-[fade-up_0.5s_ease-out]" : "opacity-0"}`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
            <BookOpen size={14} />
            {lang === "es" ? "Manual Florece" : "Florece guide"}
          </div>
          <h1 className="mt-3 max-w-xl font-serif text-4xl leading-tight text-brand-ink sm:text-5xl">
            {lang === "es"
              ? "Todo lo que necesitás para operar tu salón"
              : "Everything you need to run your salon"}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-brand-text-muted sm:text-base">
            {lang === "es"
              ? "Buscá, explorá guías paso a paso y saltá directo a la pantalla correcta."
              : "Search, explore step-by-step guides, and jump straight to the right screen."}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block min-w-0 flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted"
              />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  lang === "es"
                    ? "Buscar: citas, caja, sucursales…"
                    : "Search: appointments, POS, branches…"
                }
                className="w-full rounded-2xl border border-brand-ink/10 bg-brand-elevated/90 py-3 pl-10 pr-16 text-sm text-brand-ink outline-none ring-brand-primary/30 transition focus:ring-2"
              />
              <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-brand-ink/10 bg-brand-mist px-1.5 py-0.5 text-[10px] font-semibold text-brand-text-muted sm:inline">
                ⌘K
              </kbd>
            </label>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-brand-ink">
              {lang === "es" ? "Inicio rápido" : "Quick start"}
            </h2>
            <p className="text-sm text-brand-text-muted">
              {lang === "es"
                ? "Marcá lo que ya configuraste."
                : "Check off what you’ve already set up."}
            </p>
          </div>
          <div className="min-w-[9rem]">
            <div className="mb-1 flex justify-between text-[11px] font-semibold text-brand-text-muted">
              <span>
                {doneCount}/{HELP_QUICK_START.length}
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-brand-ink/10">
              <div
                className="h-full rounded-full bg-brand-primary transition-[width] duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HELP_QUICK_START.map((item, index) => {
            const done = Boolean(progress[item.articleId]);
            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-brand-ink/[0.06] bg-brand-elevated/80 p-4 transition hover:border-brand-primary/40 hover:shadow-[0_12px_40px_-24px_rgba(22,20,18,0.35)]"
                style={{
                  animationDelay: `${index * 60}ms`,
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleStepDone(item.articleId)}
                  className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full border transition ${
                    done
                      ? "border-brand-primary bg-brand-primary text-brand-ink"
                      : "border-brand-ink/15 text-transparent hover:border-brand-primary"
                  }`}
                  aria-label={done ? "Completado" : "Marcar como hecho"}
                >
                  <Check size={16} strokeWidth={2.5} />
                </button>
                <h3 className="font-semibold text-brand-ink">
                  {tHelp(item.title, lang)}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-brand-text-muted">
                  {tHelp(item.description, lang)}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs font-semibold">
                  <Link
                    href={`/s/${slug}/admin${item.href}`}
                    className="inline-flex items-center gap-1 text-brand-ink transition group-hover:text-brand-primary-dark"
                  >
                    {lang === "es" ? "Ir" : "Open"}
                    <ArrowRight size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("all");
                      setQuery("");
                      setOpenId(item.articleId);
                      document
                        .getElementById(`help-${item.articleId}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="text-brand-text-muted hover:text-brand-ink"
                  >
                    {lang === "es" ? "Ver guía" : "Guide"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap gap-2">
          {HELP_CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-brand-ink text-white"
                    : "bg-brand-elevated/80 text-brand-text-muted ring-1 ring-brand-ink/10 hover:text-brand-ink"
                }`}
              >
                {tHelp(cat.label, lang)}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-ink/15 bg-brand-elevated/50 px-6 py-12 text-center">
              <CircleHelp className="mx-auto text-brand-text-muted" size={28} />
              <p className="mt-3 font-medium text-brand-ink">
                {lang === "es"
                  ? "No encontramos eso"
                  : "Nothing matched"}
              </p>
              <p className="mt-1 text-sm text-brand-text-muted">
                {lang === "es"
                  ? "Probá con “caja”, “citas” o “sucursales”."
                  : "Try “POS”, “appointments”, or “branches”."}
              </p>
            </div>
          ) : (
            articles.map((article, index) => {
              const open = openId === article.id;
              const href = articleHref(slug, article);
              return (
                <article
                  key={article.id}
                  id={`help-${article.id}`}
                  className="overflow-hidden rounded-2xl border border-brand-ink/[0.06] bg-brand-elevated/85 scroll-mt-28"
                  style={{
                    animation: mounted
                      ? `fade-up 0.45s ease-out ${Math.min(index, 8) * 40}ms both`
                      : undefined,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleArticle(article.id)}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-brand-mist/40"
                    aria-expanded={open}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-mist text-brand-primary-dark">
                      <Sparkles size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-brand-ink">
                        {tHelp(article.title, lang)}
                      </span>
                      <span className="mt-0.5 block text-sm text-brand-text-muted">
                        {tHelp(article.summary, lang)}
                      </span>
                    </span>
                    <ChevronDown
                      size={18}
                      className={`mt-1 shrink-0 text-brand-text-muted transition-transform duration-300 ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-brand-ink/[0.05] px-5 pb-5 pt-2">
                        {article.steps?.length ? (
                          <ol className="space-y-2.5">
                            {article.steps.map((step, i) => (
                              <li
                                key={i}
                                className="flex gap-3 text-sm text-brand-ink"
                              >
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-ink text-[11px] font-bold text-white">
                                  {i + 1}
                                </span>
                                <span className="leading-relaxed pt-0.5">
                                  {tHelp(step, lang)}
                                </span>
                              </li>
                            ))}
                          </ol>
                        ) : null}

                        {article.tips?.length ? (
                          <ul className="mt-4 space-y-2 rounded-xl bg-brand-mist/70 px-4 py-3">
                            {article.tips.map((tip, i) => (
                              <li
                                key={i}
                                className="text-sm leading-relaxed text-brand-text-muted"
                              >
                                <span className="font-semibold text-brand-primary-dark">
                                  Tip:{" "}
                                </span>
                                {tHelp(tip, lang)}
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {href ? (
                          <Link
                            href={href}
                            className="btn-primary mt-5 inline-flex items-center gap-2"
                          >
                            {lang === "es"
                              ? "Abrir en el panel"
                              : "Open in panel"}
                            <ArrowRight size={16} />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
