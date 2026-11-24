export const BILLING_REGIONS = ['NI', 'US', 'DO'] as const;
export type BillingRegion = (typeof BILLING_REGIONS)[number];

export type Market = {
  region: BillingRegion;
  label: string;
  timeZone: string;
  /** Offset used to bound a salon calendar day. Appointments are stored as wall-clock UTC. */
  utcOffset: string;
  currencySymbol: string;
  moneyLocale: string;
  /** Digits prepended to a local phone (NI 8 digits). */
  phoneCountry: string;
};

const NICARAGUA: Market = {
  region: 'NI',
  label: 'Nicaragua',
  timeZone: 'America/Managua',
  utcOffset: '-06:00',
  currencySymbol: 'C$',
  moneyLocale: 'es-NI',
  phoneCountry: '505',
};

/**
 * shortcut: US keeps the Nicaragua clock, upgrade when a US salon needs its own zone.
 * DO is America/Santo_Domingo (UTC−4, no DST).
 */
export function marketForRegion(region?: string | null): Market {
  switch ((region ?? '').toUpperCase()) {
    case 'DO':
      return {
        region: 'DO',
        label: 'República Dominicana',
        timeZone: 'America/Santo_Domingo',
        utcOffset: '-04:00',
        currencySymbol: 'RD$',
        moneyLocale: 'es-DO',
        phoneCountry: '1',
      };
    case 'US':
      return {
        ...NICARAGUA,
        region: 'US',
        label: 'Estados Unidos',
        currencySymbol: '$',
        moneyLocale: 'en-US',
        phoneCountry: '1',
      };
    default:
      return NICARAGUA;
  }
}

/** es-DO uses comma thousands and a dot decimal (RD$1,500.00). */
export function moneyLocaleForSymbol(symbol?: string | null): string {
  const s = (symbol ?? '').trim().toUpperCase();
  if (s.startsWith('RD') || s === 'DOP') return 'es-DO';
  if (s === '$' || s === 'USD' || s === 'US$') return 'en-US';
  return 'es-NI';
}

export function timeZoneForSymbol(symbol?: string | null): string {
  return moneyLocaleForSymbol(symbol) === 'es-DO'
    ? marketForRegion('DO').timeZone
    : marketForRegion('NI').timeZone;
}

/**
 * Digits for wa.me.
 * 8 digits → Nicaragua (+505). 10 digits → NANP (+1), which covers 809/829/849.
 */
export function normalizeWaDigits(
  raw?: string | null,
  defaultCountry = '505',
): string | null {
  if (!raw?.trim()) return null;
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 8) digits = `${defaultCountry}${digits}`;
  else if (digits.length === 10) digits = `1${digits}`;
  if (digits.length < 10) return null;
  return digits;
}
