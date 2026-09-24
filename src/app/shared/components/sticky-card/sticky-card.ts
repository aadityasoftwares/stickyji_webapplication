import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

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
  | 'noteBrown'
  | 'noteBlack';

export type CardAppearance = 'elevated' | 'outlined' | 'flat';

export type CardShape =
  | 'rounded'
  | 'soft'
  | 'square'
  | 'note'
  | 'cut'
  | 'ticket'
  | 'folded'
  | 'stickyFold';

export type BackendCardShape =
  | 'ROUNDED'
  | 'SOFT'
  | 'SQUARE'
  | 'NOTE'
  | 'CUT'
  | 'TICKET'
  | 'FOLDED'
  | 'STICKY_FOLD';

export type CardShapeInput =
  | CardShape
  | BackendCardShape
  | string
  | null
  | undefined;

export type CardLayout = 'vertical' | 'horizontal';
export type CardShadow = 'none' | 'sm' | 'md' | 'lg';

const CARD_SHAPES = new Set<CardShape>([
  'rounded',
  'soft',
  'square',
  'note',
  'cut',
  'ticket',
  'folded',
  'stickyFold',
]);

const CARD_SHAPE_ALIASES: Readonly<Record<string, CardShape>> = {
  rounded: 'rounded',
  soft: 'soft',
  square: 'square',
  note: 'note',
  cut: 'cut',
  ticket: 'ticket',
  folded: 'folded',
  stickyfold: 'stickyFold',
  'sticky-fold': 'stickyFold',
  sticky_fold: 'stickyFold',
  cornerfold: 'stickyFold',
  'corner-fold': 'stickyFold',
  corner_fold: 'stickyFold',
  peel: 'stickyFold',
  peeled: 'stickyFold',
};

/** Converts backend enum values and UI aliases to one supported card shape. */
export function resolveCardShape(value: CardShapeInput): CardShape {
  const normalized = String(value ?? 'stickyFold').trim().toLowerCase();
  return (
    CARD_SHAPE_ALIASES[normalized] ??
    (CARD_SHAPES.has(normalized as CardShape)
      ? (normalized as CardShape)
      : 'stickyFold')
  );
}

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
  @Input() shape: CardShapeInput = 'stickyFold';
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
  @Input() foldSize = 18;
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

  @Output() readonly cardClick =
    new EventEmitter<MouseEvent | KeyboardEvent>();

  get resolvedShape(): CardShape {
    return resolveCardShape(this.shape);
  }

  get cardPadding(): number {
    return this.padding ?? UI.card.padding[this.size];
  }

  get cardRadius(): number {
    if (this.radius !== undefined) return this.radius;

    switch (this.resolvedShape) {
      case 'square':
      case 'cut':
      case 'ticket':
        return 0;
      case 'note':
      case 'folded':
        return 5;
      case 'stickyFold':
        return 3;
      case 'soft':
        return UI.card.radius.sm;
      case 'rounded':
      default:
        return UI.card.radius.md;
    }
  }

  get resolvedMinHeight(): number {
    return this.minHeight ?? UI.card.minHeight;
  }

  get resolvedFoldSize(): number {
    return Math.max(12, Math.min(40, this.foldSize));
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

  get shellClasses(): Record<string, boolean> {
    return {
      [`app-card-${this.variant}`]: true,
      [`app-card-shell-shape-${this.resolvedShape}`]: true,
      [`app-card-shell-shadow-${this.shadow}`]: true,
      'app-card-shell-hoverable': this.hoverable || this.clickable,
      'app-card-shell-selected': this.selected,
      'app-card-shell-disabled': this.isDisabled,
    };
  }

  get cardClasses(): Record<string, boolean> {
    const classes: Record<string, boolean> = {
      [`app-card-${this.variant}`]: true,
      [`app-card-appearance-${this.appearance}`]: true,
      [`app-card-shape-${this.resolvedShape}`]: true,
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
    if (!this.isInteractive || event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    this.cardClick.emit(event);
  }

  private isNestedInteractiveElement(
    target: EventTarget | null,
    currentTarget: EventTarget | null,
  ): boolean {
    if (!(target instanceof Element)) return false;

    const interactiveElement = target.closest(
      [
        'a',
        'button',
        'input',
        'select',
        'textarea',
        'summary',
        '[role="button"]',
        '[data-card-interactive]',
      ].join(', '),
    );

    return Boolean(interactiveElement && interactiveElement !== currentTarget);
  }
}
