import { color } from '../theme';

/** Colores con los que se pinta un salón en la app (Florece por defecto). */
export type SalonTheme = {
  hero: string;
  heroText: string;
  heroMuted: string;
  accentOnHero: string;
  accent: string;
  button: string;
  buttonText: string;
  custom: boolean;
};

export const FLORECE_THEME: SalonTheme = {
  hero: color.ink,
  heroText: color.cream,
  heroMuted: '#b5afa8',
  accentOnHero: color.gold,
  accent: color.goldDeep,
  button: color.gold,
  buttonText: color.ink,
  custom: false,
};

export type BrandSetting = {
  logo?: string | null;
  banner?: string | null;
  buttonsBackgroundColor?: string | null;
  buttonsTextColor?: string | null;
  titlesColor?: string | null;
  iconsColor?: string | null;
  footerBackgroundColor?: string | null;
  footerTextColor?: string | null;
};

// shortcut: todos los salones heredaron estos colores de fábrica; mientras nadie los cambie se usa Florece.
// Si algún día se quieren esos colores a propósito, agregar un interruptor «usar mis colores en la app».
const DE_FABRICA = { buttons: 'ff8585', icons: 'ff8585', titles: 'ff8585', footer: '283747' };

function hex(value?: string | null): string | null {
  const raw = value?.trim().replace(/^#/, '').toLowerCase() ?? '';
  if (/^[0-9a-f]{3}$/.test(raw)) return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`;
  if (/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(raw)) return `#${raw.slice(0, 6)}`;
  return null;
}

function rgb(h: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminancia(h: string): number {
  const [r, g, b] = rgb(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

function mezclar(h: string, con: string, t: number): string {
  const [a, b] = [rgb(h), rgb(con)];
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Oscurece o aclara `fg` hasta que se lea sobre `bg`. */
export function legible(fg: string, bg: string, minimo = 4.5): string {
  if (contraste(fg, bg) >= minimo) return fg;
  const hacia = luminancia(bg) > 0.4 ? '#000000' : '#ffffff';
  for (let t = 0.1; t <= 1; t += 0.1) {
    const candidato = mezclar(fg, hacia, t);
    if (contraste(candidato, bg) >= minimo) return candidato;
  }
  return hacia;
}

export function temaDe(setting?: BrandSetting | null): SalonTheme {
  if (!setting) return FLORECE_THEME;
  const buttons = hex(setting.buttonsBackgroundColor);
  const icons = hex(setting.iconsColor);
  const footer = hex(setting.footerBackgroundColor);
  const deFabrica =
    buttons === `#${DE_FABRICA.buttons}` &&
    icons === `#${DE_FABRICA.icons}` &&
    hex(setting.titlesColor) === `#${DE_FABRICA.titles}` &&
    footer === `#${DE_FABRICA.footer}`;
  if (deFabrica || (!buttons && !icons && !footer)) return FLORECE_THEME;

  const hero = footer ?? FLORECE_THEME.hero;
  const heroOscuro = luminancia(hero) < 0.4;
  const heroText = legible(hex(setting.footerTextColor) ?? (heroOscuro ? color.cream : color.ink), hero);
  const acento = icons ?? buttons ?? FLORECE_THEME.accentOnHero;
  const button = buttons ?? FLORECE_THEME.button;
  const buttonTextPedido = hex(setting.buttonsTextColor);
  const buttonText =
    buttonTextPedido && contraste(buttonTextPedido, button) >= 3
      ? buttonTextPedido
      : contraste('#ffffff', button) >= contraste(color.ink, button)
        ? '#ffffff'
        : color.ink;

  return {
    hero,
    heroText,
    heroMuted: mezclar(heroText, hero, 0.35),
    accentOnHero: legible(acento, hero, 3),
    accent: legible(acento, color.base, 4.5),
    button,
    buttonText,
    custom: true,
  };
}
