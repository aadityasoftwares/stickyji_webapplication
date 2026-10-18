export type PlainQueryValue = string | number | boolean | null | undefined;

/**
 * Removes undefined, null, and empty-string entries from a shallow object.
 * Valid falsy values such as 0 and false are preserved.
 */
export function removeEmptyValues<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Partial<T> = {};

  try {
    for (const [key, item] of Object.entries(value ?? {})) {
      if (item === undefined || item === null || item === '') {
        continue;
      }

      result[key as keyof T] = item as T[keyof T];
    }
  } catch (error) {
    console.error('Error in removeEmptyValues:', error);
  }

  return result;
}

/**
 * Safely constructs a query-parameter record, omitting empty optional values.
 */
export function buildQueryParams(
  filters: Record<string, PlainQueryValue> = {},
): Record<string, string> {
  const params: Record<string, string> = {};

  try {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== '' && value !== null && value !== undefined) {
        params[key] = String(value);
      }
    }
  } catch (error) {
    console.error('Error in buildQueryParams:', error);
  }

  return params;
}
