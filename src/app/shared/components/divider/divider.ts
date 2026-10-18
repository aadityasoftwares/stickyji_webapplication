import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerLineStyle = 'solid' | 'dashed' | 'dotted';
export type DividerLabelAlign = 'start' | 'center' | 'end';
export type DividerSpace = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export type DividerVariant =
  | 'neutral'
  | 'strong'
  | 'primary'
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

@Component({
  selector: 'app-divider',
  standalone: true,
  imports: [NgClass],
  templateUrl: './divider.html',
  styleUrl: './divider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Divider {
  @Input() orientation: DividerOrientation = 'horizontal';
  @Input() variant: DividerVariant = 'neutral';
  @Input() lineStyle: DividerLineStyle = 'solid';

  @Input() label = '';
  @Input() hasLabel = false;
  @Input() labelAlign: DividerLabelAlign = 'center';

  @Input() thickness = 1;
  @Input() length: string | number = '100%';
  @Input() spacing: DividerSpace = 'md';
  @Input() inset: DividerSpace = 'none';

  @Input() decorative = true;
  @Input() ariaLabel?: string;

  get isHorizontal(): boolean {
    return this.orientation === 'horizontal';
  }

  get showLabel(): boolean {
    return this.isHorizontal && (this.hasLabel || Boolean(this.label));
  }

  get resolvedThickness(): string {
    return `${Math.max(1, this.thickness)}px`;
  }

  get resolvedLength(): string {
    return typeof this.length === 'number' ? `${Math.max(0, this.length)}px` : this.length;
  }

  get resolvedSpacing(): string {
    return this.resolveSpace(this.spacing);
  }

  get resolvedInset(): string {
    return this.resolveSpace(this.inset);
  }

  get accessibleLabel(): string | null {
    return this.ariaLabel || this.label || null;
  }

  get dividerClasses(): Record<string, boolean> {
    return {
      [`app-divider-${this.orientation}`]: true,
      [`app-divider-${this.variant}`]: true,
      [`app-divider-${this.lineStyle}`]: true,
      [`app-divider-label-${this.labelAlign}`]: this.showLabel,
      'app-divider-with-label': this.showLabel,
    };
  }

  private resolveSpace(value: DividerSpace): string {
    if (typeof value === 'number') {
      return `${Math.max(0, value)}px`;
    }

    const spaces: Record<Exclude<DividerSpace, number>, string> = {
      none: '0px',
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    };

    return spaces[value];
  }
}
