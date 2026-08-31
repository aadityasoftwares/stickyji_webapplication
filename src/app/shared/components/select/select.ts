import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {
  LucideCheck,
  LucideChevronDown,
  LucideSearch,
  LucideX,
} from '@lucide/angular';

import {
  AppIcon,
  type AppIconDefinition,
} from '../icon/icon';
import {
  Badge,
  type BadgeVariant,
} from '../badge/badge';
import {
  Avatar,
  type AvatarShape,
  type AvatarStatus,
  type AvatarTone,
} from '../avatar/avatar';
import { Divider } from '../divider/divider';

let selectSequence = 0;

export type SelectValue = string | number | boolean;
export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectVariant = 'default' | 'paper' | 'filled' | 'workspace';
export type SelectPlacement = 'auto' | 'top' | 'bottom';

export interface SelectOptionAvatar {
  src?: string | null;
  alt?: string;
  name?: string;
  initials?: string;
  tone?: AvatarTone;
  status?: AvatarStatus;
  shape?: AvatarShape;
  bordered?: boolean;
  elevated?: boolean;
}

export interface SelectOption {
  label: string;
  value: SelectValue;
  description?: string;
  group?: string;
  icon?: AppIconDefinition;
  avatar?: SelectOptionAvatar;
  badgeLabel?: string;
  badgeVariant?: BadgeVariant;
  badgeDot?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, AppIcon, Avatar, Badge, Divider],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-select-host-full]': 'fullWidth',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Select),
      multi: true,
    },
  ],
})
export class Select implements ControlValueAccessor {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  @Input() options: readonly SelectOption[] = [];
  @Input() label = '';
  @Input() placeholder = 'Select an option';
  @Input() searchPlaceholder = 'Search options...';
  @Input() emptyText = 'No options found';
  @Input() loadingText = 'Loading options...';
  @Input() eyebrow = '';
  @Input() dropdownTitle = '';
  @Input() dropdownDescription = '';
  @Input() hint = '';
  @Input() error = '';

  /** Optional contextual icon displayed at the start of the trigger. */
  @Input() iconLeft?: AppIconDefinition;

  @Input() size: SelectSize = 'md';
  @Input() variant: SelectVariant = 'default';
  @Input() placement: SelectPlacement = 'auto';
  @Input() multiple = false;
  @Input() searchable = false;
  @Input() clearable = true;
  @Input() closeOnSelect = true;
  @Input() showSelectedCount = true;
  @Input() loading = false;
  @Input() required = false;
  @Input() disabled = false;
  @Input() fullWidth = true;
  @Input() maxVisibleSelections = 2;

  @Input() selectId = `app-select-${++selectSequence}`;
  @Input() name?: string;
  @Input() ariaLabel?: string;
  @Input() ariaDescribedBy?: string;

  @Output() selectionChange = new EventEmitter<SelectValue | SelectValue[] | null>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  readonly LucideCheck = LucideCheck;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideSearch = LucideSearch;
  readonly LucideX = LucideX;

  isOpen = false;
  searchTerm = '';
  activeIndex = -1;
  resolvedPlacement: 'top' | 'bottom' = 'bottom';
  value: SelectValue | SelectValue[] | null = null;

  private onChange: (value: SelectValue | SelectValue[] | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private readonly host: ElementRef<HTMLElement>) { }

  get listboxId(): string {
    return `${this.selectId}-listbox`;
  }

  get messageId(): string {
    return `${this.selectId}-message`;
  }

  get selectedOptions(): SelectOption[] {
    const values = this.multiple
      ? (Array.isArray(this.value) ? this.value : [])
      : this.value === null || Array.isArray(this.value)
        ? []
        : [this.value];

    return values
      .map((value) => this.options.find((option) => option.value === value))
      .filter((option): option is SelectOption => Boolean(option));
  }

