import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

import {
  NgClass,
  NgComponentOutlet,
} from '@angular/common';

import type {
  LucideIcon as LucideIconComponent,
} from '@lucide/angular';

export type AppIconDefinition = LucideIconComponent;

export type AppIconSize =
  | 'inherit'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | number;

export type AppIconTone =
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'noteYellow'
  | 'noteOrange'
  | 'notePink'
  | 'noteRed'
  | 'noteGreen'
  | 'noteBlue'
  | 'notePurple'
  | 'noteBrown'
  | 'noteBlack';

export type AppIconSurface =
  | 'none'
  | 'soft'
  | 'paper'
  | 'dark'
  | 'noteYellow'
  | 'noteOrange'
  | 'notePink'
  | 'noteRed'
  | 'noteGreen'
  | 'noteBlue'
  | 'notePurple';

export type AppIconShape =
  | 'square'
  | 'rounded'
  | 'circle';

export type AppIconFlip =
  | 'none'
  | 'horizontal'
  | 'vertical'
  | 'both';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [
    NgClass,
    NgComponentOutlet,
  ],
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-icon-host-fit]': 'isFit',
  },
})
export class AppIcon {
  /**
   * Pass an imported Lucide icon component:
   * [icon]="LucidePlus"
   */
  @Input({ required: true })
  icon!: AppIconDefinition;

  @Input()
  size: AppIconSize = 'md';

  @Input()
  tone: AppIconTone = 'inherit';

  @Input()
  surface: AppIconSurface = 'none';

  @Input()
  shape: AppIconShape = 'rounded';

  /**
   * Overrides the selected tone.
   *
   * Examples:
   * "#111111"
   * "currentColor"
   * "var(--custom-color)"
   */
  @Input()
  color?: string;

  @Input()
  strokeWidth = 2;

  @Input()
  absoluteStrokeWidth = false;

  /**
   * Use "none" for normal Lucide outline icons.
   * Use "currentColor" for intentionally filled icons.
   */
  @Input()
  fill = 'none';

  @Input()
  rotate = 0;

  @Input()
  flip: AppIconFlip = 'none';

  @Input()
  spin = false;

  @Input()
  pulse = false;

  /**
   * Makes the icon fill its parent.
   * size="inherit" also enables this automatically.
   */
  @Input()
  fit = false;

  /**
   * Leave empty for decorative icons.
   * Provide a label only when the icon itself has meaning.
   */
  @Input()
  ariaLabel?: string;

  @Input()
  title?: string;

  get isFit(): boolean {
    return this.fit || this.size === 'inherit';
  }

  get resolvedSize(): string {
    if (typeof this.size === 'number') {
      return `${this.size}px`;
    }

    const sizes: Record<
      Exclude<AppIconSize, number>,
      string
    > = {
      inherit: '100%',
      xs: '14px',
      sm: '16px',
      md: '20px',
      lg: '24px',
      xl: '28px',
      '2xl': '32px',
    };

    return sizes[this.size];
  }

  get lucideSize(): number {
    if (typeof this.size === 'number') {
      return this.size;
    }

    const sizes: Record<
      Exclude<AppIconSize, number>,
      number
    > = {
      inherit: 24,
      xs: 14,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 28,
      '2xl': 32,
    };

    return sizes[this.size];
  }

  /**
   * Inputs passed to the dynamically created Lucide component.
   */
  get lucideInputs(): Record<string, unknown> {
    return {
      size: this.lucideSize,
      color: 'currentColor',
      strokeWidth: this.strokeWidth,
      absoluteStrokeWidth: this.absoluteStrokeWidth,
    };
  }

  get accessibleLabel(): string | null {
    return this.ariaLabel || this.title || null;
  }

  get isDecorative(): boolean {
    return !this.accessibleLabel;
  }

  get iconTransform(): string {
    const transforms: string[] = [];

    if (this.rotate !== 0) {
      transforms.push(`rotate(${this.rotate}deg)`);
    }

    switch (this.flip) {
      case 'horizontal':
        transforms.push('scaleX(-1)');
        break;

      case 'vertical':
        transforms.push('scaleY(-1)');
        break;

      case 'both':
        transforms.push('scale(-1)');
        break;
    }

    return transforms.length > 0
      ? transforms.join(' ')
      : 'none';
  }

  get iconClasses(): Record<string, boolean> {
    return {
      [`app-icon-tone-${this.tone}`]: true,
      [`app-icon-surface-${this.surface}`]: true,
      [`app-icon-shape-${this.shape}`]:
        this.surface !== 'none',

      'app-icon-has-surface':
        this.surface !== 'none',

      'app-icon-pulse':
        this.pulse,
    };
  }
}