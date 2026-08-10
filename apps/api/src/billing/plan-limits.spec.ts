import { BadRequestException } from '@nestjs/common';
import {
  assertCanCreateWithinPlanLimitsOrThrow,
  assertPlanLimitsOrThrow,
  computePlanLimitExcesses,
  getStripePriceIdForRegion,
} from './plan-limits';

describe('plan-limits', () => {
  describe('computePlanLimitExcesses', () => {
    it('returns empty when limits are null (unlimited)', () => {
      expect(
        computePlanLimitExcesses(
          { maxEmployees: null, maxServices: null },
          { employees: 100, services: 100 },
        ),
      ).toEqual({});
    });

    it('returns empty when counts are within limits', () => {
      expect(
        computePlanLimitExcesses(
          { maxEmployees: 3, maxServices: 10 },
          { employees: 3, services: 10 },
        ),
      ).toEqual({});
    });

    it('flags employees and services when over limit', () => {
      expect(
        computePlanLimitExcesses(
          { maxEmployees: 3, maxServices: 10 },
          { employees: 5, services: 12 },
        ),
      ).toEqual({
        employees: { current: 5, limit: 3 },
        services: { current: 12, limit: 10 },
      });
    });
  });

  describe('assertPlanLimitsOrThrow', () => {
    it('throws BadRequestException with Spanish messages', () => {
      expect(() =>
        assertPlanLimitsOrThrow({
          employees: { current: 5, limit: 3 },
        }),
      ).toThrow(BadRequestException);

      try {
        assertPlanLimitsOrThrow({
          employees: { current: 5, limit: 3 },
          services: { current: 12, limit: 10 },
        });
      } catch (error) {
        const body = (error as BadRequestException).getResponse() as {
          errors: Record<string, string>;
        };
        expect(body.errors.employees).toContain('Empleados');
        expect(body.errors.services).toContain('Servicios');
      }
    });
  });

  describe('assertCanCreateWithinPlanLimitsOrThrow', () => {
    it('blocks create when at employee cap', () => {
      expect(() =>
        assertCanCreateWithinPlanLimitsOrThrow(
          { maxEmployees: 3, maxServices: 10 },
          { employees: 3, services: 0 },
          'employees',
        ),
      ).toThrow(BadRequestException);
    });

    it('allows create under employee cap', () => {
      expect(() =>
        assertCanCreateWithinPlanLimitsOrThrow(
          { maxEmployees: 3, maxServices: 10 },
          { employees: 2, services: 0 },
          'employees',
        ),
      ).not.toThrow();
    });
  });

  describe('getStripePriceIdForRegion', () => {
    const plan = {
      stripePriceIdNi: 'price_ni',
      stripePriceIdUs: 'price_us',
    };

    it('returns US / NI price by region', () => {
      expect(getStripePriceIdForRegion(plan, 'US')).toBe('price_us');
      expect(getStripePriceIdForRegion(plan, 'NI')).toBe('price_ni');
    });

    it('falls back when one regional price is missing', () => {
      expect(
        getStripePriceIdForRegion(
          { stripePriceIdNi: null, stripePriceIdUs: 'price_us' },
          'NI',
        ),
      ).toBe('price_us');
    });
  });
});
