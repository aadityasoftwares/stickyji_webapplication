import { Tooltip } from '../tooltip/tooltip';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input as AngularInput,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  LucideCircleCheck,
  LucideCircleX,
  LucideEye,
  LucideEyeOff,
  LucideLoaderCircle,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';

import { UI } from '../../constants/ui.constants';
import { AppIcon, type AppIconDefinition, type AppIconSize, type AppIconTone } from '../icon/icon';

export type InputValue = string | number | null;

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'month'
  | 'week';

export type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type InputVariant =
  | 'default'
  | 'paper'
  | 'glass'
  | 'dark'
  | 'auth'
  | 'noteYellow'
  | 'noteOrange'
  | 'notePink'
  | 'noteRed'
  | 'noteGreen'
  | 'noteBlue'
  | 'notePurple'
  | 'noteBrown'
  | 'noteBlack';

export type InputAppearance = 'outlined' | 'filled' | 'underlined' | 'inline' | 'simple';
export type InputDecoration = 'standard' | 'tape';
export type InputShape = 'rounded' | 'soft' | 'square' | 'pill';
export type InputStatus = 'default' | 'success' | 'warning' | 'danger';
export type InputLabelMode = 'top' | 'floating' | 'hidden';
export type InputShadow = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'upside' | 'subtle' | 'soft';
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [Tooltip, CommonModule, AppIcon],
  templateUrl: './input.html',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Input),
      multi: true,
    },
  ],
  host: {
    '[class.app-input-host-full]': 'isFullWidth',
  },
})
export class Input implements ControlValueAccessor, AfterViewInit {
  private static nextId = 0;

  @ViewChild('nativeControl')
  private nativeControl?: ElementRef<HTMLInputElement | HTMLTextAreaElement>;

  @AngularInput() autofocus = false;
  @AngularInput() type: InputType = 'text';
  @AngularInput() variant: InputVariant = 'default';
  @AngularInput() appearance: InputAppearance = 'outlined';
  @AngularInput() decoration: InputDecoration = 'standard';
  @AngularInput() shape: InputShape = 'rounded';
  @AngularInput() size: InputSize = 'md';
  @AngularInput() status: InputStatus = 'default';
  @AngularInput() shadow: InputShadow | boolean = 'none';
  @AngularInput() labelMode: InputLabelMode = 'top';

  @AngularInput() label = '';
  @AngularInput() labelDescription = '';
  @AngularInput() labelHint = '';
  @AngularInput() optional = false;
  @AngularInput() optionalText = 'Optional';
  @AngularInput() requiredText = 'Required';
  @AngularInput() placeholder = '';
  @AngularInput() hint = '';
  @AngularInput() errorText = '';
  @AngularInput() successText = '';
  @AngularInput() warningText = '';
  @AngularInput() prefixText = '';
  @AngularInput() suffixText = '';

  /** Pass an imported Lucide component, for example [leadingIcon]="LucideSearch". */
  @AngularInput() leadingIcon?: AppIconDefinition;
  @AngularInput() trailingIcon?: AppIconDefinition;
  @AngularInput() leadingIconTone: AppIconTone = 'inherit';
  @AngularInput() trailingIconTone: AppIconTone = 'inherit';
  @AngularInput() iconSize: AppIconSize = 'sm';
  @AngularInput() showStatusIcon = true;

  @AngularInput() inputId?: string;
  @AngularInput() name?: string;
  @AngularInput() autocomplete?: string;
  @AngularInput() inputMode?: string;
  @AngularInput() pattern?: string;
  @AngularInput() list?: string;
  @AngularInput() ariaLabel?: string;
  @AngularInput() ariaDescribedBy?: string;

  @AngularInput() min?: number | string;
  @AngularInput() max?: number | string;
  @AngularInput() step?: number | string;
  @AngularInput() minLength?: number;
  @AngularInput() maxLength?: number;

  @AngularInput() required = false;
  @AngularInput() readonly = false;
  @AngularInput() clearable = false;
  @AngularInput() passwordToggle = true;
  @AngularInput() loading = false;
  @AngularInput() showCounter = false;
  @AngularInput() fullWidth = true;
  @AngularInput() spellcheck = false;

  @AngularInput() multiline = false;
  @AngularInput() rows = 4;
  @AngularInput() resize: TextareaResize = 'vertical';

