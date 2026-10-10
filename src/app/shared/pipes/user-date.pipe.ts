import { Pipe, PipeTransform, inject } from '@angular/core';
import { UserDateTimeFormatterService, type UserDateTimePreferences } from '../services/user-date-time-formatter.service';

export type UserDateMode = 'date' | 'datetime' | 'time';

@Pipe({
  name: 'userDate',
  standalone: true,
  // Preferences can change while the input stays the same. Reading their signal
  // in transform also lets Angular track this dependency in OnPush templates.
  pure: false,
})
export class UserDatePipe implements PipeTransform {
  private readonly formatter = inject(UserDateTimeFormatterService);

  private lastResult?: {
    value: unknown;
    mode: UserDateMode;
    fallback: string;
    preferences: UserDateTimePreferences;
    text: string;
  };

  /** Numeric timestamps use milliseconds. The legacy second-argument fallback is still supported. */
  transform(value: unknown, modeOrFallback: UserDateMode | string = 'date', fallback = ''): string {
    const mode = modeOrFallback === 'date' || modeOrFallback === 'datetime' || modeOrFallback === 'time'
      ? modeOrFallback : 'date';
    const emptyText = mode === modeOrFallback ? fallback : modeOrFallback;
    // Always read the signal, including cache hits, to retain the template dependency.
    const preferences = this.formatter.preferences();
    const valueKey = value instanceof Date ? value.getTime() : value;
    const previous = this.lastResult;
    if (previous && Object.is(previous.value, valueKey) && previous.mode === mode &&
        previous.fallback === emptyText && previous.preferences === preferences) {
      return previous.text;
    }

    const text = mode === 'time' ? this.formatter.formatTime(value, emptyText)
      : mode === 'datetime' ? this.formatter.formatDateTime(value, emptyText)
      : this.formatter.formatDate(value, emptyText);
    this.lastResult = { value: valueKey, mode, fallback: emptyText, preferences, text };
    return text;
  }
}
