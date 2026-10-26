import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  type OnChanges,
  type SimpleChanges,
} from '@angular/core';
import { NgClass } from '@angular/common';

import { AppIcon, type AppIconDefinition } from '../icon/icon';
import {
  Tooltip,
  type TooltipPosition,
  type TooltipTone,
  type TooltipSize,
} from '../tooltip/tooltip';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

export type AvatarShape = 'circle' | 'rounded' | 'square';

export type AvatarTone =
  | 'neutral'
  | 'primary'
  | 'yellow'
  | 'orange'
  | 'pink'
  | 'red'
  | 'green'
  | 'blue'
  | 'purple'
  | 'brown'
  | 'black';

export type AvatarStatus = 'none' | 'online' | 'offline' | 'away' | 'busy';

@Component({
  host: { '[attr.title]': 'null' },
  selector: 'app-avatar',
  standalone: true,
  imports: [NgClass, AppIcon, Tooltip],
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Avatar implements OnChanges {
  private readonly hostTooltip = inject(Tooltip, { optional: true, self: true });

  @Input() src?: string | null;
  @Input() alt = '';
  @Input() name = '';
  @Input() initials = '';

  @Input() fallbackIcon?: AppIconDefinition;

  @Input() size: AvatarSize = 'md';
  @Input() shape: AvatarShape = 'circle';
  @Input() tone: AvatarTone = 'neutral';
  @Input() status: AvatarStatus = 'none';

  @Input() bordered = true;
  @Input() elevated = false;
  @Input() decorative = false;

  @Input() loading: 'eager' | 'lazy' = 'lazy';
  @Input() referrerPolicy: ReferrerPolicy = 'no-referrer';
  @Input() objectPosition = 'center';

  @Input() ariaLabel?: string;
  @Input() title?: string;

  @Input() tooltip?: string | boolean | null;
  @Input() tooltipPosition: TooltipPosition = 'top';
  @Input() tooltipTone: TooltipTone = 'paper';
  @Input() tooltipSize: TooltipSize = 'sm';
  @Input() tooltipDisabled = false;

  @Output() imageLoad = new EventEmitter<Event>();
  @Output() imageError = new EventEmitter<Event>();

  protected imageFailed = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src']) {
      this.imageFailed = false;
    }
  }

  get hasImage(): boolean {
    return Boolean(this.src) && !this.imageFailed;
  }

  get resolvedSize(): string {
    if (typeof this.size === 'number') {
      return `${Math.max(16, this.size)}px`;
    }

    const sizes: Record<Exclude<AvatarSize, number>, string> = {
      xs: '24px',
      sm: '32px',
      md: '40px',
      lg: '48px',
      xl: '64px',
      '2xl': '80px',
    };

    return sizes[this.size];
  }

  get resolvedInitials(): string {
    const providedInitials = this.initials.trim();

    if (providedInitials) {
      return providedInitials.slice(0, 2).toUpperCase();
    }

    const words = this.name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      return '?';
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }

  get accessibleLabel(): string | null {
    if (this.decorative) {
      return null;
    }

    const identity = this.ariaLabel || this.alt || this.name || this.resolvedInitials || 'User';

    const statusLabel = this.resolvedStatusLabel;

    return statusLabel ? `${identity}, ${statusLabel}` : identity;
  }

  get resolvedTooltip(): string {
    if (this.tooltipDisabled || this.decorative || this.tooltip === false || Boolean(this.hostTooltip)) {
      return '';
    }

    if (typeof this.tooltip === 'string' && this.tooltip.trim()) {
      return this.tooltip.trim();
    }

    if (this.title && this.title.trim()) {
      return this.title.trim();
    }

    if (this.tooltip === true) {
      return this.accessibleLabel ?? '';
    }

    return this.accessibleLabel ?? '';
  }

  get hasCustomTooltip(): boolean {
    return (
      !this.tooltipDisabled &&
      !this.decorative &&
      this.tooltip !== false &&
      !this.hostTooltip &&
      Boolean(this.resolvedTooltip.trim())
    );
  }

  get resolvedStatusLabel(): string | null {
    switch (this.status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      default:
        return null;
    }
  }

  get avatarClasses(): Record<string, boolean> {
    return {
      [`app-avatar-${this.shape}`]: true,
      [`app-avatar-tone-${this.tone}`]: true,
      [`app-avatar-size-${typeof this.size === 'number' ? 'custom' : this.size}`]: true,
      'app-avatar-bordered': this.bordered,
      'app-avatar-elevated': this.elevated,
    };
  }

  handleImageLoad(event: Event): void {
    this.imageLoad.emit(event);
  }

  handleImageError(event: Event): void {
    this.imageFailed = true;
    this.imageError.emit(event);
  }
}
