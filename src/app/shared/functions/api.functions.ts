import { HttpParams } from '@angular/common/http';

import { COMMON_MESSAGES } from '../constants/common.messages';

export type QueryParamValue =
  string | number | boolean | readonly (string | number | boolean)[] | null | undefined;

/**
 * Extracts a human-readable error message from HTTP errors, Error instances,
 * or error objects, falling back to a default message.
 */
export function extractErrorMessage(
  error: unknown,
  fallback: unknown = COMMON_MESSAGES.ERROR.GENERIC,
): string {
  try {
    const defaultFallback = String(fallback ?? COMMON_MESSAGES.ERROR.GENERIC);
    if (!error) {
      return defaultFallback;
    }

    if (typeof error === 'string') {
      return error.trim() || defaultFallback;
    }

    const err = error as any;

    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error.trim();
    }

    if (Array.isArray(err?.error?.errors) && err.error.errors.length > 0) {
      const firstErr = err.error.errors[0];
      const msg = typeof firstErr === 'string' ? firstErr : firstErr?.message || firstErr?.msg;
      if (typeof msg === 'string' && msg.trim()) {
        return msg.trim();
      }
    }

    const nestedMessage =
      err?.error?.message ||
      err?.error?.error?.message ||
      err?.error?.error ||
      err?.response?.data?.message ||
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
 * Builds Angular HttpParams while omitting undefined, null, and empty-string values.
 * Keeps valid falsy values such as 0 and false.
 */
export function buildHttpParams(query: object = {}): HttpParams {
  let params = new HttpParams();

  try {
    for (const [key, value] of Object.entries(query as Record<string, QueryParamValue>)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          if (item === undefined || item === null || item === '') {
            continue;
          }
          params = params.append(key, String(item));
        }
        continue;
      }

      params = params.set(key, String(value));
    }
  } catch (error) {
    console.error('Error in buildHttpParams:', error);
  }

  return params;
}
