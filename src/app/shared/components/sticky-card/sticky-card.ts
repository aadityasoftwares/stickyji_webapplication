import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UI } from '../../constants/ui.constants';

export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type CardVariant =
  | 'default'
  | 'paper'
  | 'glass'
  | 'dark'
  | 'noteYellow'
  | 'noteOrange'
  | 'notePink'
  | 'noteRed'
  | 'noteGreen'
  | 'noteBlue'
  | 'notePurple'
  | 'noteBrown';

export type CardAppearance = 'elevated' | 'outlined' | 'flat';

export type CardShape =
  | 'rounded'
  | 'soft'
  | 'square'
  | 'note'
  | 'cut'
  | 'ticket'
  | 'folded';

export type CardLayout = 'vertical' | 'horizontal';

export type CardShadow = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-sticky-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sticky-card.html',
  styleUrl: './sticky-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-card-host-full]': 'fullWidth',
  },
})

export class StickyCard {
  @Input() variant: CardVariant = 'default';
  @Input() appearance: CardAppearance = 'elevated';
  @Input() shape: CardShape = 'rounded';
  @Input() size: CardSize = 'md';
  @Input() layout: CardLayout = 'vertical';
  @Input() shadow: CardShadow = 'md';

  @Input() eyebrow = '';
  @Input() cardTitle = '';
  @Input() subtitle = '';

  @Input() fullWidth = false;
  @Input() width?: number;
  @Input() maxWidth?: number;
  @Input() height?: number;
  @Input() minHeight?: number;
  @Input() padding?: number;
  @Input() radius?: number;
  @Input() mediaWidth = 220;
  @Input() bodyMaxHeight?: number;

  @Input() headerDivider = false;
  @Input() footerDivider = false;
  @Input() bodyScrollable = false;
  @Input() bodyFlush = false;
  @Input() customClass = '';

  @Input() clickable = false;
  @Input() hoverable = false;
  @Input() selected = false;
  @Input() disabled = false;
  @Input() loading = false;

  @Input() cardId?: string;
  @Input() ariaLabel?: string;
  @Input() ariaLabelledBy?: string;
  @Input() ariaDescribedBy?: string;

  @Output() cardClick = new EventEmitter<MouseEvent | KeyboardEvent>();

  get cardPadding(): number {
    return this.padding ?? UI.card.padding[this.size];
  }

  get cardRadius(): number {
    if (this.radius !== undefined) {
      return this.radius;
    }

    switch (this.shape) {
      case 'square':
      case 'cut':
      case 'ticket':
        return 0;

      case 'note':
      case 'folded':
        return 4;

      case 'soft':
        return UI.card.radius.sm;

      default:
        return UI.card.radius.md;
    }
  }

  get resolvedMinHeight(): number {
    return this.minHeight ?? UI.card.minHeight;
  }

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  get isInteractive(): boolean {
    return this.clickable && !this.isDisabled;
  }

  get accessibleLabel(): string | null {
    return this.ariaLabel || this.cardTitle || null;
  }

  get tabIndex(): number | null {
    return this.isInteractive ? 0 : null;
  }

  get cardClasses(): Record<string, boolean> {
    const classes: Record<string, boolean> = {
      [`app-card-${this.variant}`]: true,
      [`app-card-appearance-${this.appearance}`]: true,
      [`app-card-shape-${this.shape}`]: true,
      [`app-card-size-${this.size}`]: true,
      [`app-card-layout-${this.layout}`]: true,
      [`app-card-shadow-${this.shadow}`]: true,

      'app-card-clickable': this.clickable,
      'app-card-hoverable': this.hoverable || this.clickable,
      'app-card-selected': this.selected,
      'app-card-disabled': this.isDisabled,
      'app-card-loading': this.loading,
      'app-card-header-divider': this.headerDivider,
      'app-card-footer-divider': this.footerDivider,
      'app-card-body-scrollable': this.bodyScrollable,
      'app-card-body-flush': this.bodyFlush,
    };

    for (const className of this.customClass.split(/\s+/).filter(Boolean)) {
      classes[className] = true;
    }

    return classes;
  }

  onCardClick(event: MouseEvent): void {
    if (
      !this.isInteractive ||
      this.isNestedInteractiveElement(event.target, event.currentTarget)
    ) {
      return;
    }

    this.cardClick.emit(event);
  }

  onCardKeydown(event: KeyboardEvent): void {
    if (!this.isInteractive || event.target !== event.currentTarget) {
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.cardClick.emit(event);
  }

  private isNestedInteractiveElement(
    target: EventTarget | null,
    currentTarget: EventTarget | null
  ): boolean {
    if (!(target instanceof Element)) {
      return false;
    }

    const interactiveElement = target.closest(
      'a, button, input, select, textarea, summary, [role="button"], [data-card-interactive]'
    );

    return Boolean(interactiveElement && interactiveElement !== currentTarget);
  }
}
