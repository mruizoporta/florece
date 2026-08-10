import type { TenantSetting } from "./types";

/** Normalize stored color (`ff8585` or `#ff8585`) to `#rrggbb`. */
export function toCssColor(
  value?: string | null,
  fallback = "#ffd200",
): string {
  if (!value) return fallback;
  const raw = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{8}$/.test(raw)) {
    return `#${raw.slice(0, 6).toLowerCase()}`;
  }
  return fallback;
}

/** Store without `#` to match legacy DB defaults. */
export function toStoredColor(value: string): string {
  return value.trim().replace(/^#/, "").toLowerCase();
}

export type SalonThemeVars = {
  accent: string;
  accentText: string;
  title: string;
  icon: string;
  footerBg: string;
  footerText: string;
  whatsappBg: string;
  whatsappText: string;
};

export function salonThemeFromSetting(setting: TenantSetting): SalonThemeVars {
  return {
    accent: toCssColor(setting.buttonsBackgroundColor, "#ffd200"),
    accentText: toCssColor(setting.buttonsTextColor, "#1d1f24"),
    title: toCssColor(setting.titlesColor, "#1d1f24"),
    icon: toCssColor(setting.iconsColor, "#c49a7c"),
    footerBg: toCssColor(setting.footerBackgroundColor, "#1d1f24"),
    footerText: toCssColor(setting.footerTextColor, "#ffffff"),
    whatsappBg: toCssColor(setting.btnWhatsappBackgroundColor, "#128c7e"),
    whatsappText: toCssColor(setting.btnWhatsappTextColor, "#ffffff"),
  };
}

export function salonThemeStyle(
  theme: SalonThemeVars,
): Record<string, string> {
  return {
    "--salon-accent": theme.accent,
    "--salon-accent-text": theme.accentText,
    "--salon-title": theme.title,
    "--salon-icon": theme.icon,
    "--salon-footer-bg": theme.footerBg,
    "--salon-footer-text": theme.footerText,
    "--salon-wa-bg": theme.whatsappBg,
    "--salon-wa-text": theme.whatsappText,
  };
}
