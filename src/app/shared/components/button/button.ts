import { Tooltip } from '../tooltip/tooltip';
import { CommonModule } from '@angular/common';
import {
  inject,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { UI } from '../../constants/ui.constants';
import { AppIcon, type AppIconDefinition } from '../icon/icon';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'noteYellow'
  | 'noteOrange'
  | 'notePink'
  | 'noteRed'
  | 'noteGreen'
  | 'noteBlue'
  | 'notePurple'
  | 'noteBrown'
  | 'noteBlack';

export type ButtonAppearance = 'standard' | 'tape' | 'flat';
export type ButtonType = 'button' | 'submit' | 'reset';

export type ButtonWidth = 'auto' | 'full' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ButtonIconPosition = 'left' | 'right';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [Tooltip, CommonModule, AppIcon],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.title]': 'null',
    '[class.app-button-host-full]': 'isFullWidth',
  },
})
export class Button {
  protected readonly hostTooltip = inject(Tooltip, { optional: true, self: true });

  @Input() type: ButtonType = 'button';
  @Input() variant: ButtonVariant = 'primary';
  @Input() appearance: ButtonAppearance = 'standard';
  @Input() size: ButtonSize = 'md';
  @Input() width: ButtonWidth = 'auto';

  @Input() label = '';
  @Input() loadingText = 'Loading...';

  @Input() height?: number;
  @Input() minWidth?: number;
  @Input() maxWidth?: number;
  @Input() paddingX?: number;
  @Input() paddingY?: number;

  /** Direct Lucide inputs used by application screens. */
  @Input() iconLeft?: AppIconDefinition;
  @Input() iconRight?: AppIconDefinition;
  @Input() icon?: AppIconDefinition;

  /** Kept for backward-compatible projected icon slots. */
  @Input() hasIcon = false;
  @Input() iconOnly = false;
  @Input() iconPosition: ButtonIconPosition = 'left';
  @Input() iconSize?: number;

  @Input() split = false;
  @Input() splitAriaLabel = 'More options';
  @Input() splitExpanded?: boolean;
  @Input() splitControls?: string;

  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() rounded = false;
  @Input() nowrap = true;

  @Input() buttonId?: string;
  @Input() name?: string;
  @Input() value?: string | number;
  @Input() form?: string;

  @Input() ariaLabel?: string;
  @Input() ariaDescribedBy?: string;
  @Input() ariaControls?: string;
  @Input() ariaExpanded?: boolean;
  @Input() ariaPressed?: boolean;
  @Input() title?: string;

  @Output() buttonClick = new EventEmitter<MouseEvent>();
  @Output() splitClick = new EventEmitter<MouseEvent>();

  get buttonHeight(): number {
    return this.height ?? UI.button.height[this.size];
  }

  get buttonMinWidth(): number | null {
    if (this.isFullWidth) {
      return null;
    }

    if (this.minWidth !== undefined) {
      return this.minWidth;
    }

    return this.predefinedWidth ?? UI.button.minWidth[this.size];
  }

  get buttonPaddingX(): number {
    return this.paddingX ?? UI.button.paddingX[this.size];
  }

  get buttonPaddingY(): number {
    return this.paddingY ?? UI.button.paddingY[this.size];
  }

  get buttonIconSize(): number {
    return this.iconSize ?? UI.button.iconSize[this.size];
  }

  get splitButtonWidth(): number {
    return Math.max(36, this.buttonHeight);
  }

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  get isFullWidth(): boolean {
    return this.fullWidth || this.width === 'full';
  }

  get showLeftIcon(): boolean {
    return (
      !this.iconOnly && Boolean(this.iconLeft || (this.hasIcon && this.iconPosition === 'left'))
    );
  }

  get showRightIcon(): boolean {
    return (
      !this.iconOnly && Boolean(this.iconRight || (this.hasIcon && this.iconPosition === 'right'))
    );
  }

  get iconOnlyDefinition(): AppIconDefinition | undefined {
    return this.icon ?? this.iconLeft ?? this.iconRight;
  }

  get accessibleLabel(): string | null {
    if (this.ariaLabel) {
      return this.ariaLabel;
    }

    if (this.label) {
      return this.label;
    }

    if (this.iconOnly) {
      return this.title || 'Button';
    }

    return null;
  }

  get buttonTitle(): string | null {
    return this.title || (this.iconOnly ? this.accessibleLabel : null);
  }

  get ariaBusy(): 'true' | null {
    return this.loading ? 'true' : null;
  }

  get ariaPressedValue(): 'true' | 'false' | null {
    if (this.ariaPressed === undefined) {
      return null;
    }

    return this.ariaPressed ? 'true' : 'false';
  }

  get ariaExpandedValue(): 'true' | 'false' | null {
    if (this.ariaExpanded === undefined) {
      return null;
    }

    return this.ariaExpanded ? 'true' : 'false';
  }

  get splitExpandedValue(): 'true' | 'false' | null {
    if (this.splitExpanded === undefined) {
      return null;
    }

    return this.splitExpanded ? 'true' : 'false';
  }

  get predefinedWidth(): number | null {
    switch (this.width) {
      case 'xs':
        return UI.button.minWidth.xs;
      case 'sm':
        return UI.button.minWidth.sm;
      case 'md':
        return UI.button.minWidth.md;
      case 'lg':
        return UI.button.minWidth.lg;
      case 'xl':
        return UI.button.minWidth.xl;
      default:
        return null;
    }
  }

  get wrapperClasses(): Record<string, boolean> {
    return {
      [`app-button-wrapper-${this.variant}`]: true,
      'app-button-split-wrapper': this.split,
      'app-button-full': this.isFullWidth,
      'app-button-wrapper-rounded': this.rounded,
      'app-button-wrapper-tape': this.appearance === 'tape',
      'app-button-wrapper-disabled': this.isDisabled,
    };
  }

  get buttonClasses(): Record<string, boolean> {
    return {
      [`app-button-${this.variant}`]: true,
      [`app-button-${this.size}`]: true,
      [`app-button-appearance-${this.appearance}`]: true,
      'app-button-icon-only': this.iconOnly,
      'app-button-rounded': this.rounded,
      'app-button-full': this.isFullWidth,
      'app-button-nowrap': this.nowrap,
      'app-button-loading': this.loading,
    };
  }

  get splitButtonClasses(): Record<string, boolean> {
    return {
      [`app-button-${this.variant}`]: true,
      [`app-button-${this.size}`]: true,
      [`app-button-appearance-${this.appearance}`]: true,
      'app-button-loading': this.loading,
    };
  }

  onButtonClick(event: MouseEvent): void {
    if (this.isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.buttonClick.emit(event);
  }

  onSplitClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isDisabled) {
      return;
    }

    this.splitClick.emit(event);
  }
}
