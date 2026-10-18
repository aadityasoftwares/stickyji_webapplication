import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  LucideAtSign,
  LucideCalendarDays,
  LucideCircleCheck,
  LucideFolder,
  LucideHash,
  LucideLock,
  LucideMail,
  LucidePalette,
  LucideSearch,
  LucideStickyNote,
  LucideTag,
  LucideUser,
} from '@lucide/angular';

import { Label, type LabelSize, type LabelVariant } from '../../shared/components/label/label';

@Component({
  selector: 'app-label-showcase',
  standalone: true,
  imports: [Label],
  templateUrl: './label-showcase.html',
  styleUrl: './label-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelShowcase {
  protected readonly icons = {
    at: LucideAtSign,
    calendar: LucideCalendarDays,
    check: LucideCircleCheck,
    folder: LucideFolder,
    hash: LucideHash,
    lock: LucideLock,
    mail: LucideMail,
    palette: LucidePalette,
    search: LucideSearch,
    stickyNote: LucideStickyNote,
    tag: LucideTag,
    user: LucideUser,
  } as const;

  protected readonly sizes: ReadonlyArray<{
    readonly label: string;
    readonly value: LabelSize;
  }> = [
    { label: 'Extra small', value: 'xs' },
    { label: 'Small', value: 'sm' },
    { label: 'Medium', value: 'md' },
    { label: 'Large', value: 'lg' },
  ];

  protected readonly semanticVariants: ReadonlyArray<{
    readonly label: string;
    readonly value: LabelVariant;
  }> = [
    { label: 'Neutral', value: 'neutral' },
    { label: 'Primary', value: 'primary' },
    { label: 'Accent', value: 'accent' },
    { label: 'Success', value: 'success' },
    { label: 'Warning', value: 'warning' },
    { label: 'Danger', value: 'danger' },
    { label: 'Information', value: 'info' },
  ];

  protected readonly noteVariants: ReadonlyArray<{
    readonly label: string;
    readonly value: LabelVariant;
  }> = [
    { label: 'Yellow note', value: 'noteYellow' },
    { label: 'Orange note', value: 'noteOrange' },
    { label: 'Pink note', value: 'notePink' },
    { label: 'Red note', value: 'noteRed' },
    { label: 'Green note', value: 'noteGreen' },
    { label: 'Blue note', value: 'noteBlue' },
    { label: 'Purple note', value: 'notePurple' },
    { label: 'Brown note', value: 'noteBrown' },
    { label: 'Black note', value: 'noteBlack' },
  ];

  protected readonly emailValue = signal('');
  protected readonly emailTouched = signal(false);

  protected updateEmail(event: Event): void {
    this.emailValue.set((event.target as HTMLInputElement).value);
    this.emailTouched.set(true);
  }

  protected get emailError(): string {
    const value = this.emailValue().trim();

    if (!this.emailTouched()) {
      return '';
    }

    if (!value) {
      return 'Email address is required.';
    }

    if (!/^\S+@\S+\.\S+$/.test(value)) {
      return 'Enter a valid email address.';
    }

    return '';
  }

  protected get emailSuccess(): string {
    return this.emailTouched() && !this.emailError ? 'Email address looks good.' : '';
  }
}
