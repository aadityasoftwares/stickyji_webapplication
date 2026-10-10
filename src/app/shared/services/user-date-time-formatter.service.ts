import { Injectable, computed, inject } from '@angular/core';
import { DEFAULT_USER_PREFERENCES } from '../constants/common.constants';
import { toDateKey } from '../functions/date.function';
import { UserPreferenceStore } from '../../private/user-preferences/services/user-preference.store';

export interface UserDateTimePreferences {
  dateFormat: string;
  timeFormat: '12h' | '24h';
  timezone: string;
  locale: string;
  weekStartsOn: string;
}

type DatePartMap = Record<string, string>;

const SUPPORTED_DATE_FORMATS: Record<string, string> = {
  'DD/MM/YYYY': 'DD/MM/YYYY',
  'MM/DD/YYYY': 'MM/DD/YYYY',
  'YYYY-MM-DD': 'YYYY-MM-DD',
  'DD-MM-YYYY': 'DD-MM-YYYY',
  'DD MMM YYYY': 'DD MMM YYYY',
  'MMM DD, YYYY': 'MMM DD, YYYY',
};

@Injectable({ providedIn: 'root' })
export class UserDateTimeFormatterService {
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly intlFormatters = new Map<string, Intl.DateTimeFormat>();
  private readonly resultCache = new Map<string, string>();
  private readonly maxResultCacheSize = 500;
  private readonly maxIntlCacheSize = 100;

  readonly preferences = computed<UserDateTimePreferences>(() => {
    const defaultWeekStartsOn = String(DEFAULT_USER_PREFERENCES['weekStartsOn']);

    return {
      dateFormat: this.validDateFormat(this.userPreferenceStore.dateFormat()),
      timeFormat: this.validTimeFormat(this.userPreferenceStore.timeFormat()),
      timezone: this.validTimezone(this.userPreferenceStore.timezone()),
      locale: this.validLocale(this.userPreferenceStore.locale()),
      weekStartsOn: String(
        this.userPreferenceStore.weekStartsOn() ??
        defaultWeekStartsOn
      ).trim().toLowerCase() || defaultWeekStartsOn,
    };
  });

  formatDate(value: unknown, fallback = ''): string {
    const prefs = this.preferences();
    const cacheKey = this.resultKey('date', value, fallback, prefs, prefs.timezone);
    const cached = this.resultCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const date = this.parseDate(value);
    if (!date) return fallback;
    const timeZone = this.dateOnlyKey(value) ? 'UTC' : prefs.timezone;

    const parts = this.dateParts(date, prefs.locale, timeZone);
    if (!parts) return fallback;

    return this.cacheResult(cacheKey, this.applyDateFormat(prefs.dateFormat, parts));
  }

  formatTime(value: unknown, fallback = ''): string {
    const prefs = this.preferences();
    const cacheKey = this.resultKey('time', value, fallback, prefs, prefs.timezone);
    const cached = this.resultCache.get(cacheKey);
    if (cached !== undefined) return cached;

    // Calendar dates have no time of day; do not display the parsing anchor time.
    if (this.dateOnlyKey(value)) return fallback;
    const date = this.parseDate(value);
    if (!date) return fallback;

    const parts = this.timeParts(date, prefs.locale, prefs.timezone, prefs.timeFormat);
    if (!parts) return fallback;

    return this.cacheResult(cacheKey, prefs.timeFormat === '24h'
      ? `${parts['hour']}:${parts['minute']}`
      : `${parts['hour']}:${parts['minute']} ${parts['dayPeriod']}`.trim());
  }

  formatDateTime(value: unknown, fallback = ''): string {
    const date = this.formatDate(value);
    if (!date) return fallback;

    const time = this.formatTime(value, '');
    return time ? `${date} ${time}` : date;
  }

  formatRelativeDate(value: unknown, fallback = 'Recently'): string {
    const date = this.parseDate(value);
    if (!date) return fallback;

    const timestamp = date.getTime();
    const diffMs = Date.now() - timestamp;

    if (diffMs < 60_000) return 'Just now';

    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const dayDiff = this.dayDifference(date, new Date());
    if (dayDiff === 1) return 'Yesterday';
    if (dayDiff > 1 && dayDiff < 7) return `${dayDiff}d ago`;

    return this.formatDate(value, fallback);
  }

  formatDateKey(value: unknown, fallback = ''): string {
    const key = toDateKey(value);
    return key ? this.formatDate(key, fallback) : fallback;
  }

  todayDateKey(): string {
    const prefs = this.preferences();
    const parts = this.calendarParts(new Date(), prefs.locale, prefs.timezone);
    if (!parts) {
      return new Date().toISOString().slice(0, 10);
    }

    return [
      String(parts.year).padStart(4, '0'),
      String(parts.month).padStart(2, '0'),
      String(parts.day).padStart(2, '0'),
    ].join('-');
  }

  private dateOnlyKey(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const text = value.trim();
    // toDateKey also accepts ISO timestamps, so only pass actual calendar dates.
    return /^(?:\d{4}-\d{2}-\d{2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})$/.test(text)
      ? toDateKey(text) : null;
  }

  private parseDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') return null;

