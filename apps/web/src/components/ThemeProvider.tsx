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
import {
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  getStoredThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme-preference";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  cyclePreference: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  preference: "light",
  resolved: "light",
  setPreference: () => {},
  cyclePreference: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("light");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = getStoredThemePreference();
    setPreferenceState(stored);
    const next = resolveTheme(stored);
    setResolved(next);
    applyResolvedTheme(next);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    const resolvedNext = resolveTheme(next);
    setResolved(resolvedNext);
    applyResolvedTheme(resolvedNext);
  }, []);

  const cyclePreference = useCallback(() => {
    setPreferenceState((prev) => {
      const next: ThemePreference = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      const resolvedNext = resolveTheme(next);
      setResolved(resolvedNext);
      applyResolvedTheme(resolvedNext);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference, cyclePreference }),
    [preference, resolved, setPreference, cyclePreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
