"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Locale, toggleLocale, t, type I18nKey } from "@/lib/i18n";

const STORAGE_KEY = "florece_locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggle: () => void;
  tr: (key: I18nKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "en" || raw === "es") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredLocale(locale: Locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function LocaleProvider({
  children,
  initialLocale = "es",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored && stored !== locale) {
      setLocaleState(stored);
    }
    setReady(true);
    // Only hydrate from storage once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeStoredLocale(locale);
    document.documentElement.lang = locale;
  }, [locale, ready]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const toggle = useCallback(() => {
    setLocaleState((prev) => toggleLocale(prev));
  }, []);

  const tr = useCallback((key: I18nKey) => t(locale, key), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, toggle, tr }),
    [locale, setLocale, toggle, tr],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useOptionalLocale() {
  return useContext(LocaleContext);
}
