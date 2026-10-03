/**
 * Shared helpers for logical calendar dates.
 *
 * A DateKey represents a calendar day only and must never contain a time or
 * timezone. API date-only fields should use YYYY-MM-DD, while true moments in
 * time (createdAt, updatedAt, reminders, etc.) should continue using UTC ISO
 * timestamps.
 */
export type DateKey = `${number}-${number}-${number}`;

export const DATE_KEY_PATTERN =
    /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Returns true only for a real YYYY-MM-DD calendar date.
 * Examples:
 * - 2026-09-11 -> true
 * - 2026-02-30 -> false
 * - 2026-09-11T00:00:00.000Z -> false
 */
export function isValidDateKey(
    value: any,
): value is DateKey {
    try {
        if (typeof value !== 'string') {
            return false;
        }

        const match = value.match(
            DATE_KEY_PATTERN,
        );

        if (!match) {
            return false;
        }

        return isRealCalendarDate(
            Number(match[1]),
            Number(match[2]),
            Number(match[3]),
        );
    } catch (error) {
        console.error('Error in isValidDateKey:', error);
        return false;
    }
}

/**
 * Converts supported date-only input into the backend-safe YYYY-MM-DD key.
 *
 * Supported input:
 * - Date
 * - YYYY-MM-DD
 * - ISO datetime beginning with YYYY-MM-DD
 * - dd-MM-yyyy / dd/MM/yyyy / dd.MM.yyyy
 *
 * Important:
 * For ISO strings we intentionally read the leading calendar date instead of
 * constructing a Date object. This prevents timezone conversion from shifting
 * the selected logical day.
 */
export function toDateKey(
    value: any,
): DateKey | null {
    try {
        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return null;
        }

        if (value instanceof Date) {
            if (Number.isNaN(value.getTime())) {
                return null;
            }

            return buildDateKey(
                value.getFullYear(),
                value.getMonth() + 1,
                value.getDate(),
            );
        }

        if (typeof value !== 'string') {
            return null;
        }

        const normalized = value.trim();

        if (!normalized) {
            return null;
        }

        const backendMatch = normalized.match(
            /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/,
        );

        if (backendMatch) {
            return buildDateKey(
                Number(backendMatch[1]),
                Number(backendMatch[2]),
                Number(backendMatch[3]),
            );
        }

        const displayMatch = normalized.match(
            /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/,
        );

        if (displayMatch) {
            return buildDateKey(
                Number(displayMatch[3]),
                Number(displayMatch[2]),
                Number(displayMatch[1]),
            );
        }

        return null;
    } catch (error) {
        console.error('Error in toDateKey:', error);
        return null;
    }
}

/**
 * Returns today's browser-local calendar date as YYYY-MM-DD.
 *
 * Use this only for a date the user is explicitly selecting in the browser.
 * For server concepts such as the Today filter, prefer backend datePreset=TODAY
 * so the user's saved timezone remains the source of truth.
 */
export function todayDateKey(
    now: any = new Date(),
): DateKey {
    try {
        const date = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
        return (buildDateKey(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate(),
        ) ?? '2026-01-01') as DateKey;
    } catch (error) {
        console.error('Error in todayDateKey:', error);
        const fallback = new Date();
        return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-${String(fallback.getDate()).padStart(2, '0')}` as DateKey;
    }
}

/**
 * Converts a DateKey to a local Date for UI-only formatting/calendar controls.
 * Noon is used to stay comfortably away from DST midnight edge cases.
 */
export function dateKeyToLocalDate(
    value: any,
): Date | null {
    try {
        const key = toDateKey(value);

        if (!key) {
            return null;
        }

        const [year, month, day] =
            key.split('-').map(Number);

        return new Date(
            year,
            month - 1,
            day,
            12,
            0,
            0,
            0,
        );
    } catch (error) {
        console.error('Error in dateKeyToLocalDate:', error);
        return null;
    }
}

/**
 * Locale-aware display helper. Storage/API format remains YYYY-MM-DD.
 */
export function formatDateKey(
    value: any,
    locale: any = 'en-IN',
    options: any = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    },
): string {
    try {
        const date = dateKeyToLocalDate(value);

        if (!date) {
            return '';
        }

        return new Intl.DateTimeFormat(
            String(locale || 'en-IN'),
            options,
        ).format(date);
    } catch (error) {
        console.error('Error in formatDateKey:', error);
        return '';
    }
}

/**
 * Formats a DateKey or date value into a short UI display label (e.g. "Sep 28").
 *
 * @param value DateKey string or Date object.
 * @param fallback Fallback string if value is nullish.
 * @param locale Locale string (default 'en').
 * @returns Formatted display string like "Sep 28".
 */
export function formatDateKeyDisplay(
    value: any,
    fallback: any = 'No date',
    locale: any = 'en'
): string {
    try {
        const defaultFallback = String(fallback ?? 'No date');
        if (!value) {
            return defaultFallback;
        }
        const dateKey = toDateKey(value);
        if (!dateKey) {
            return typeof value === 'string' ? value.trim() || defaultFallback : defaultFallback;
        }
        return formatDateKey(dateKey, locale, {
            month: 'short',
            day: 'numeric'
        }) || defaultFallback;
    } catch (error) {
        console.error('Error in formatDateKeyDisplay:', error);
        return String(fallback ?? 'No date');
    }
}

/**
 * Formats a date/time value using Intl.DateTimeFormat with a safe fallback.
 */
export function formatDateTime(
    value: any,
    fallback: any = '',
    locale: any = 'en-IN',
    options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    },
): string {
    try {
        const defaultFallback = String(fallback ?? '');
        if (!value) {
            return defaultFallback;
        }

        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            return defaultFallback;
        }

        return new Intl.DateTimeFormat(String(locale || 'en-IN'), options).format(date);
    } catch (error) {
        console.error('Error in formatDateTime:', error);
        return String(fallback ?? '');
    }
}

function buildDateKey(
    year: any,
    month: any,
    day: any,
): DateKey | null {
    try {
        const y = Number(year);
        const m = Number(month);
        const d = Number(day);

        if (!isRealCalendarDate(y, m, d)) {
            return null;
        }

        return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` as DateKey;
    } catch (error) {
        console.error('Error in buildDateKey:', error);
        return null;
    }
}

function isRealCalendarDate(
    year: any,
    month: any,
    day: any,
): boolean {
    try {
        const y = Number(year);
        const m = Number(month);
        const d = Number(day);

        if (
            !Number.isInteger(y) ||
            !Number.isInteger(m) ||
            !Number.isInteger(d) ||
            y < 1000 ||
            y > 9999 ||
            m < 1 ||
            m > 12 ||
            d < 1 ||
            d > 31
        ) {
            return false;
        }

        const date = new Date(
            Date.UTC(
                y,
                m - 1,
                d,
            ),
        );

        return (
            date.getUTCFullYear() === y &&
            date.getUTCMonth() === m - 1 &&
            date.getUTCDate() === d
        );
    } catch (error) {
        console.error('Error in isRealCalendarDate:', error);
        return false;
    }
}