  get filteredOptions(): SelectOption[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    if (!query) return [...this.options];

    return this.options.filter((option) =>
      `${option.label} ${option.description ?? ''} ${option.group ?? ''}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }

  get visibleSelectionLabels(): string[] {
    return this.selectedOptions
      .slice(0, Math.max(1, this.maxVisibleSelections))
      .map((option) => option.label);
  }

  get hiddenSelectionCount(): number {
    return Math.max(0, this.selectedOptions.length - this.visibleSelectionLabels.length);
  }

  groupCount(group: string | undefined): number {
    if (!group) return 0;
    return this.filteredOptions.filter((option) => option.group === group).length;
  }

  get hasValue(): boolean {
    return this.multiple
      ? Array.isArray(this.value) && this.value.length > 0
      : this.value !== null && !Array.isArray(this.value);
  }

  get describedBy(): string | null {
    return this.ariaDescribedBy || (this.error || this.hint ? this.messageId : null);
  }

  writeValue(value: SelectValue | SelectValue[] | null | undefined): void {
    this.value = this.multiple
      ? (Array.isArray(value) ? [...value] : value == null ? [] : [value])
      : Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
  }

  registerOnChange(fn: (value: SelectValue | SelectValue[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    if (disabled) this.close();
  }

  toggle(): void {
    if (this.disabled || this.loading) return;
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    if (this.disabled || this.loading || this.isOpen) return;
    this.isOpen = true;
    this.resolvePlacement();
    this.activeIndex = this.firstEnabledIndex();
    this.opened.emit();
    this.focusSearchInput();
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.activeIndex = -1;
    this.searchTerm = '';
    this.onTouched();
    this.closed.emit();
  }

  selectOption(option: SelectOption): void {
    if (option.disabled) return;

    if (this.multiple) {
      const values = Array.isArray(this.value) ? [...this.value] : [];
      const index = values.indexOf(option.value);
      index >= 0 ? values.splice(index, 1) : values.push(option.value);
      this.commit(values);
      if (this.closeOnSelect) this.close();
      return;
    }

    this.commit(option.value);
    this.close();
  }

  clear(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.disabled) return;
    this.commit(this.multiple ? [] : null);
  }

  removeSelection(option: SelectOption, event: Event): void {
    event.stopPropagation();
    this.selectOption(option);
  }

  isSelected(option: SelectOption): boolean {
    return this.multiple
      ? Array.isArray(this.value) && this.value.includes(option.value)
      : this.value === option.value;
  }

  isFirstInGroup(index: number): boolean {
    const options = this.filteredOptions;
    return Boolean(options[index]?.group) && options[index - 1]?.group !== options[index].group;
  }

  updateSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.activeIndex = this.firstEnabledIndex();
    this.searchChange.emit(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.activeIndex = this.firstEnabledIndex();
    this.searchChange.emit('');
    this.focusSearchInput();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      this.open();
    }
  }

  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Enter' && this.activeIndex >= 0) {
      event.preventDefault();
      const option = this.filteredOptions[this.activeIndex];
      if (option) this.selectOption(option);
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (this.isOpen && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private commit(value: SelectValue | SelectValue[] | null): void {
    this.value = value;
    this.onChange(value);
    this.selectionChange.emit(value);
  }

  private focusSearchInput(): void {
    if (!this.searchable || typeof window === 'undefined') {
      return;
    }

    window.requestAnimationFrame(() => {
      if (!this.isOpen) {
        return;
      }

      this.searchInput?.nativeElement.focus({ preventScroll: true });
    });
  }

  private resolvePlacement(): void {
    if (this.placement !== 'auto') {
      this.resolvedPlacement = this.placement;
      return;
    }

    const bounds = this.host.nativeElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - bounds.bottom;
    const spaceAbove = bounds.top;
    this.resolvedPlacement = spaceBelow < 330 && spaceAbove > spaceBelow
      ? 'top'
      : 'bottom';
  }

  private firstEnabledIndex(): number {
    return this.filteredOptions.findIndex((option) => !option.disabled);
  }

  private moveActive(direction: 1 | -1): void {
    const options = this.filteredOptions;
    if (!options.length) return;

    let index = this.activeIndex;
    for (let checked = 0; checked < options.length; checked += 1) {
      index = (index + direction + options.length) % options.length;
      if (!options[index]?.disabled) {
        this.activeIndex = index;
        return;
      }
    }
  }
}