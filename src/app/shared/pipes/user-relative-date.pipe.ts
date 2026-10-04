import { Pipe, PipeTransform, inject } from '@angular/core';
import { UserDateTimeFormatterService } from '../services/user-date-time-formatter.service';

@Pipe({
  name: 'userRelativeDate',
  standalone: true,
  pure: false,
})
export class UserRelativeDatePipe implements PipeTransform {
  private readonly formatter = inject(UserDateTimeFormatterService);

  transform(value: unknown, fallback = 'Recently'): string {
    return this.formatter.formatRelativeDate(value, fallback);
  }
}
