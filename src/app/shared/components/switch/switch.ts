import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { AppIcon, type AppIconDefinition } from '../icon/icon';

export type SwitchSize = 'sm' | 'md' | 'lg';

export type SwitchVariant =
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

export type SwitchLabelPosition = 'left' | 'right';

let nextSwitchId = 0;

@Component({
  selector: 'app-switch',
  standalone: true,
  imports: [NgClass, AppIcon],
  templateUrl: './switch.html',
  styleUrl: './switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Switch),
      multi: true,
    },
  ],
  host: {
    '[class.app-switch-host-full]': 'fullWidth',
  },
})
export class Switch implements ControlValueAccessor {
  private readonly generatedId = `app-switch-${++nextSwitchId}`;
  private formDisabled = false;

  @Input() inputId?: string;
  @Input() name?: string;
  @Input() value = 'true';

  @Input() label = '';
  @Input() description = '';
  @Input() labelPosition: SwitchLabelPosition = 'right';

  @Input() size: SwitchSize = 'md';
  @Input() variant: SwitchVariant = 'primary';

  @Input() checked = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() loading = false;
  @Input() required = false;
  @Input() invalid = false;
  @Input() fullWidth = false;

  @Input() onIcon?: AppIconDefinition;
  @Input() offIcon?: AppIconDefinition;

  @Input() ariaLabel?: string;
  @Input() ariaDescribedBy?: string;
  @Input() title?: string;

  @Output() checkedChange = new EventEmitter<boolean>();
  @Output() changed = new EventEmitter<boolean>();

  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

  get resolvedInputId(): string {
    return this.inputId || this.generatedId;
  }

  get descriptionId(): string {
    return `${this.resolvedInputId}-description`;
  }

  get resolvedDescribedBy(): string | null {
    const ids = [this.ariaDescribedBy, this.description ? this.descriptionId : null].filter(
      (id): id is string => Boolean(id),
    );

    return ids.length > 0 ? ids.join(' ') : null;
  }

  get accessibleLabel(): string | null {
    return this.ariaLabel || this.label || null;
  }

  get isDisabled(): boolean {
    return this.disabled || this.formDisabled || this.loading;
  }

  get switchClasses(): Record<string, boolean> {
    return {
      [`app-switch-${this.variant}`]: true,
      [`app-switch-${this.size}`]: true,
      [`app-switch-label-${this.labelPosition}`]: true,
      'app-switch-checked': this.checked,
      'app-switch-disabled': this.isDisabled,
      'app-switch-readonly': this.readonly,
      'app-switch-loading': this.loading,
      'app-switch-invalid': this.invalid,
      'app-switch-full': this.fullWidth,
    };
  }

  writeValue(value: boolean | null | undefined): void {
    this.checked = Boolean(value);
    this.changeDetectorRef.markForCheck();
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled = disabled;
    this.changeDetectorRef.markForCheck();
  }

  handleChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (this.isDisabled || this.readonly) {
      input.checked = this.checked;
      return;
    }

    this.checked = input.checked;
    this.onChange(this.checked);
    this.checkedChange.emit(this.checked);
    this.changed.emit(this.checked);
  }

  handleClick(event: MouseEvent): void {
    if (!this.readonly || this.isDisabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  handleBlur(): void {
    this.onTouched();
  }
}
