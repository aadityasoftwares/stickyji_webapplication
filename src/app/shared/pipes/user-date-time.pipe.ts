import { Pipe, PipeTransform, inject } from '@angular/core';
import { UserDateTimeFormatterService } from '../services/user-date-time-formatter.service';

@Pipe({
  name: 'userDateTime',
  standalone: true,
  pure: false,
})
export class UserDateTimePipe implements PipeTransform {
  private readonly formatter = inject(UserDateTimeFormatterService);

  transform(value: unknown, fallback = ''): string {
    return this.formatter.formatDateTime(value, fallback);
  }
}
