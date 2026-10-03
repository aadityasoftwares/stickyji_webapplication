export { extractErrorMessage } from './api.functions';
export { buildQueryParams, removeEmptyValues } from './object.functions';

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
