import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { UserPreferenceService } from '../../private/user-preferences/services/user-preference.service';
import { UserPreferenceStore } from '../../private/user-preferences/services/user-preference.store';
import { UserDateTimeFormatterService } from '../services/user-date-time-formatter.service';
import { UserDatePipe } from './user-date.pipe';
import { UserDateTimePipe } from './user-date-time.pipe';
import { UserTimePipe } from './user-time.pipe';

@Component({
  standalone: true,
  imports: [UserDatePipe, UserDateTimePipe, UserTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span id="date">{{ value() | userDate }}</span>
    <span id="explicit-date">{{ value() | userDate:'date' }}</span>
    <span id="datetime">{{ value() | userDate:'datetime' }}</span>
    <span id="time">{{ value() | userDate:'time' }}</span>
    <span id="legacy-date">{{ value() | userDate:'Unavailable' }}</span>
    <span id="legacy-datetime">{{ value() | userDateTime }}</span>
    <span id="legacy-time">{{ value() | userTime }}</span>
    <span id="fallback">{{ missing | userDate:'datetime':'Unavailable' }}</span>
  `,
})
class DateHost {
  readonly value = signal<unknown>('2026-10-09T00:30:00Z');
  readonly missing = null;
}

@Component({
  standalone: true,
  imports: [UserDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (value of values; track $index) { <span>{{ value | userDate:'datetime' }}</span> }`,
})
class LargeDateTable {
  readonly values = Array.from({ length: 1000 }, (_, index) => Date.UTC(2026, 9, 9, 0, index));
}

describe('UserDatePipe', () => {
  let preferences: UserPreferenceStore;
  let formatter: UserDateTimeFormatterService;
  let pipe: UserDatePipe;
  let api: {
    getMyPreferences: ReturnType<typeof vi.fn>;
    createPreference: ReturnType<typeof vi.fn>;
    updatePreference: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      getMyPreferences: vi.fn(() => of({ data: [] })),
      createPreference: vi.fn((key, value) => of({ data: { key, value } })),
      updatePreference: vi.fn((key, value) => of({ data: { key, value } })),
    };
    TestBed.configureTestingModule({
      imports: [DateHost],
      providers: [{ provide: UserPreferenceService, useValue: api }],
    });
    preferences = TestBed.inject(UserPreferenceStore);
    preferences.updatePreference('timezone', 'UTC');
    formatter = TestBed.inject(UserDateTimeFormatterService);
    pipe = TestBed.runInInjectionContext(() => new UserDatePipe());
  });

  it('supports all modes and the existing fallback argument', () => {
    const value = '2026-10-09T14:30:00Z';
    expect(pipe.transform(value)).toBe('09/10/2026');
    expect(pipe.transform(value, 'date')).toBe('09/10/2026');
    expect(pipe.transform(value, 'datetime')).toBe('09/10/2026 02:30 PM');
    expect(pipe.transform(value, 'time')).toBe('02:30 PM');
    expect(pipe.transform(null, 'time', 'No time')).toBe('No time');
    expect(pipe.transform(null, 'Unavailable')).toBe('Unavailable');
    expect(api.getMyPreferences).not.toHaveBeenCalled();
  });

  it('skips formatting unchanged inputs and detects mutations to Date objects', () => {
    const format = vi.spyOn(formatter, 'formatDate');
    const value = new Date('2026-10-09T14:30:00Z');
    for (let i = 0; i < 10; i++) expect(pipe.transform(value)).toBe('09/10/2026');
    expect(format).toHaveBeenCalledTimes(1);
    preferences.updatePreference('theme', 'DARK');
    expect(pipe.transform(value)).toBe('09/10/2026');
    expect(format).toHaveBeenCalledTimes(1);
    value.setUTCDate(10);
    expect(pipe.transform(value)).toBe('10/10/2026');
    preferences.updatePreference('dateFormat', 'YYYY-MM-DD');
    expect(pipe.transform(value)).toBe('2026-10-10');
    expect(format).toHaveBeenCalledTimes(3);
  });

  it('updates OnPush views automatically after async loading, saving, rollback, and reset', async () => {
    const loaded = new Subject<any>();
    api.getMyPreferences.mockReturnValue(loaded);
    const fixture = TestBed.createComponent(DateHost);
    await fixture.whenStable();
    const text = (id: string) => fixture.nativeElement.querySelector(`#${id}`).textContent.trim();
    expect(text('datetime')).toBe('09/10/2026 12:30 AM');
    expect(text('fallback')).toBe('Unavailable');

    preferences.load();
    loaded.next({ data: [
      { key: 'dateFormat', value: 'MM/DD/YYYY' },
      { key: 'timezone', value: 'America/Los_Angeles' },
      { key: 'timeFormat', value: '24h' },
    ] });
    loaded.complete();
    await fixture.whenStable();
    expect(text('date')).toBe('10/08/2026');
    expect(text('explicit-date')).toBe(text('date'));
    expect(text('datetime')).toBe('10/08/2026 17:30');
    expect(text('time')).toBe('17:30');
    expect(text('legacy-date')).toBe(text('date'));
    expect(text('legacy-datetime')).toBe(text('datetime'));
    expect(text('legacy-time')).toBe(text('time'));

    // A cache hit must retain the signal dependency for the next preference change.
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    preferences.setAndSave('dateFormat', 'YYYY-MM-DD');
    await fixture.whenStable();
    expect(text('date')).toBe('2026-10-08');
    expect(api.updatePreference).toHaveBeenCalledExactlyOnceWith('dateFormat', 'YYYY-MM-DD');

    api.updatePreference.mockReturnValue(throwError(() => new Error('Save failed')));
    preferences.setAndSave('dateFormat', 'DD/MM/YYYY');
    await fixture.whenStable();
    expect(text('date')).toBe('2026-10-08');
    preferences.reset();
    await fixture.whenStable();
    expect(text('datetime')).toBe(pipe.transform(fixture.componentInstance.value(), 'datetime'));
    expect(api.getMyPreferences).toHaveBeenCalledOnce();
    fixture.destroy();
    preferences.updatePreference('timezone', 'Asia/Kolkata');
    expect(api.getMyPreferences).toHaveBeenCalledOnce();
  });

  it('keeps invalid and date-only bindings safe when preferences change', async () => {
    const fixture = TestBed.createComponent(DateHost);
    fixture.componentInstance.value.set('2026-10-09');
    await fixture.whenStable();
    preferences.updatePreference('timezone', 'Pacific/Kiritimati');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#datetime').textContent.trim()).toBe('09/10/2026');
    expect(fixture.nativeElement.querySelector('#time').textContent.trim()).toBe('');
    fixture.componentInstance.value.set('bad date');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#date').textContent.trim()).toBe('');
    expect(fixture.nativeElement.querySelector('#legacy-date').textContent.trim()).toBe('Unavailable');
  });

  it('formats a large list only when values or date preferences change', async () => {
    const format = vi.spyOn(formatter, 'formatDateTime');
    const fixture = TestBed.createComponent(LargeDateTable);
    await fixture.whenStable();
    expect(format).toHaveBeenCalledTimes(1000);
    for (let i = 0; i < 3; i++) fixture.detectChanges();
    preferences.updatePreference('theme', 'DARK');
    fixture.detectChanges();
    expect(format).toHaveBeenCalledTimes(1000);
    preferences.updatePreference('timezone', 'Asia/Kolkata');
    await fixture.whenStable();
    expect(format).toHaveBeenCalledTimes(2000);
    expect(fixture.nativeElement.querySelector('span').textContent.trim()).toBe('09/10/2026 05:30 AM');
    expect(api.getMyPreferences).not.toHaveBeenCalled();
  });
});
