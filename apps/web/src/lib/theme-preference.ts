export const THEME_STORAGE_KEY = "florece_theme";

export type ThemePreference = "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark";
}

/** Default is always light; ignore OS and legacy "system". */
export function getStoredThemePreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "dark") return "dark";
    if (raw === "light") return "light";
  } catch {
    // ignore
  }
  return "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference;
}

export function applyResolvedTheme(resolved: ResolvedTheme) {
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}
