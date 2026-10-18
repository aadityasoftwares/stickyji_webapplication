import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  forwardRef,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  MatDatepicker,
  MatDatepickerInputEvent,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
  LucideCalendarDays,
  LucideCircleCheck,
  LucideCircleX,
  LucideLoaderCircle,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';
import { UI } from '../../constants/ui.constants';
import { AppIcon, type AppIconDefinition, type AppIconSize, type AppIconTone } from '../icon/icon';
export type DatepickerValue = string | null;
export type DatepickerInputValue = string | Date | null;
export type DatepickerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type DatepickerVariant =
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
export type DatepickerAppearance =
  'outlined' | 'filled' | 'underlined' | 'inline' | 'transparent' | 'bordered' | 'simple';
export type DatepickerDecoration = 'standard' | 'tape';
export type DatepickerShape = 'rounded' | 'soft' | 'square' | 'pill';
export type DatepickerStatus = 'default' | 'success' | 'warning' | 'danger';
export type DatepickerLabelMode = 'top' | 'floating' | 'hidden';
export type DatepickerStartView = 'month' | 'year' | 'multi-year';
@Component({
  selector: 'app-datepicker-input',
  standalone: true,
  imports: [CommonModule, MatDatepickerModule, MatNativeDateModule, AppIcon],
  templateUrl: './datepicker-input.html',
  styleUrl: './datepicker-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatepickerInput),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DatepickerInput),
      multi: true,
    },
  ],
  host: {
    '[class.app-datepicker-host-full]': 'isFullWidth',
  },
})
export class DatepickerInput implements ControlValueAccessor, Validator {
  private static nextId = 0;
  @ViewChild('visibleInput')
  private visibleInput?: ElementRef<HTMLInputElement>;
  @Input()
  variant: DatepickerVariant = 'default';
  @Input()
  appearance: DatepickerAppearance = 'outlined';
  @Input()
  decoration: DatepickerDecoration = 'standard';
  @Input()
  shape: DatepickerShape = 'rounded';
  @Input()
  size: DatepickerSize = 'md';
  @Input()
  status: DatepickerStatus = 'default';
  @Input()
  labelMode: DatepickerLabelMode = 'top';
  @Input()
  label = '';
  @Input()
  labelDescription = '';
  @Input()
  labelHint = '';
  @Input()
  optional = false;
  @Input()
  optionalText = 'Optional';
  @Input()
  requiredText = 'Required';
  @Input()
  placeholder = 'dd-mm-yyyy';
  @Input()
  hint = '';
  @Input()
  errorText = '';
  @Input()
  successText = '';
  @Input()
  warningText = '';
  @Input()
  invalidDateText = 'Enter a valid date in dd-mm-yyyy format.';
  @Input()
  minDateText = 'The selected date is earlier than allowed.';
  @Input()
  maxDateText = 'The selected date is later than allowed.';
  @Input()
  filteredDateText = 'This date cannot be selected.';
  @Input()
  showLeadingIcon = true;
  @Input()
  leadingIcon: AppIconDefinition = LucideCalendarDays;
  @Input()
  leadingIconTone: AppIconTone = 'inherit';
  @Input()
  iconSize: AppIconSize = 'sm';
  @Input()
  showStatusIcon = true;
  @Input()
  inputId?: string;
  @Input()
  name?: string;
  @Input()
  autocomplete = 'off';
  @Input()
  ariaLabel?: string;
  @Input()
  ariaDescribedBy?: string;
  @Input()
  required = false;
  @Input()
  readonly = false;
  @Input()
  clearable = true;
  @Input()
  loading = false;
  @Input()
  fullWidth = true;
  @Input()
  touchUi = false;
  @Input()
  startView: DatepickerStartView = 'month';
  @Input()
  width?: number;
  @Input()
  maxWidth?: number;
  @Input()
  height?: number;
  @Input()
  paddingX?: number;
  @Input()
  radius?: number;
  @Input()
  dateFilter: (date: Date | null) => boolean = () => true;
  @Input()
  get minDate(): DatepickerInputValue {
    return this.minimumDateInput;
  }
  set minDate(value: DatepickerInputValue) {
    this.minimumDateInput = value;
    this.resolvedMinDate = this.parseBoundaryDate(value);
    this.validatorChange();
    this.changeDetector.markForCheck();
  }
  @Input()
  get maxDate(): DatepickerInputValue {
    return this.maximumDateInput;
  }
  set maxDate(value: DatepickerInputValue) {
    this.maximumDateInput = value;
    this.resolvedMaxDate = this.parseBoundaryDate(value);
    this.validatorChange();
    this.changeDetector.markForCheck();
  }
  @Input()
  get value(): DatepickerValue {
    return this.internalUtcValue;
  }
  set value(value: DatepickerInputValue) {
    this.applyExternalValue(value);
  }
  @Input()
  get disabled(): boolean {
    return this.inputDisabled;
  }
  set disabled(value: boolean) {
    this.inputDisabled = value;
    this.changeDetector.markForCheck();
  }
  @Output()
  valueChange = new EventEmitter<DatepickerValue>();
  @Output()
  dateSelected = new EventEmitter<DatepickerValue>();
  @Output()
  inputFocus = new EventEmitter<FocusEvent>();
  @Output()
  inputBlur = new EventEmitter<FocusEvent>();
  @Output()
  pickerOpened = new EventEmitter<void>();
  @Output()
  pickerClosed = new EventEmitter<void>();
  @Output()
  cleared = new EventEmitter<void>();
  readonly generatedId = `app-datepicker-${++DatepickerInput.nextId}`;
  readonly calendarIcon = LucideCalendarDays;
  readonly clearIcon = LucideX;
  readonly loadingIcon = LucideLoaderCircle;
  selectedDate: Date | null = null;
  resolvedMinDate: Date | null = null;
  resolvedMaxDate: Date | null = null;
  displayValue = '';
  focused = false;
  pickerIsOpen = false;
  parseInvalid = false;
  private minimumDateInput: DatepickerInputValue = null;
  private maximumDateInput: DatepickerInputValue = null;
  private internalUtcValue: DatepickerValue = null;
  private inputDisabled = false;
  private formDisabled = false;
  private onChange: (value: DatepickerValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private validatorChange: () => void = () => undefined;
  constructor(private readonly changeDetector: ChangeDetectorRef) {}
  get resolvedId(): string {
    return this.inputId || this.generatedId;
  }
  get messageId(): string | null {
    return this.displayedMessage ? `${this.resolvedId}-message` : null;
  }
  get describedBy(): string | null {
    return [this.ariaDescribedBy, this.messageId].filter(Boolean).join(' ') || null;
  }
  get isDisabled(): boolean {
    return this.inputDisabled || this.formDisabled || this.loading;
  }
  get isFullWidth(): boolean {
    return this.fullWidth && this.width === undefined;
  }
  get hasValue(): boolean {
    return Boolean(this.displayValue.trim());
  }
  get effectiveStatus(): DatepickerStatus {
    if (
      this.errorText ||
      this.parseInvalid ||
      this.hasMinError ||
      this.hasMaxError ||
      this.hasFilterError
    ) {
      return 'danger';
    }
    if (this.warningText) {
      return 'warning';
    }
    if (this.successText) {
      return 'success';
    }
    return this.status;
  }
  get displayedMessage(): string {
    if (this.errorText) {
      return this.errorText;
    }
    if (this.parseInvalid) {
      return this.invalidDateText;
    }
    if (this.hasMinError) {
      return this.minDateText;
    }
    if (this.hasMaxError) {
      return this.maxDateText;
    }
    if (this.hasFilterError) {
      return this.filteredDateText;
    }
    return this.warningText || this.successText || this.hint;
  }
  get hasMinError(): boolean {
    return Boolean(
      this.selectedDate &&
      this.resolvedMinDate &&
      this.compareDateOnly(this.selectedDate, this.resolvedMinDate) < 0,
    );
  }
  get hasMaxError(): boolean {
    return Boolean(
      this.selectedDate &&
      this.resolvedMaxDate &&
      this.compareDateOnly(this.selectedDate, this.resolvedMaxDate) > 0,
    );
  }
  get hasFilterError(): boolean {
    return Boolean(this.selectedDate && !this.dateFilter(this.selectedDate));
  }
  get showClearButton(): boolean {
    return this.clearable && this.hasValue && !this.readonly && !this.isDisabled;
  }
  get statusIcon(): AppIconDefinition | null {
    if (!this.showStatusIcon || this.loading) {
      return null;
    }
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
  get inputHeight(): number {
    return this.height ?? UI.input.height[this.size];
  }
  get inputPaddingX(): number {
    if (this.paddingX !== undefined) {
      return this.paddingX;
    }
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
    if (this.radius !== undefined) {
      return this.radius;
    }
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
  get wrapperClasses(): Record<string, boolean> {
    return {
      [`app-datepicker-${this.variant}`]: true,
      [`app-datepicker-appearance-${this.appearance}`]: true,
      [`app-datepicker-decoration-${this.decoration}`]: true,
      [`app-datepicker-shape-${this.shape}`]: true,
      [`app-datepicker-size-${this.size}`]: true,
      [`app-datepicker-status-${this.effectiveStatus}`]: true,
      [`app-datepicker-label-${this.labelMode}`]: true,
      'app-datepicker-has-leading-icon': this.showLeadingIcon && !!this.leadingIcon,
      'app-datepicker-focused': this.focused || this.pickerIsOpen,
      'app-datepicker-has-value': this.hasValue,
      'app-datepicker-disabled': this.isDisabled,
      'app-datepicker-readonly': this.readonly,
      'app-datepicker-loading': this.loading,
    };
  }
  writeValue(value: DatepickerInputValue): void {
    this.applyExternalValue(value);
  }
  registerOnChange(callback: (value: DatepickerValue) => void): void {
    this.onChange = callback;
  }
  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }
  registerOnValidatorChange(callback: () => void): void {
    this.validatorChange = callback;
  }
  setDisabledState(disabled: boolean): void {
    this.formDisabled = disabled;
    this.changeDetector.markForCheck();
  }
  validate(_control: AbstractControl): ValidationErrors | null {
    const errors: ValidationErrors = {};
    if (this.required && !this.internalUtcValue) {
      errors['required'] = true;
    }
    if (this.parseInvalid) {
      errors['dateParse'] = true;
    }
    if (this.hasMinError) {
      errors['dateMin'] = {
        min: this.toUtcIso(this.resolvedMinDate!),
        actual: this.internalUtcValue,
      };
    }
    if (this.hasMaxError) {
      errors['dateMax'] = {
        max: this.toUtcIso(this.resolvedMaxDate!),
        actual: this.internalUtcValue,
      };
    }
    if (this.hasFilterError) {
      errors['dateFilter'] = true;
    }
    return Object.keys(errors).length ? errors : null;
  }
  handleTextInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value.trim();
    this.displayValue = input.value;
    if (!rawValue) {
      this.parseInvalid = false;
      this.commitDate(null, true);
      return;
    }
    const parsedDate = this.parseDisplayDate(rawValue);
    if (!parsedDate) {
      this.parseInvalid = true;
      this.commitInvalidValue();
      return;
    }
    this.parseInvalid = false;
    this.commitDate(parsedDate, true);
  }
  handleFocus(event: FocusEvent): void {
    this.focused = true;
    this.inputFocus.emit(event);
    this.changeDetector.markForCheck();
  }
  handleBlur(event: FocusEvent): void {
    this.focused = false;
    const rawValue = this.displayValue.trim();
    if (rawValue) {
      const parsedDate = this.parseDisplayDate(rawValue);
      if (!parsedDate) {
        this.parseInvalid = true;
        this.commitInvalidValue();
      } else {
        this.parseInvalid = false;
        this.commitDate(parsedDate, true);
        this.displayValue = this.formatDisplayDate(parsedDate);
      }
    }
    this.onTouched();
    this.validatorChange();
    this.inputBlur.emit(event);
    this.changeDetector.markForCheck();
  }
  handleKeydown(event: KeyboardEvent, picker: MatDatepicker<Date>): void {
    if ((event.altKey && event.key === 'ArrowDown') || event.key === 'F4') {
      event.preventDefault();
      this.openPicker(picker);
      return;
    }
    if (event.key === 'Escape' && picker.opened) {
      event.preventDefault();
      picker.close();
    }
  }
  handlePickerSelection(event: MatDatepickerInputEvent<Date>): void {
    const date = event.value;
    if (!this.isValidDate(date)) {
      return;
    }
    this.parseInvalid = false;
    this.commitDate(date, true);
    this.displayValue = this.formatDisplayDate(date);
    this.dateSelected.emit(this.internalUtcValue);
    this.onTouched();
    this.validatorChange();
    this.changeDetector.markForCheck();
  }
  handlePickerOpened(): void {
    this.pickerIsOpen = true;
    this.pickerOpened.emit();
    this.changeDetector.markForCheck();
  }
  handlePickerClosed(): void {
    this.pickerIsOpen = false;
    this.onTouched();
    this.pickerClosed.emit();
    window.requestAnimationFrame(() => {
      this.visibleInput?.nativeElement.focus({
        preventScroll: true,
      });
    });
    this.changeDetector.markForCheck();
  }
  openPicker(picker: MatDatepicker<Date>): void {
    if (this.isDisabled) {
      return;
    }
    picker.open();
  }
  clear(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.showClearButton) {
      return;
    }
    this.parseInvalid = false;
    this.commitDate(null, true);
    this.displayValue = '';
    this.onTouched();
    this.validatorChange();
    this.cleared.emit();
    this.visibleInput?.nativeElement.focus();
    this.changeDetector.markForCheck();
  }
  private applyExternalValue(value: DatepickerInputValue): void {
    const parsedDate = this.parseBackendDate(value);
    this.selectedDate = parsedDate;
    this.internalUtcValue = parsedDate ? this.toUtcIso(parsedDate) : null;
    this.displayValue = parsedDate ? this.formatDisplayDate(parsedDate) : '';
    this.parseInvalid = false;
    this.validatorChange();
    this.changeDetector.markForCheck();
  }
  private commitDate(date: Date | null, emit: boolean): void {
    const normalizedDate =
      date && this.isValidDate(date)
        ? this.createLocalDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
        : null;
    const utcValue = normalizedDate ? this.toUtcIso(normalizedDate) : null;
    const changed = utcValue !== this.internalUtcValue;
    this.selectedDate = normalizedDate;
    this.internalUtcValue = utcValue;
    if (normalizedDate) {
      this.displayValue = this.formatDisplayDate(normalizedDate);
    } else if (!this.parseInvalid) {
      this.displayValue = '';
    }
    if (emit && changed) {
      this.onChange(this.internalUtcValue);
      this.valueChange.emit(this.internalUtcValue);
    }
    this.validatorChange();
    this.changeDetector.markForCheck();
  }
  private commitInvalidValue(): void {
    const changed = this.internalUtcValue !== null;
    this.selectedDate = null;
    this.internalUtcValue = null;
    if (changed) {
      this.onChange(null);
      this.valueChange.emit(null);
    }
    this.validatorChange();
    this.changeDetector.markForCheck();
  }
  private parseDisplayDate(value: string): Date | null {
    const normalized = value.trim();
    const match = normalized.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (!match) {
      return null;
    }
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    return this.createLocalDate(year, month, day);
  }
  private parseBackendDate(value: DatepickerInputValue): Date | null {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      if (!this.isValidDate(value)) {
        return null;
      }
      return this.createLocalDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
    }
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }
    const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return this.createLocalDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    }
    return this.parseDisplayDate(normalized);
  }
  private parseBoundaryDate(value: DatepickerInputValue): Date | null {
    return this.parseBackendDate(value);
  }
  private createLocalDate(year: number, month: number, day: number): Date | null {
    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day) ||
      year < 1000 ||
      year > 9999 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
    return date;
  }
  private formatDisplayDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}-${month}-${year}`;
  }
  private toUtcIso(date: Date): string {
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
    ).toISOString();
  }
  private compareDateOnly(first: Date, second: Date): number {
    const firstValue = Date.UTC(first.getFullYear(), first.getMonth(), first.getDate());
    const secondValue = Date.UTC(second.getFullYear(), second.getMonth(), second.getDate());
    return firstValue - secondValue;
  }
  private isValidDate(value: Date | null | undefined): value is Date {
    return value instanceof Date && !Number.isNaN(value.getTime());
  }
}
