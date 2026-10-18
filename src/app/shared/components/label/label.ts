import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

import { AppIcon, type AppIconDefinition } from '../icon/icon';

export type LabelSize = 'xs' | 'sm' | 'md' | 'lg';

export type LabelVariant =
  | 'neutral'
  | 'primary'
  | 'secondary'
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

export type LabelAppearance = 'plain' | 'soft' | 'tape';
export type LabelWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type LabelAlign = 'start' | 'center' | 'end';
export type LabelIconPosition = 'left' | 'right';

@Component({
  selector: 'app-label',
  standalone: true,
  imports: [NgClass, AppIcon],
  templateUrl: './label.html',
  styleUrl: './label.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-label-host-full]': 'fullWidth',
  },
})
export class Label {
  @Input() text = '';
  @Input() description = '';
  @Input() hint = '';

  @Input('for') htmlFor?: string;
  @Input() labelId?: string;

  @Input() variant: LabelVariant = 'neutral';
  @Input() appearance: LabelAppearance = 'plain';
  @Input() size: LabelSize = 'md';
  @Input() weight: LabelWeight = 'semibold';
  @Input() align: LabelAlign = 'start';

  @Input() icon?: AppIconDefinition;
  @Input() iconPosition: LabelIconPosition = 'left';

  @Input() required = false;
  @Input() optional = false;
  @Input() disabled = false;
  @Input() invalid = false;

  @Input() fullWidth = false;
  @Input() wrap = true;
  @Input() truncate = false;
  @Input() visuallyHidden = false;
  @Input() maxWidth?: number;

  @Input() requiredText = 'Required';
  @Input() optionalText = 'Optional';
  @Input() ariaLabel?: string;
  @Input() title?: string;

  get accessibleLabel(): string | null {
    return this.ariaLabel || null;
  }

  get showOptional(): boolean {
    return this.optional && !this.required;
  }

  get labelClasses(): Record<string, boolean> {
    return {
      [`app-label-${this.variant}`]: true,
      [`app-label-${this.appearance}`]: true,
      [`app-label-${this.size}`]: true,
      [`app-label-weight-${this.weight}`]: true,
      [`app-label-align-${this.align}`]: true,
      'app-label-with-description': Boolean(this.description),
      'app-label-with-hint': Boolean(this.hint),
      'app-label-disabled': this.disabled,
      'app-label-invalid': this.invalid,
      'app-label-full': this.fullWidth,
      'app-label-nowrap': !this.wrap,
      'app-label-truncate': this.truncate,
      'app-label-visually-hidden': this.visuallyHidden,
    };
  }
}
