export function camelCaseToTitle(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase());
}

export function getEnumValue<T extends Record<string, string>>(enumObj: T, value: string, defaultValue: T[keyof T],): T[keyof T] {
    const enumValues = Object.values(enumObj);
    return enumValues.includes(value) ? (value as T[keyof T]) : defaultValue;
}