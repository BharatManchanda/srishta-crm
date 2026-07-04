import { Prisma } from '@prisma/client';

export function isColumnMapping(value: Prisma.JsonValue): value is Record<string, string> {
    return (value !== null && typeof value === 'object' && !Array.isArray(value));
}
export function hasValue(value: unknown): boolean {
    return (value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === ''));
}

export function hasKey<T extends object>(obj: T, key: keyof T): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

export function hasKeyWithValue<T extends object>(obj: T, key: keyof T): boolean {
    return hasKey(obj, key) && hasValue(obj[key]);
}

export function getMappedValue<T>(
  row: Record<string, any>,
  mapColumn: Record<string, string>,
  key: string,
  defaultValue: T,
): T {
  const column = mapColumn[key];

  if (!column || column.trim() === '') {
    return defaultValue;
  }

  const value = row[column];

  return value === undefined || value === null || value === ''
    ? defaultValue
    : (value as T);
}

export function getMappedOptionalEnum<T extends Record<string, string>>(
  row: Record<string, any>,
  mapColumn: Record<string, string>,
  key: string,
  enumType: T,
  defaultValue: T[keyof T] | null,
) {
  const column = mapColumn[key];

  if (!column) {
    return defaultValue;
  }

  const value = row[column];

  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = String(value).trim().toUpperCase();

  return Object.values(enumType).includes(normalized as T[keyof T])
    ? (normalized as T[keyof T])
    : defaultValue;
}

export function getMappedRequiredEnum<T extends Record<string, string>>(
  row: Record<string, any>,
  mapColumn: Record<string, string>,
  key: string,
  enumType: T,
  defaultValue: T[keyof T],
): T[keyof T] {
  const column = mapColumn[key];

  if (!column) return defaultValue;

  const value = row[column];

  if (value == null || value === '') {
    return defaultValue;
  }

  const normalized = String(value).trim().toUpperCase();

  return Object.values(enumType).includes(normalized as T[keyof T])
    ? (normalized as T[keyof T])
    : defaultValue;
}

// export function getMappedOptionalEnum<T extends Record<string, string>>(
//   row: Record<string, any>,
//   mapColumn: Record<string, string>,
//   key: string,
//   enumType: T,
// ): T[keyof T] | null {
//   const column = mapColumn[key];

//   if (!column) return null;

//   const value = row[column];

//   if (value == null || value === '') {
//     return null;
//   }

//   const normalized = String(value).trim().toUpperCase();

//   return Object.values(enumType).includes(normalized as T[keyof T])
//     ? (normalized as T[keyof T])
//     : null;
// }