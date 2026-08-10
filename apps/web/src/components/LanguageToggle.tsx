"use client";

import { useLocale } from "./LocaleProvider";

export function LanguageToggle({
  className = "admin-header-action admin-header-icon",
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "onDark";
}) {
  const { locale, toggle } = useLocale();
  const next = locale === "es" ? "EN" : "ES";
  const label =
    locale === "es" ? "Switch to English" : "Cambiar a español";

  const toneClass =
    tone === "onDark"
      ? "inline-flex h-9 min-w-9 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-2 text-[11px] font-bold tracking-wide text-white transition hover:bg-white/15"
      : className;

  return (
    <button
      type="button"
      onClick={toggle}
      className={toneClass}
      title={label}
      aria-label={label}
    >
      {next}
    </button>
  );
}
