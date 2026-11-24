import { averageCost } from './catalog.service';

describe('averageCost', () => {
  it('pondera el stock existente con la compra nueva', () => {
    // 10 a C$100 + 10 a C$130 → C$115
    expect(averageCost(10, 100, 10, 130)).toBe(115);
  });

  it('sin stock (o negativo) toma el costo de la compra', () => {
    expect(averageCost(0, 100, 5, 80)).toBe(80);
    expect(averageCost(-2, 100, 5, 80)).toBe(80);
  });

  it('redondea a centavos', () => {
    // (3·10 + 1·11) / 4 = 10.25 ; (1·10 + 2·11.11)/3 = 10.74
    expect(averageCost(3, 10, 1, 11)).toBe(10.25);
    expect(averageCost(1, 10, 2, 11.11)).toBe(10.74);
  });
});
