import { moneyLocaleForSymbol, normalizeWaDigits } from '@florece/shared';
import { formatWallClock, salonDayBounds, salonTodayYmd, salonWallClockNow } from './date';

describe('salon calendar', () => {
  it('uses Santo Domingo for DO and Managua for NI around midnight', () => {
    // 05:30 UTC = 01:30 in Santo Domingo and 23:30 the previous day in Managua
    const now = new Date('2026-10-31T05:30:00.000Z');
    expect(salonTodayYmd(now, 'NI')).toBe('2026-10-30');
    expect(salonTodayYmd(now, 'DO')).toBe('2026-10-31');
    expect(salonTodayYmd(now)).toBe('2026-10-30');
  });

  it('bounds a DO day at UTC−4 and an NI day at UTC−6', () => {
    expect(salonDayBounds('2026-10-30', 'DO').start.toISOString()).toBe(
      '2026-10-30T04:00:00.000Z',
    );
    expect(salonDayBounds('2026-10-30', 'NI').start.toISOString()).toBe(
      '2026-10-30T06:00:00.000Z',
    );
    expect(salonDayBounds('2026-10-30').start.toISOString()).toBe(
      '2026-10-30T06:00:00.000Z',
    );
  });
});

describe('normalizeWaDigits', () => {
  it('prefixes Nicaragua local numbers and Dominican 10-digit numbers', () => {
    expect(normalizeWaDigits('8888 1234')).toBe('50588881234');
    expect(normalizeWaDigits('8095551234')).toBe('18095551234');
    expect(normalizeWaDigits('+1 809 555 1234')).toBe('18095551234');
    expect(normalizeWaDigits('50588881234')).toBe('50588881234');
  });
});

describe('moneyLocaleForSymbol', () => {
  it('formats Dominican pesos with es-DO and cordobas with es-NI', () => {
    expect(moneyLocaleForSymbol('RD$')).toBe('es-DO');
    expect(moneyLocaleForSymbol('C$')).toBe('es-NI');
    expect(Number(1500).toLocaleString(moneyLocaleForSymbol('RD$'))).toBe(
      '1,500',
    );
  });
});

describe('salon wall clock', () => {
  it('turns real UTC into the salon local time stored on appointments', () => {
    const now = new Date('2026-10-31T05:30:00.000Z');
    expect(salonWallClockNow(now, 'NI').toISOString()).toBe('2026-10-30T23:30:00.000Z');
    expect(salonWallClockNow(now, 'DO').toISOString()).toBe('2026-10-31T01:30:00.000Z');
  });

  it('shows the stored hour as is', () => {
    expect(formatWallClock(new Date('2026-11-06T11:00:00.000Z'))).toContain('11:00');
  });
});
