import { marketForRegion, moneyLocaleForSymbol } from '@florece/shared';

export function hoyEn(timeZone: string, now = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone });
}

export function proximosDias(
  cantidad = 14,
  timeZone = 'America/Managua',
  utcOffset = '-06:00',
): { ymd: string; label: string }[] {
  const inicio = new Date(`${hoyEn(timeZone)}T12:00:00${utcOffset}`);
  return Array.from({ length: cantidad }, (_, index) => {
    const fecha = new Date(inicio.getTime() + index * 86_400_000);
    return {
      ymd: fecha.toLocaleDateString('en-CA', { timeZone }),
      label: fecha.toLocaleDateString('es', {
        timeZone,
        weekday: 'short',
        day: 'numeric',
      }),
    };
  });
}

export function fechaLarga(
  isoOrYmd: string | null,
  timeZone = 'America/Managua',
  utcOffset = '-06:00',
): string {
  if (!isoOrYmd) return '';
  const ymd = isoOrYmd.slice(0, 10);
  const fecha = new Date(`${ymd}T12:00:00${utcOffset}`);
  return fecha.toLocaleDateString('es', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function horaDe(valor: string | null): string {
  if (!valor) return '';
  if (valor.includes('T')) return valor.slice(11, 16);
  return valor.slice(0, 5);
}

export function dinero(symbol: string, price: number): string {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return '—';
  if (moneyLocaleForSymbol(symbol) === 'es-DO') {
    return `${symbol}${amount.toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${symbol}${amount.toFixed(0)}`;
}

export function mercadoDe(symbol?: string | null) {
  return marketForRegion(
    moneyLocaleForSymbol(symbol) === 'es-DO' ? 'DO' : 'NI',
  );
}