    const key = this.dateOnlyKey(value);
    if (key) {
      const [year, month, day] = key.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    }

    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'number') {
      date = new Date(value);
    } else if (typeof value === 'string') {
      const text = value.trim();
      if (!text) return null;
      // Date.parse can normalize impossible dates (e.g. February 30) into March.
      const calendarPrefix = text.match(/^(\d{4}-\d{2}-\d{2})(?:$|[T\s])/);
      if (calendarPrefix && !toDateKey(calendarPrefix[1])) return null;
      if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(text)) return null;
      date = new Date(text);
    } else {
      return null;
    }
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private dateParts(date: Date, locale: string, timeZone: string): DatePartMap | null {
    try {
      const formatter = this.getFormatter(locale, {
        timeZone,
        calendar: 'gregory',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const parts = this.partsToMap(formatter.formatToParts(date));
      const numericMonth = this.partsToMap(this.getFormatter(locale, {
        timeZone,
        calendar: 'gregory',
        month: '2-digit',
      }).formatToParts(date))['month'];

      return {
        DD: parts['day'],
        MM: numericMonth,
        MMM: parts['month'],
        YYYY: parts['year'],
      };
    } catch {
      return null;
    }
  }

  private timeParts(
    date: Date,
    locale: string,
    timeZone: string,
    timeFormat: '12h' | '24h'
  ): DatePartMap | null {
    try {
      const formatter = this.getFormatter(locale, {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: timeFormat === '12h' ? 'h12' : 'h23',
      });

      const parts = this.partsToMap(formatter.formatToParts(date));

      return {
        hour: parts['hour'],
        minute: parts['minute'],
        dayPeriod: parts['dayPeriod'] ?? '',
      };
    } catch {
      return null;
    }
  }

  private applyDateFormat(format: string, parts: DatePartMap): string {
    return format
      .replaceAll('YYYY', parts['YYYY'] ?? '')
      .replaceAll('MMM', parts['MMM'] ?? '')
      .replaceAll('DD', parts['DD'] ?? '')
      .replaceAll('MM', parts['MM'] ?? '');
  }

  private partsToMap(parts: Intl.DateTimeFormatPart[]): DatePartMap {
    return parts.reduce<DatePartMap>((result, part) => {
      if (part.type !== 'literal') {
        result[part.type] = part.value;
      }
      return result;
    }, {});
  }

  private dayDifference(first: Date, second: Date): number {
    const prefs = this.preferences();
    const firstParts = this.calendarParts(first, prefs.locale, prefs.timezone);
    const secondParts = this.calendarParts(second, prefs.locale, prefs.timezone);

    if (!firstParts || !secondParts) {
      return Math.floor((second.getTime() - first.getTime()) / 86_400_000);
    }

    const firstUtc = Date.UTC(firstParts.year, firstParts.month - 1, firstParts.day);
    const secondUtc = Date.UTC(secondParts.year, secondParts.month - 1, secondParts.day);
    return Math.floor((secondUtc - firstUtc) / 86_400_000);
  }

  private calendarParts(date: Date, locale: string, timeZone: string): { year: number; month: number; day: number } | null {
    try {
      const parts = this.partsToMap(this.getFormatter(locale, {
        timeZone,
        calendar: 'gregory',
        numberingSystem: 'latn',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(date));

      return {
        year: Number(parts['year']),
        month: Number(parts['month']),
        day: Number(parts['day']),
      };
    } catch {
      return null;
    }
  }

  private validDateFormat(value: unknown): string {
    const format = String(value ?? '').trim();
    return Object.hasOwn(SUPPORTED_DATE_FORMATS, format)
      ? SUPPORTED_DATE_FORMATS[format] : String(DEFAULT_USER_PREFERENCES['dateFormat']);
  }

  private validTimeFormat(value: unknown): '12h' | '24h' {
    const format = String(value ?? '').trim().toLowerCase();
    return format === '12h' || format === '24h' ? format : DEFAULT_USER_PREFERENCES['timeFormat'];
  }

  private validLocale(value: unknown): string {
    const defaultLocale = String(DEFAULT_USER_PREFERENCES['locale']);
    const locale = String(value ?? '').trim() || defaultLocale;
    try {
      Intl.DateTimeFormat(locale);
      return locale;
    } catch {
      return defaultLocale;
    }
  }

  private validTimezone(value: unknown): string {
    const defaultLocale = String(DEFAULT_USER_PREFERENCES['locale']);
    const defaultTimezone = String(DEFAULT_USER_PREFERENCES['timezone']);
    const timezone = String(value ?? '').trim() || defaultTimezone;
    try {
      Intl.DateTimeFormat(defaultLocale, { timeZone: timezone });
      return timezone;
    } catch {
      return defaultTimezone;
    }
  }

  private getFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const key = `${locale}|${JSON.stringify(options)}`;
    const cached = this.intlFormatters.get(key);
    if (cached) return cached;

    const formatter = new Intl.DateTimeFormat(locale, options);
    if (this.intlFormatters.size >= this.maxIntlCacheSize) {
      this.intlFormatters.delete(this.intlFormatters.keys().next().value!);
    }
    this.intlFormatters.set(key, formatter);
    return formatter;
  }

  private resultKey(
    type: string,
    value: unknown,
    fallback: string,
    prefs: UserDateTimePreferences,
    timeZone: string
  ): string {
    return JSON.stringify([
      type,
      typeof value,
      this.valueKey(value),
      fallback,
      prefs.dateFormat,
      prefs.timeFormat,
      timeZone,
      prefs.locale,
    ]);
  }

  private valueKey(value: unknown): string {
    if (value instanceof Date) {
      return String(value.getTime());
    }
    return String(value ?? '');
  }

  private cacheResult(key: string, value: string): string {
    if (this.resultCache.size >= this.maxResultCacheSize) {
      const firstKey = this.resultCache.keys().next().value;
      if (firstKey) {
        this.resultCache.delete(firstKey);
      }
    }
    this.resultCache.set(key, value);
    return value;
  }
}
