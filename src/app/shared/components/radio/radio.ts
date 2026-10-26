import { Tooltip } from '../tooltip/tooltip';
import {
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type RadioSize = 'xs' | 'sm' | 'md' | 'lg';

export type RadioVariant =
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

export type RadioLabelPosition = 'left' | 'right';

export type RadioValue = string | number | boolean | object | null;

export interface RadioChange {
  readonly source: Radio;
  readonly value: RadioValue;
  readonly originalEvent: Event;
}

@Component({
  selector: 'app-radio',
  standalone: true,
  imports: [Tooltip, NgClass],
  templateUrl: './radio.html',
  styleUrl: './radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Radio),
      multi: true,
    },
  ],
  host: {
    '[attr.title]': 'null',
    '[class.app-radio-host-full]': 'fullWidth',
  },
})
export class Radio implements ControlValueAccessor, OnChanges, OnInit, OnDestroy {
  protected readonly hostTooltip = inject(Tooltip, { optional: true, self: true });

  private static nextId = 0;
  private static readonly groups = new Map<string, Set<Radio>>();

  private internalChecked = false;
  private formDisabled = false;
  private hasFormValue = false;
  private formValue: RadioValue = null;
  private initialized = false;
  private registeredName?: string;

  @Input() label = '';
  @Input() description = '';

  @Input({ required: true }) value: RadioValue = null;
  @Input() name?: string;

  @Input() variant: RadioVariant = 'primary';
  @Input() size: RadioSize = 'md';
  @Input() labelPosition: RadioLabelPosition = 'right';

  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() invalid = false;
  @Input() fullWidth = false;

  @Input() inputId = `app-radio-${Radio.nextId++}`;
  @Input() tabIndex = 0;

  @Input() ariaLabel?: string;
  @Input() ariaDescribedBy?: string;
  @Input() title?: string;

  @Input() compareWith: (left: RadioValue, right: RadioValue) => boolean = Object.is;

  @Output() checkedChange = new EventEmitter<boolean>();
  @Output() selected = new EventEmitter<RadioValue>();
  @Output() radioChange = new EventEmitter<RadioChange>();

  private onChange: (value: RadioValue) => void = () => undefined;
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

  get radioClasses(): Record<string, boolean> {
    return {
      [`app-radio-${this.variant}`]: true,
      [`app-radio-${this.size}`]: true,
      [`app-radio-label-${this.labelPosition}`]: true,
      'app-radio-checked': this.checked,
      'app-radio-disabled': this.isDisabled,
      'app-radio-readonly': this.readonly,
      'app-radio-invalid': this.invalid,
      'app-radio-full': this.fullWidth,
    };
  }

  ngOnInit(): void {
    this.initialized = true;
    this.registerWithGroup(this.name);

    if (this.checked) {
      this.selectWithinGroup();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['name'] && this.initialized) {
      this.unregisterFromGroup();
      this.registerWithGroup(this.name);
    }

    if (this.hasFormValue && (changes['value'] || changes['compareWith'])) {
      this.syncCheckedFromFormValue();
    }
  }

  ngOnDestroy(): void {
    this.unregisterFromGroup();
  }

  writeValue(value: RadioValue): void {
    this.hasFormValue = true;
    this.formValue = value;
    this.syncCheckedFromFormValue();
  }

  registerOnChange(fn: (value: RadioValue) => void): void {
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
      event.preventDefault();
      return;
    }

    if (!input.checked) {
      return;
    }

    this.internalChecked = true;
    this.formValue = this.value;
    this.selectWithinGroup();

    this.onChange(this.value);
    this.onTouched();

    this.checkedChange.emit(true);
    this.selected.emit(this.value);
    this.radioChange.emit({
      source: this,
      value: this.value,
      originalEvent: event,
    });
  }

  handleBlur(): void {
    this.onTouched();
  }

  private syncCheckedFromFormValue(): void {
    this.internalChecked = this.compareWith(this.formValue, this.value);

    this.cdr.markForCheck();
  }

  private registerWithGroup(name?: string): void {
    if (!name) {
      return;
    }

    const group = Radio.groups.get(name) ?? new Set<Radio>();
    group.add(this);
    Radio.groups.set(name, group);
    this.registeredName = name;
  }

  private unregisterFromGroup(): void {
    if (!this.registeredName) {
      return;
    }

    const group = Radio.groups.get(this.registeredName);
    group?.delete(this);

    if (group?.size === 0) {
      Radio.groups.delete(this.registeredName);
    }

    this.registeredName = undefined;
  }

  private selectWithinGroup(): void {
    if (!this.registeredName) {
      return;
    }

    const group = Radio.groups.get(this.registeredName);

    group?.forEach((radio) => {
      radio.internalChecked = radio === this;
      radio.cdr.markForCheck();
    });
  }
}
