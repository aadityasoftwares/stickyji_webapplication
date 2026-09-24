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
    value: unknown,
): value is DateKey {
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
    value: unknown,
): DateKey | null {
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
}

/**
 * Returns today's browser-local calendar date as YYYY-MM-DD.
 *
 * Use this only for a date the user is explicitly selecting in the browser.
 * For server concepts such as the Today filter, prefer backend datePreset=TODAY
 * so the user's saved timezone remains the source of truth.
 */
export function todayDateKey(
    now: Date = new Date(),
): DateKey {
    return buildDateKey(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
    ) as DateKey;
}

/**
 * Converts a DateKey to a local Date for UI-only formatting/calendar controls.
 * Noon is used to stay comfortably away from DST midnight edge cases.
 */
export function dateKeyToLocalDate(
    value: unknown,
): Date | null {
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
}

/**
 * Locale-aware display helper. Storage/API format remains YYYY-MM-DD.
 */
export function formatDateKey(
    value: unknown,
    locale = 'en-IN',
    options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    },
): string {
    const date = dateKeyToLocalDate(value);

    if (!date) {
        return '';
    }

    return new Intl.DateTimeFormat(
        locale,
        options,
    ).format(date);
}

function buildDateKey(
    year: number,
    month: number,
    day: number,
): DateKey | null {
    if (
        !isRealCalendarDate(
            year,
            month,
            day,
        )
    ) {
        return null;
    }

    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` as DateKey;
}

function isRealCalendarDate(
    year: number,
    month: number,
    day: number,
): boolean {
    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day) ||
        year < 1000 ||
        year > 9999 ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        return false;
    }

    const date = new Date(
        Date.UTC(
            year,
            month - 1,
            day,
        ),
    );

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}
