import { Tooltip } from '../tooltip/tooltip';
import {
  inject,
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

export type CheckboxSize = 'xs' | 'sm' | 'md' | 'lg';

export type CheckboxVariant =
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

export type CheckboxLabelPosition = 'left' | 'right';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [Tooltip, NgClass],
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Checkbox),
      multi: true,
    },
  ],
  host: {
    '[attr.title]': 'null',
    '[class.app-checkbox-host-full]': 'fullWidth',
  },
})
export class Checkbox implements ControlValueAccessor {
  protected readonly hostTooltip = inject(Tooltip, { optional: true, self: true });

  private static nextId = 0;

  private internalChecked = false;
  private formDisabled = false;

  @Input() label = '';
  @Input() description = '';

  @Input() variant: CheckboxVariant = 'primary';
  @Input() size: CheckboxSize = 'md';
  @Input() labelPosition: CheckboxLabelPosition = 'right';

  @Input() indeterminate = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() invalid = false;
  @Input() fullWidth = false;

  @Input() inputId = `app-checkbox-${Checkbox.nextId++}`;
  @Input() name?: string;
  @Input() value?: string;
  @Input() tabIndex = 0;

  @Input() ariaLabel?: string;
  @Input() ariaDescribedBy?: string;
  @Input() title?: string;

  @Output() checkedChange = new EventEmitter<boolean>();
  @Output() checkboxChange = new EventEmitter<boolean>();

  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  @Input()
  get checked(): boolean {
    return this.internalChecked;
  }

  set checked(value: boolean) {
    this.internalChecked = Boolean(value);
  }

  get isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  get resolvedDescriptionId(): string | null {
    return this.description ? `${this.inputId}-description` : null;
  }

  get resolvedAriaDescribedBy(): string | null {
    return this.ariaDescribedBy || this.resolvedDescriptionId;
  }

  get accessibleLabel(): string | null {
    return this.ariaLabel || this.label || null;
  }

  get checkboxClasses(): Record<string, boolean> {
    return {
      [`app-checkbox-${this.variant}`]: true,
      [`app-checkbox-${this.size}`]: true,
      [`app-checkbox-label-${this.labelPosition}`]: true,
      'app-checkbox-checked': this.checked,
      'app-checkbox-indeterminate': this.indeterminate,
      'app-checkbox-disabled': this.isDisabled,
      'app-checkbox-readonly': this.readonly,
      'app-checkbox-invalid': this.invalid,
      'app-checkbox-full': this.fullWidth,
    };
  }

  writeValue(value: boolean | null | undefined): void {
    this.internalChecked = Boolean(value);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled = disabled;
    this.cdr.markForCheck();
  }

  handleChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (this.isDisabled || this.readonly) {
      input.checked = this.internalChecked;
      input.indeterminate = this.indeterminate;
      event.preventDefault();
      return;
    }

    this.indeterminate = false;
    this.internalChecked = input.checked;

    this.onChange(this.internalChecked);
    this.onTouched();
    this.checkedChange.emit(this.internalChecked);
    this.checkboxChange.emit(this.internalChecked);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
