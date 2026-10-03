import { COMMON_MESSAGES } from '../constants/common.messages';

/**
 * Shared generic utilities and helper functions.
 */

/**
 * Extracts an entity identifier from a string, a number, or an entity object with `id` or `_id`.
 * Returns an empty string when nullish or when no identifier property is found.
 *
 * @param value String, number, entity object, or unknown value.
 * @returns Normalized entity id string.
 */
export function idOf(value: any): string {
  try {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'object') {
      const id = value?.id ?? value?._id;
      if (id !== undefined && id !== null) {
        if (typeof id === 'object') {
          return String(id?.$oid ?? id?.toString?.() ?? '').trim();
        }
        return String(id).trim();
      }
      return '';
    }

    return '';
  } catch (error) {
    console.error('Error in idOf:', error);
    return '';
  }
}

/**
 * Extracts a display name or label from an entity object or string, falling back to a default value.
 *
 * @param value Entity object with name/title/label, or string value.
 * @param fallback Fallback string when no name is found.
 * @returns Trimmed entity name or fallback.
 */
export function entityNameOf(value: any, fallback: any = ''): string {
  try {
    if (!value) {
      return String(fallback ?? '');
    }

    if (typeof value === 'string') {
      return value.trim() || String(fallback ?? '');
    }

    if (typeof value === 'object') {
      const name = value?.name ?? value?.title ?? value?.label;
      return typeof name === 'string' && name.trim() ? name.trim() : String(fallback ?? '');
    }

    return String(fallback ?? '');
  } catch (error) {
    console.error('Error in entityNameOf:', error);
    return String(fallback ?? '');
  }
}

/**
 * Safely extracts an array list from diverse backend response payloads.
 * Supports direct arrays, `{ data: [...] }`, nested `{ data: { data: [...] } }`,
 * or nested paginated keys like `items`, `checklists`, `checklistItems`, `folders`,
 * `notes`, `workspaces`, `columns`, `members`, `docs`, `results`, etc.
 *
 * @param response Backend API response object or array.
 * @returns Array of items, or empty array if not found.
 */
export function extractList<T = any>(response: any): T[] {
  try {
    if (!response) {
      return [];
    }

    if (Array.isArray(response)) {
      return response as T[];
    }

    const res: any = response;
    const data = res?.data !== undefined ? res.data : res;

    if (Array.isArray(data)) {
      return data as T[];
    }

    if (!data || typeof data !== 'object') {
      return [];
    }

    if (Array.isArray(data.data)) {
      return data.data as T[];
    }

    const list =
      data.items ||
      data.checklists ||
      data.checklistItems ||
      data.folders ||
      data.workspaceFolders ||
      data.notes ||
      data.workspaces ||
      data.columns ||
      data.members ||
      data.docs ||
      data.results;

    return Array.isArray(list) ? (list as T[]) : [];
  } catch (error) {
    console.error('Error in extractList:', error);
    return [];
  }
}

/**
 * Extracts a human-readable error message from HTTP errors, Error instances,
 * or error objects, falling back to a default message.
 *
 * @param error Error object or unknown caught value.
 * @param fallback Fallback string if no message is present.
 * @returns Formatted error string.
 */
export function extractErrorMessage(
  error: any,
  fallback: any = COMMON_MESSAGES.ERROR.GENERIC
): string {
  try {
    const defaultFallback = String(fallback ?? COMMON_MESSAGES.ERROR.GENERIC);
    if (!error) {
      return defaultFallback;
    }

    if (typeof error === 'string') {
      return error.trim() || defaultFallback;
    }

    const err: any = error;

    // Check if error.error is a direct string message
    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error.trim();
    }

    // Check nested validation errors array: error.error.errors[0].message
    if (Array.isArray(err?.error?.errors) && err.error.errors.length > 0) {
      const firstErr = err.error.errors[0];
      const msg = typeof firstErr === 'string' ? firstErr : firstErr?.message || firstErr?.msg;
      if (typeof msg === 'string' && msg.trim()) {
        return msg.trim();
      }
    }

    const nestedMessage =
      err?.error?.message ||
      err?.error?.error ||
      err?.message ||
      err?.statusText;

    return typeof nestedMessage === 'string' && nestedMessage.trim()
      ? nestedMessage.trim()
      : defaultFallback;
  } catch (err) {
    console.error('Error in extractErrorMessage:', err);
    return String(fallback ?? COMMON_MESSAGES.ERROR.GENERIC);
  }
}

/**
 * Safely constructs an HTTP query parameters object from filter key-values,
 * omitting empty string, null, or undefined entries.
 *
 * @param filters Record of filter keys and values.
 * @returns Clean record of stringified query params.
 */
export function buildQueryParams(filters: any): Record<string, string> {
  const params: Record<string, string> = {};
  try {
    if (!filters || typeof filters !== 'object') {
      return params;
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params[key] = String(value);
      }
    });

    return params;
  } catch (error) {
    console.error('Error in buildQueryParams:', error);
    return params;
  }
}

/**
 * Safely sorts an array of items by numeric position ascending.
 *
 * @param items List of objects with an optional position property.
 * @returns Shallow-copied sorted array.
 */
export function sortItemsByPosition<T = any>(items: any): T[] {
  try {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return [...items].sort((a: any, b: any) => (Number(a?.position) || 0) - (Number(b?.position) || 0));
  } catch (error) {
    console.error('Error in sortItemsByPosition:', error);
    return Array.isArray(items) ? [...items] : [];
  }
}
