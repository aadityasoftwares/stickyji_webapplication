import { Tooltip } from '../tooltip/tooltip';
import {
  inject,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideX } from '@lucide/angular';

import { AppIcon, type AppIconDefinition } from '../icon/icon';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'
  | 'noteYellow'
  | 'noteOrange'
  | 'notePink'
  | 'noteRed'
  | 'noteGreen'
  | 'noteBlue'
  | 'notePurple'
  | 'noteBrown'
  | 'noteBlack';

export type BadgeShape = 'square' | 'rounded' | 'pill';
export type BadgeIconPosition = 'left' | 'right';
export type BadgeRole = 'status' | 'note' | null;

@Component({
  host: { '[attr.title]': 'null' },
  selector: 'app-badge',
  standalone: true,
  imports: [Tooltip, NgClass, AppIcon],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  protected readonly hostTooltip = inject(Tooltip, { optional: true, self: true });

  @Input() label = '';
  @Input() variant: BadgeVariant = 'neutral';
  @Input() size: BadgeSize = 'sm';
  @Input() shape: BadgeShape = 'pill';

  @Input() icon?: AppIconDefinition;
  @Input() iconPosition: BadgeIconPosition = 'left';

  @Input() dot = false;
  @Input() dotPulse = false;

  @Input() count?: number;
  @Input() maxCount = 99;

  @Input() removable = false;
  @Input() disabled = false;

  @Input() maxWidth?: number;
  @Input() role: BadgeRole = null;
  @Input() ariaLabel?: string;
  @Input() title?: string;
  @Input() removeAriaLabel = 'Remove';

  @Output() removed = new EventEmitter<MouseEvent>();

  protected readonly removeIcon = LucideX;

  get displayText(): string {
    if (this.count === undefined || this.count === null) {
      return this.label;
    }

    const safeCount = Math.max(0, this.count);
    const safeMax = Math.max(1, this.maxCount);

    return safeCount > safeMax ? `${safeMax}+` : `${safeCount}`;
  }

  get accessibleLabel(): string | null {
    return this.ariaLabel || this.displayText || this.title || null;
  }

  get badgeClasses(): Record<string, boolean> {
    return {
      [`app-badge-${this.variant}`]: true,
      [`app-badge-${this.size}`]: true,
      [`app-badge-${this.shape}`]: true,
      'app-badge-with-dot': this.dot,
      'app-badge-removable': this.removable,
      'app-badge-disabled': this.disabled,
    };
  }

  remove(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.disabled) {
      return;
    }

    this.removed.emit(event);
  }
}
