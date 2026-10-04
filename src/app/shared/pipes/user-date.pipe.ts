import { Pipe, PipeTransform, inject } from '@angular/core';
import { UserDateTimeFormatterService } from '../services/user-date-time-formatter.service';

@Pipe({
  name: 'userDate',
  standalone: true,
  pure: false,
})
export class UserDatePipe implements PipeTransform {
  private readonly formatter = inject(UserDateTimeFormatterService);

  transform(value: unknown, fallback = ''): string {
    return this.formatter.formatDate(value, fallback);
  }
}