  @AngularInput() width?: number;
  @AngularInput() maxWidth?: number;
  @AngularInput() height?: number;
  @AngularInput() paddingX?: number;
  @AngularInput() radius?: number;
  @AngularInput() customClass = '';

  /**
   * Inline appearance tuning.
   *
   * These only affect appearance="inline" and keep the other
   * appearances fully backward-compatible.
   */
  @AngularInput() inlineHoverBorder = true;
  @AngularInput() inlineFocusRing = true;
  @AngularInput() inlineBackgroundOnHover = true;

  @Output() valueChange = new EventEmitter<InputValue>();
  @Output() inputEvent = new EventEmitter<Event>();
  @Output() inputFocus = new EventEmitter<FocusEvent>();
  @Output() inputBlur = new EventEmitter<FocusEvent>();
  @Output() enterKey = new EventEmitter<KeyboardEvent>();
  @Output() cleared = new EventEmitter<void>();

  readonly generatedId = `app-input-${++Input.nextId}`;
  readonly clearIcon = LucideX;
  readonly loadingIcon = LucideLoaderCircle;

  private internalValue: InputValue = '';
  private inputDisabled = false;
  private formDisabled = false;
  focused = false;
  passwordVisible = false;

  private onChange: (value: InputValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    if (this.autofocus) {
      this.focusControl();
    }
  }

  @AngularInput()
  get value(): InputValue {
    return this.internalValue;
  }

  set value(value: InputValue) {
    this.setValue(value, false);
  }

  @AngularInput()
  get disabled(): boolean {
    return this.inputDisabled;
  }

  set disabled(value: boolean) {
    this.inputDisabled = value;
    this.cdr.markForCheck();
  }

  get resolvedId(): string {
    return this.inputId || this.generatedId;
  }

  get currentType(): InputType {
    return this.type === 'password' && this.passwordVisible ? 'text' : this.type;
  }

  get isDisabled(): boolean {
    return this.inputDisabled || this.formDisabled || this.loading;
  }

  get isFullWidth(): boolean {
    return this.fullWidth && this.width === undefined;
  }

  get effectiveStatus(): InputStatus {
    if (this.errorText) return 'danger';
    if (this.warningText) return 'warning';
    if (this.successText) return 'success';
    return this.status;
  }

  get inputHeight(): number {
    return this.height ?? UI.input.height[this.size];
  }

  get inputPaddingX(): number {
    if (this.paddingX !== undefined) return this.paddingX;

    switch (this.size) {
      case 'xs':
      case 'sm':
        return UI.input.paddingX.sm;
      case 'lg':
      case 'xl':
        return UI.input.paddingX.lg;
      default:
        return UI.input.paddingX.md;
    }
  }

  get inputRadius(): number {
    if (this.radius !== undefined) return this.radius;

    switch (this.shape) {
      case 'square':
        return 0;
      case 'soft':
        return 8;
      case 'pill':
        return UI.radius.pill;
      default:
        return UI.input.radius;
    }
  }

  get hasValue(): boolean {
    return this.internalValue !== null && `${this.internalValue}`.length > 0;
  }

  get showClearButton(): boolean {
    return this.clearable && this.hasValue && !this.readonly && !this.isDisabled;
  }

  get showPasswordButton(): boolean {
    return this.type === 'password' && this.passwordToggle && !this.isDisabled;
  }

  get displayedMessage(): string {
    return this.errorText || this.warningText || this.successText || this.hint;
  }

  get messageId(): string | null {
    return this.displayedMessage ? `${this.resolvedId}-message` : null;
  }

  get counterId(): string | null {
    return this.showCounter && this.maxLength ? `${this.resolvedId}-counter` : null;
  }

  get describedBy(): string | null {
    return [this.ariaDescribedBy, this.messageId, this.counterId].filter(Boolean).join(' ') || null;
  }

  get valueLength(): number {
    return this.internalValue === null ? 0 : `${this.internalValue}`.length;
  }

  get passwordButtonLabel(): string {
    return this.passwordVisible ? 'Hide password' : 'Show password';
  }

  get passwordIcon(): AppIconDefinition {
    return this.passwordVisible ? LucideEyeOff : LucideEye;
  }

