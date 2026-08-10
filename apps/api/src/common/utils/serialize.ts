import { Decimal } from '@prisma/client/runtime/library';

export function serializeValue(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (value instanceof Decimal) {
    return value.toNumber();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serializeValue(entry)]),
    );
  }
  return value;
}

export function serialize<T>(payload: T): T {
  return serializeValue(payload) as T;
}
