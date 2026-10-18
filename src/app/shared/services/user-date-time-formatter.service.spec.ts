import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UserPreferenceService } from '../../private/user-preferences/services/user-preference.service';
import { UserPreferenceStore } from '../../private/user-preferences/services/user-preference.store';
import { UserDateTimeFormatterService } from './user-date-time-formatter.service';
import { DEFAULT_USER_PREFERENCES } from '../constants/common.constants';

describe('UserDateTimeFormatterService', () => {
  let formatter: UserDateTimeFormatterService;
  let preferences: UserPreferenceStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: UserPreferenceService, useValue: {} }],
    });
    formatter = TestBed.inject(UserDateTimeFormatterService);
    preferences = TestBed.inject(UserPreferenceStore);
    // Keep timestamp expectations independent of the machine running the tests.
    preferences.updatePreference('timezone', 'UTC');
  });

  afterEach(() => vi.restoreAllMocks());

  it('uses backend UTC defaults before preferences are loaded', () => {
    preferences.reset();
    expect(formatter.preferences().timezone).toBe('UTC');
    expect(formatter.formatDateTime('2026-10-09T03:32:55.742Z')).toBe('09/10/2026 03:32 AM');
  });

  it('never derives the display timezone from browser settings', () => {
    const resolved = vi
      .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .mockReturnValue({ timeZone: 'Pacific/Honolulu' } as Intl.ResolvedDateTimeFormatOptions);
    preferences.updatePreference('timezone', 'Asia/Kolkata');
    expect(formatter.formatDateTime('2026-10-09T03:32:55.742Z')).toBe('09/10/2026 09:02 AM');
    preferences.updatePreference('dateFormat', 'YYYY-MM-DD');
    preferences.updatePreference('timeFormat', '24h');
    expect(formatter.formatDateTime('2026-10-09T03:32:55.742Z')).toBe('2026-10-09 09:02');
    expect(resolved).not.toHaveBeenCalled();
  });

  it('handles both London daylight-saving transitions', () => {
    preferences.updatePreference('timezone', 'Europe/London');
    preferences.updatePreference('timeFormat', '24h');
    expect(formatter.formatTime('2026-03-29T00:30:00Z')).toBe('00:30');
    expect(formatter.formatTime('2026-03-29T01:30:00Z')).toBe('02:30');
    expect(formatter.formatTime('2026-10-25T00:30:00Z')).toBe('01:30');
    expect(formatter.formatTime('2026-10-25T01:30:00Z')).toBe('01:30');
  });

  it('uses numeric calendar parts across locales with month suffixes and different calendars', () => {
    preferences.updatePreference('locale', 'ja-JP');
    expect(formatter.formatDate('2026-10-09')).toBe('09/10/2026');
    preferences.updatePreference('locale', 'th-TH');
    expect(formatter.formatDate('2026-10-09')).toBe('09/10/2026');
  });

  it('honors explicit UTC and India preferences without changing the last-update instant', () => {
    const updatedAt = '2026-10-09T03:32:00Z';
    expect(formatter.formatTime(updatedAt)).toBe('03:32 AM');
    preferences.updatePreference('timezone', 'Asia/Kolkata');
    expect(formatter.formatTime(updatedAt)).toBe('09:02 AM');
    expect(formatter.formatTime('2026-10-09T15:10:00Z')).toBe('08:40 PM');
    preferences.updatePreference('timezone', 'UTC');
    expect(formatter.formatTime(updatedAt)).toBe('03:32 AM');
  });

  it.each([
    ['DD/MM/YYYY', '09/10/2026'],
    ['MM/DD/YYYY', '10/09/2026'],
    ['YYYY-MM-DD', '2026-10-09'],
    ['DD-MM-YYYY', '09-10-2026'],
    ['DD MMM YYYY', '09 Oct 2026'],
    ['MMM DD, YYYY', 'Oct 09, 2026'],
  ])('formats %s using the saved timezone', (format, expected) => {
    preferences.updatePreference('dateFormat', format);
    preferences.updatePreference('timezone', 'Asia/Kolkata');
    expect(formatter.formatDateTime('2026-10-09T09:00:00Z')).toBe(`${expected} 02:30 PM`);
  });

  it('treats ISO strings, millisecond timestamps, and Date objects as the same instant', () => {
    preferences.updatePreference('timezone', 'America/Los_Angeles');
    const iso = '2026-10-09T00:30:00Z';
    for (const value of [iso, Date.parse(iso), new Date(iso), '2026-10-09T02:30:00+02:00']) {
      expect(formatter.formatDateTime(value)).toBe('08/10/2026 05:30 PM');
    }
    preferences.updatePreference('timezone', 'Pacific/Kiritimati');
    expect(formatter.formatDateTime('2026-10-09T23:30:00Z')).toBe('10/10/2026 01:30 PM');
  });

  it('handles daylight-saving transitions using IANA timezone rules', () => {
    preferences.updatePreference('timezone', 'America/New_York');
    expect(formatter.formatTime('2026-03-08T06:30:00Z')).toBe('01:30 AM');
    expect(formatter.formatTime('2026-03-08T07:30:00Z')).toBe('03:30 AM');
  });

  it('uses 00 at midnight for 24-hour time and 12 for 12-hour time', () => {
    expect(formatter.formatTime('2026-10-09T00:05:00Z')).toBe('12:05 AM');
    preferences.updatePreference('timeFormat', '24h');
    expect(formatter.formatTime('2026-10-09T00:05:00Z')).toBe('00:05');
    expect(formatter.formatTime('2026-10-09T14:30:00Z')).toBe('14:30');
    expect(formatter.formatDateTime(0)).toBe('01/01/1970 00:00');
  });

  it.each(['Pacific/Kiritimati', 'America/Los_Angeles'])(
    'preserves date-only values in %s without inventing a time',
    (timezone) => {
      preferences.updatePreference('timezone', timezone);
      for (const value of [
        '2026-10-09',
        ' 2026-10-09 ',
        '09/10/2026',
        '09-10-2026',
        '09.10.2026',
      ]) {
        expect(formatter.formatDate(value)).toBe('09/10/2026');
        expect(formatter.formatDateTime(value)).toBe('09/10/2026');
        expect(formatter.formatTime(value, 'No time')).toBe('No time');
      }
      expect(formatter.formatDate('2024-02-29')).toBe('29/02/2024');
    },
  );

  it('preserves the explicit date-key helper used by note calendar dates', () => {
    preferences.updatePreference('timezone', 'America/Los_Angeles');
    expect(formatter.formatDateKey('2026-10-09T00:30:00Z')).toBe('09/10/2026');
    expect(formatter.formatDate('2026-10-09T00:30:00Z')).toBe('08/10/2026');
  });

  it.each([
    null,
    undefined,
    '',
    '   ',
    'not a date',
    '2026-02-30',
    '2026-02-30T12:00:00Z',
    '2026-10-09Tinvalid',
    '31/02/2026',
    new Date(NaN),
    NaN,
    Infinity,
    {},
    true,
  ])('returns a safe fallback for invalid input %s', (value) => {
    expect(formatter.formatDate(value, 'Unavailable')).toBe('Unavailable');
    expect(formatter.formatTime(value, 'Unavailable')).toBe('Unavailable');
    expect(formatter.formatDateTime(value, 'Unavailable')).toBe('Unavailable');
    expect(formatter.formatDateTime(value)).toBe('');
  });

  it('falls back to existing defaults for invalid saved preferences', () => {
    preferences.updatePreference('dateFormat', 'toString');
    preferences.updatePreference('timezone', 'invalid/timezone');
    preferences.updatePreference('locale', 'invalid_locale');
    preferences.updatePreference('timeFormat', 'invalid');
    expect(formatter.preferences()).toMatchObject({
      dateFormat: 'DD/MM/YYYY',
      timezone: DEFAULT_USER_PREFERENCES['timezone'],
      timeFormat: '12h',
      locale: 'en-US',
    });
    expect(formatter.formatDateTime('2026-10-09T14:30:00Z')).not.toBe('');
  });

  it('respects locale for month names', () => {
    preferences.updatePreference('dateFormat', 'DD MMM YYYY');
    preferences.updatePreference('locale', 'fr-FR');
    expect(formatter.formatDate('2026-10-09')).toBe('09 oct. 2026');
  });

  it('does not mistake valid output matching the fallback for an invalid date', () => {
    expect(formatter.formatDateTime('2026-10-09T14:30:00Z', '09/10/2026')).toBe(
      '09/10/2026 02:30 PM',
    );
  });

  it('reuses formatted results but invalidates them when preferences change', () => {
    const parts = vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts');
    const value = '2026-10-09T14:30:00Z';
    formatter.formatDateTime(value);
    const calls = parts.mock.calls.length;
    formatter.formatDateTime(value);
    expect(parts).toHaveBeenCalledTimes(calls);
    preferences.updatePreference('dateFormat', 'MM/DD/YYYY');
    expect(formatter.formatDateTime(value)).toBe('10/09/2026 02:30 PM');
    expect(parts.mock.calls.length).toBeGreaterThan(calls);
  });

  it('uses the timestamp time for relative labels', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-09T14:30:00Z'));
    expect(formatter.formatRelativeDate('2026-10-09T14:25:00Z')).toBe('5m ago');
  });
});