  get statusIcon(): AppIconDefinition | null {
    if (!this.showStatusIcon || this.loading) return null;

    switch (this.effectiveStatus) {
      case 'success':
        return LucideCircleCheck;
      case 'warning':
        return LucideTriangleAlert;
      case 'danger':
        return LucideCircleX;
      default:
        return null;
    }
  }

  get statusIconTone(): AppIconTone {
    switch (this.effectiveStatus) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'danger';
      default:
        return 'muted';
    }
  }

  get resolvedShadow(): InputShadow {
    if (this.shadow === true) {
      return 'upside';
    }
    if (!this.shadow || this.shadow === 'none') {
      return 'none';
    }
    return this.shadow;
  }

  get wrapperClasses(): Record<string, boolean> {
    const shadow = this.resolvedShadow;
    const classes: Record<string, boolean> = {
      [`app-input-${this.variant}`]: true,
      [`app-input-appearance-${this.appearance}`]: true,
      [`app-input-decoration-${this.decoration}`]: true,
      [`app-input-shape-${this.shape}`]: true,
      [`app-input-size-${this.size}`]: true,
      [`app-input-status-${this.effectiveStatus}`]: true,
      [`app-input-label-${this.labelMode}`]: true,
      [`app-input-shadow-${shadow}`]: shadow !== 'none',
      'app-input-has-shadow': shadow !== 'none',
      'app-input-focused': this.focused,
      'app-input-has-value': this.hasValue,
      'app-input-disabled': this.isDisabled,
      'app-input-readonly': this.readonly,
      'app-input-loading': this.loading,
      'app-input-multiline': this.multiline,
      'app-input-inline-hover-border': this.appearance === 'inline' && this.inlineHoverBorder,
      'app-input-inline-focus-ring': this.appearance === 'inline' && this.inlineFocusRing,
      'app-input-inline-hover-background':
        this.appearance === 'inline' && this.inlineBackgroundOnHover,
    };

    for (const className of this.customClass.split(/\s+/).filter(Boolean)) {
      classes[className] = true;
    }

    return classes;
  }

  writeValue(value: InputValue): void {
    this.setValue(value ?? '', false);
  }

  registerOnChange(fn: (value: InputValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  handleInput(event: Event): void {
    const control = event.target as HTMLInputElement | HTMLTextAreaElement;
    const value = this.normalizeValue(control.value);
    this.setValue(value, true);
    this.inputEvent.emit(event);
  }

  handleFocus(event: FocusEvent): void {
    this.focused = true;
    this.inputFocus.emit(event);
    this.cdr.markForCheck();
  }

  handleBlur(event: FocusEvent): void {
    this.focused = false;
    this.onTouched();
    this.inputBlur.emit(event);
    this.cdr.markForCheck();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.multiline) this.enterKey.emit(event);
  }

  clear(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.showClearButton) return;

    this.setValue(this.type === 'number' ? null : '', true);
    this.cleared.emit();
    this.focusControl();
  }

  togglePassword(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.showPasswordButton) return;

    this.passwordVisible = !this.passwordVisible;
    this.cdr.markForCheck();
    this.focusControl();
  }

  /**
   * Focuses the native input or textarea control and places cursor at the specified position.
   * Defaults to 'end' to place cursor at the end of existing text.
   */
  focus(position: 'end' | 'start' | 'all' = 'end'): void {
    const el = this.nativeControl?.nativeElement;
    if (!el) return;
    el.focus();
    if (typeof el.setSelectionRange === 'function') {
      const len = el.value?.length ?? 0;
      try {
        if (position === 'end') {
          el.setSelectionRange(len, len);
        } else if (position === 'start') {
          el.setSelectionRange(0, 0);
        } else if (position === 'all') {
          el.setSelectionRange(0, len);
        }
      } catch {
        // Safe fallback
      }
    }
  }

  private focusControl(): void {
    queueMicrotask(() => this.focus('end'));
  }

  private setValue(value: InputValue, emit: boolean): void {
    this.internalValue = value;

    if (emit) {
      this.onChange(value);
      this.valueChange.emit(value);
    }

    this.cdr.markForCheck();
  }

  private normalizeValue(value: string): InputValue {
    if (this.type !== 'number') return value;
    if (value.trim() === '') return null;

    const parsedValue = Number(value);
    return Number.isNaN(parsedValue) ? null : parsedValue;
  }
}
