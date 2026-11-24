import { computeDiscounts, EngineDiscount, promoBlockedBy } from './discount-engine';

const all = { appliesTo: 'all' as const, itemIds: [] };
const lines = [
  { id: 'a', isProduct: false, itemId: '20', gross: 30000, packageDiscount: 0 },
  { id: 'b', isProduct: true, itemId: '50', gross: 10000, packageDiscount: 0 },
];
const d = (x: Partial<EngineDiscount>): EngineDiscount =>
  ({ key: 'k', source: 'auto', label: 'P', discountType: 'percent', value: 10, rules: all, ...x }) as EngineDiscount;

describe('computeDiscounts', () => {
  it('reparte un porcentaje entre las líneas', () => {
    const r = computeDiscounts(lines, [d({})], { stackPromotions: false });
    expect(r.amounts.k.amount).toBe(4000);
    expect(r.perLine).toEqual({ a: 3000, b: 1000 });
    expect(r.total).toBe(36000);
  });
  it('solo servicios y no toca líneas de paquete', () => {
    const r = computeDiscounts(
      [...lines, { id: 'c', isProduct: false, itemId: '20', gross: 30000, packageDiscount: 5000 }],
      [d({ rules: { appliesTo: 'services', itemIds: [] } })],
      { stackPromotions: false },
    );
    expect(r.perLine).toEqual({ a: 3000, b: 0, c: 0 });
  });
  it('sin combinar gana la mayor; la manual siempre suma', () => {
    const r = computeDiscounts(
      lines,
      [d({ key: 'auto' }), d({ key: 'cup', source: 'coupon', value: 25 }), d({ key: 'man', source: 'manual', discountType: 'amount', value: 1000 })],
      { stackPromotions: false },
    );
    expect(r.amounts.auto).toEqual({ amount: 0, note: 'No se combina con «P»' });
    expect(r.amounts.cup.amount).toBe(10000);
    expect(r.amounts.man.amount).toBe(1000);
    expect(r.total).toBe(29000);
  });
  it('combinadas se aplican en cadena y un monto no pasa el total', () => {
    const r = computeDiscounts(lines, [d({ key: 'x', value: 50 }), d({ key: 'y', source: 'manual', discountType: 'amount', value: 999999 })], { stackPromotions: true });
    expect(r.amounts.x.amount).toBe(20000);
    expect(r.amounts.y.amount).toBe(20000);
    expect(r.total).toBe(0);
  });
  it('centavos: el resto va a la última línea', () => {
    const three = ['1', '2', '3'].map((id) => ({ id, isProduct: false, itemId: id, gross: 3333, packageDiscount: 0 }));
    const r = computeDiscounts(three, [d({ discountType: 'amount', value: 1000 })], { stackPromotions: false });
    expect(Object.values(r.perLine).reduce((a, b) => a + b, 0)).toBe(1000);
  });
  it('mínimo de compra', () => {
    const r = computeDiscounts(lines, [d({})], { stackPromotions: false, minTotalOf: () => 50000 });
    expect(r.amounts.k).toEqual({ amount: 0, note: 'El ticket no llega al mínimo' });
  });
});

describe('promoBlockedBy', () => {
  const base = { active: true, weekdays: [2], fromTime: '09:00', toTime: '12:00', startsOn: null, endsOn: null, maxUses: null, usesCount: 0, firstVisitOnly: false };
  it('martes 10:00 vale, miércoles no, 12:00 no', () => {
    expect(promoBlockedBy(base, { wallNow: new Date('2026-11-03T10:00:00Z'), firstVisit: null })).toBeNull();
    expect(promoBlockedBy(base, { wallNow: new Date('2026-11-04T10:00:00Z'), firstVisit: null })).toBe('No vale hoy');
    expect(promoBlockedBy(base, { wallNow: new Date('2026-11-03T12:00:00Z'), firstVisit: null })).toBe('Vale hasta las 12:00');
  });
  it('primera visita y usos', () => {
    const p = { ...base, weekdays: null, fromTime: null, toTime: null, firstVisitOnly: true };
    expect(promoBlockedBy(p, { wallNow: new Date(), firstVisit: false })).toBe('Solo primera visita');
    expect(promoBlockedBy({ ...p, firstVisitOnly: false, maxUses: 5, usesCount: 5 }, { wallNow: new Date(), firstVisit: true })).toBe('Se agotaron los usos');
  });
});
