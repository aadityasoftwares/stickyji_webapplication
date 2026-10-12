import {
  CommonModule,
  DOCUMENT,
  isPlatformBrowser,
} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  Renderer2,
  ViewChild,
  forwardRef,
  inject,
} from '@angular/core';
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
import {
  Divider,
} from '../divider/divider';
import { Tooltip } from '../tooltip/tooltip';
let selectSequence = 0;
export type SelectValue =
  | string
  | number
  | boolean;
export type SelectSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl';
export type SelectVariant =
  | 'default'
  | 'paper'
  | 'filled'
  | 'workspace';
/**
 * Controls the visual treatment without changing the Select's
 * data, dropdown, keyboard or CVA behaviour.
 *
 * standard:
 *   Existing Select appearance. This remains the default.
 *
 * inline:
 *   Transparent at rest. Border/background appear only on
 *   hover, keyboard focus or while the dropdown is open.
 */
export type SelectAppearance =
  | 'standard'
  | 'inline'
  | 'transparent'
  | 'outlined'
  | 'simple';
export type SelectShape =
  | 'rounded'
  | 'soft'
  | 'square'
  | 'pill';
export type SelectStatus =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger';
export type SelectPlacement =
  | 'auto'
  | 'top'
  | 'bottom';
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
  color?: string;
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
  imports: [
    CommonModule,
    AppIcon,
    Avatar,
    Badge,
    Divider,
    Tooltip,
  ],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-select-host-full]': 'isFullWidth',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Select),
      multi: true,
    },
  ],
})
export class Select
  implements
  ControlValueAccessor,
  AfterViewInit,
  OnDestroy {
  @ViewChild(
    'trigger',
    {
      static: true,
    },
  )
  private trigger!: ElementRef<HTMLButtonElement>;
  @ViewChild(
    'dropdownPanel',
    {
      static: true,
    },
  )
  private dropdownPanel!: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput')
  private searchInput?: ElementRef<HTMLInputElement>;
  private readonly host =
    inject(ElementRef<HTMLElement>);
  private readonly document =
    inject(DOCUMENT);
  private readonly platformId =
    inject(PLATFORM_ID);
  private readonly renderer =
    inject(Renderer2);
  private readonly changeDetector =
    inject(ChangeDetectorRef);
  private readonly isBrowser =
    isPlatformBrowser(this.platformId);
  private inputDisabled = false;
  private formDisabled = false;
  private frameId: number | null = null;
  private readonly positionListener =
    (): void => {
      this.schedulePosition();
    };
  @Input()
  options: readonly SelectOption[] = [];
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
  placeholder = 'Select an option';
  @Input()
  searchPlaceholder = 'Search options...';
  @Input()
  emptyText = 'No options found';
  @Input()
  loadingText = 'Loading options...';
  @Input()
  eyebrow = '';
  @Input()
  dropdownTitle = '';
  @Input()
  dropdownDescription = '';
  @Input()
  hint = '';
  @Input()
  error = '';
  @Input()
  warningText = '';
  @Input()
  successText = '';
  @Input()
  iconLeft?: AppIconDefinition;
  @Input()
  size: SelectSize = 'md';
  @Input()
  variant: SelectVariant = 'default';
  /**
   * Kept separate from variant so paper / filled / workspace
   * can also use the transparent inline treatment.
   */
  @Input()
  appearance: SelectAppearance = 'standard';
  @Input()
  shape: SelectShape = 'rounded';
  @Input()
  status: SelectStatus = 'default';
  @Input()
  placement: SelectPlacement = 'auto';
  @Input()
  multiple = false;
  @Input()
  searchable = false;
  @Input()
  clearable = true;
  @Input()
  closeOnSelect = true;
  @Input()
  showSelectedCount = true;
  @Input()
  loading = false;
  @Input()
  required = false;
  @Input()
  fullWidth = true;
  @Input()
  maxVisibleSelections = 2;
  @Input()
  width?: number;
  @Input()
  maxWidth?: number;
  @Input()
  height?: number;
  @Input()
  radius?: number;
  /**
   * Inline appearance tuning.
   * These inputs are ignored when appearance="standard".
   */
  @Input()
  inlineHoverBorder = true;
  @Input()
  inlineBackgroundOnHover = true;
  @Input()
  inlineFocusRing = true;
  @Input()
  dropdownMinWidth = 240;
  @Input()
  dropdownMaxHeight = 360;
  @Input()
  dropdownMatchTriggerWidth = true;
  @Input()
  selectId =
    `app-select-${++selectSequence}`;
  @Input()
  name?: string;
  @Input()
  ariaLabel?: string;
  @Input()
  ariaDescribedBy?: string;
  @Input()
  get disabled(): boolean {
    return this.inputDisabled;
  }
  set disabled(value: boolean) {
    this.inputDisabled = value;
    if (this.isDisabled) {
      this.close(false);
    }
    this.changeDetector.markForCheck();
  }
  @Output()
  selectionChange =
    new EventEmitter<
      SelectValue |
      SelectValue[] |
      null
    >();
  @Output()
  searchChange =
    new EventEmitter<string>();
  @Output()
  opened =
    new EventEmitter<void>();
  @Output()
  closed =
    new EventEmitter<void>();
  readonly LucideCheck =
    LucideCheck;
  readonly LucideChevronDown =
    LucideChevronDown;
  readonly LucideSearch =
    LucideSearch;
  readonly LucideX =
    LucideX;
  isOpen = false;
  panelPositioned = false;
  searchTerm = '';
  activeIndex = -1;
  resolvedPlacement:
    | 'top'
    | 'bottom' = 'bottom';
  value:
    | SelectValue
    | SelectValue[]
    | null = null;
  private onChange: (
    value:
      | SelectValue
      | SelectValue[]
      | null,
  ) => void = () => undefined;
  private onTouched:
    () => void = () => undefined;
  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }
    const panel =
      this.dropdownPanel.nativeElement;
    this.renderer.appendChild(
      this.document.body,
      panel,
    );
    window.addEventListener(
      'resize',
      this.positionListener,
      {
        passive: true,
      },
    );
    this.document.addEventListener(
      'scroll',
      this.positionListener,
      true,
    );
  }
  ngOnDestroy(): void {
    if (!this.isBrowser) {
      return;
    }
    window.removeEventListener(
      'resize',
      this.positionListener,
    );
    this.document.removeEventListener(
      'scroll',
      this.positionListener,
      true,
    );
    if (this.frameId !== null) {
      window.cancelAnimationFrame(
        this.frameId,
      );
      this.frameId = null;
    }
    const panel =
      this.dropdownPanel?.nativeElement;
    if (panel?.parentNode) {
      this.renderer.removeChild(
        panel.parentNode,
        panel,
      );
    }
  }
  get listboxId(): string {
    return `${this.selectId}-listbox`;
  }
  get messageId(): string {
    return `${this.selectId}-message`;
  }
  get activeOptionId(): string | null {
    if (
      !this.isOpen ||
      this.activeIndex < 0
    ) {
      return null;
    }
    return this.optionId(
      this.activeIndex,
    );
  }
  get isDisabled(): boolean {
    return (
      this.inputDisabled ||
      this.formDisabled ||
      this.loading
    );
  }
  get isFullWidth(): boolean {
    return (
      this.fullWidth &&
      this.width === undefined
    );
  }
  get effectiveStatus(): SelectStatus {
    if (this.error) {
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
    return (
      this.error ||
      this.warningText ||
      this.successText ||
      this.hint
    );
  }
  get describedBy(): string | null {
    const ids = [
      this.ariaDescribedBy,
      this.displayedMessage
        ? this.messageId
        : null,
    ].filter(Boolean);
    return ids.join(' ') || null;
  }
  get resolvedHeight(): number {
    if (this.height !== undefined) {
      return this.height;
    }
    if (this.variant === 'workspace') {
      return 58;
    }
    const heights:
      Record<SelectSize, number> = {
      xs: 34,
      sm: 38,
      md: 42,
      lg: 48,
      xl: 54,
    };
    return heights[this.size];
  }
  get resolvedRadius(): number {
    if (this.radius !== undefined) {
      return this.radius;
    }
    if (this.variant === 'workspace') {
      return 14;
    }
    switch (this.shape) {
      case 'square':
        return 0;
      case 'soft':
        return 8;
      case 'pill':
        return 999;
      default:
        return 12;
    }
  }
  get resolvedPaddingX(): number {
    switch (this.size) {
      case 'xs':
      case 'sm':
        return 10;
      case 'lg':
      case 'xl':
        return 15;
      default:
        return 12;
    }
  }
  get hasSecondaryAction(): boolean {
    return this.loading || (this.clearable && this.hasValue && !this.isDisabled);
  }
  get selectedLabel(): string {
    return this.selectedOptions.map(option => option.label).join(', ');
  }
  get wrapperClasses():
    Record<string, boolean> {
    return {
      [`app-select-${this.variant}`]:
        true,
      [`app-select-appearance-${this.appearance}`]:
        true,
      [`app-select-size-${this.size}`]:
        true,
      [`app-select-shape-${this.shape}`]:
        true,
      [`app-select-status-${this.effectiveStatus}`]:
        true,
      'app-select-has-secondary-action': this.hasSecondaryAction,
      'app-select-open':
        this.isOpen,
      'app-select-disabled':
        this.isDisabled,
      'app-select-has-value':
        this.hasValue,
      'app-select-multiple':
        this.multiple,
      'app-select-inline-hover-border':
        this.appearance === 'inline' &&
        this.inlineHoverBorder,
      'app-select-inline-hover-background':
        this.appearance === 'inline' &&
        this.inlineBackgroundOnHover,
      'app-select-inline-focus-ring':
        this.appearance === 'inline' &&
        this.inlineFocusRing,
    };
  }
  get selectedOptions():
    SelectOption[] {
    const values =
      this.multiple
        ? Array.isArray(this.value)
          ? this.value
          : []
        : this.value === null ||
          Array.isArray(this.value)
          ? []
          : [this.value];
    return values
      .map(value =>
        this.options.find(
          option =>
            option.value === value,
        ),
      )
      .filter(
        (
          option,
        ): option is SelectOption =>
          Boolean(option),
      );
  }
  get filteredOptions():
    SelectOption[] {
    const query =
      this.searchTerm
        .trim()
        .toLocaleLowerCase();
    if (!query) {
      return [...this.options];
    }
    return this.options.filter(
      option =>
        `${option.label} ${option.description ?? ''
          } ${option.group ?? ''}`
          .toLocaleLowerCase()
          .includes(query),
    );
  }
  get visibleSelectedOptions():
    SelectOption[] {
    return this.selectedOptions.slice(
      0,
      Math.max(
        1,
        this.maxVisibleSelections,
      ),
    );
  }
  get hiddenSelectionCount(): number {
    return Math.max(
      0,
      this.selectedOptions.length -
      this.visibleSelectedOptions.length,
    );
  }
  get hasValue(): boolean {
    return this.multiple
      ? (
        Array.isArray(this.value) &&
        this.value.length > 0
      )
      : (
        this.value !== null &&
        !Array.isArray(this.value)
      );
  }
  optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }
  groupCount(
    group: string | undefined,
  ): number {
    if (!group) {
      return 0;
    }
    return this.filteredOptions.filter(
      option =>
        option.group === group,
    ).length;
  }
  isSelected(
    option: SelectOption,
  ): boolean {
    return this.multiple
      ? (
        Array.isArray(this.value) &&
        this.value.includes(option.value)
      )
      : this.value === option.value;
  }
  isFirstInGroup(
    index: number,
  ): boolean {
    const options =
      this.filteredOptions;
    return (
      Boolean(options[index]?.group) &&
      options[index - 1]?.group !==
      options[index]?.group
    );
  }
  writeValue(
    value:
      | SelectValue
      | SelectValue[]
      | null
      | undefined,
  ): void {
    this.value =
      this.multiple
        ? Array.isArray(value)
          ? [...value]
          : value == null
            ? []
            : [value]
        : Array.isArray(value)
          ? value[0] ?? null
          : value ?? null;
    this.changeDetector.markForCheck();
  }
  registerOnChange(
    callback: (
      value:
        | SelectValue
        | SelectValue[]
        | null,
    ) => void,
  ): void {
    this.onChange = callback;
  }
  registerOnTouched(
    callback: () => void,
  ): void {
    this.onTouched = callback;
  }
  setDisabledState(
    disabled: boolean,
  ): void {
    this.formDisabled = disabled;
    if (this.isDisabled) {
      this.close(false);
    }
    this.changeDetector.markForCheck();
  }
  toggle(): void {
    if (this.isDisabled) {
      return;
    }
    if (this.isOpen) {
      this.close(false);
    } else {
      this.open();
    }
  }
  open(
    startAtLast = false,
  ): void {
    if (
      this.isDisabled ||
      this.isOpen
    ) {
      return;
    }
    this.isOpen = true;
    this.panelPositioned = false;
    this.activeIndex =
      this.initialActiveIndex(
        startAtLast,
      );
    this.changeDetector.detectChanges();
    this.positionDropdown();
    this.opened.emit();
    this.focusSearchField();
  }
  close(
    restoreFocus = false,
  ): void {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    this.panelPositioned = false;
    this.activeIndex = -1;
    this.searchTerm = '';
    this.onTouched();
    this.closed.emit();
    this.changeDetector.markForCheck();
    if (
      restoreFocus &&
      this.isBrowser
    ) {
      window.requestAnimationFrame(
        () => {
          this.trigger.nativeElement.focus({
            preventScroll: true,
          });
        },
      );
    }
  }
  selectOption(
    option: SelectOption,
  ): void {
    if (
      option.disabled ||
      this.isDisabled
    ) {
      return;
    }
    if (this.multiple) {
      const values =
        Array.isArray(this.value)
          ? [...this.value]
          : [];
      const index =
        values.indexOf(option.value);
      if (index >= 0) {
        values.splice(index, 1);
      } else {
        values.push(option.value);
      }
      this.commit(values);
      if (this.closeOnSelect) {
        this.close(true);
      }
      return;
    }
    this.commit(option.value);
    this.close(true);
  }
  clear(
    event?: Event,
  ): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (
      this.isDisabled ||
      !this.hasValue
    ) {
      return;
    }
    this.commit(
      this.multiple
        ? []
        : null,
    );
    this.onTouched();
    this.trigger.nativeElement.focus();
  }
  removeSelection(
    option: SelectOption,
    event: Event,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    if (
      !this.multiple ||
      !Array.isArray(this.value)
    ) {
      return;
    }
    this.commit(
      this.value.filter(
        value =>
          value !== option.value,
      ),
    );
  }
  updateSearch(
    event: Event,
  ): void {
    this.searchTerm =
      (
        event.target as HTMLInputElement
      ).value;
    this.activeIndex =
      this.firstEnabledIndex();
    this.searchChange.emit(
      this.searchTerm,
    );
    this.schedulePosition();
  }
  clearSearch(): void {
    this.searchTerm = '';
    this.activeIndex =
      this.firstEnabledIndex();
    this.searchChange.emit('');
    this.focusSearchField();
    this.schedulePosition();
  }
  onTriggerKeydown(
    event: KeyboardEvent,
  ): void {
    if (this.isDisabled) {
      return;
    }
    if (event.key === 'Escape') {
      if (this.isOpen) {
        event.preventDefault();
        this.close(true);
      }
      return;
    }
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp'
    ) {
      event.preventDefault();
      if (!this.isOpen) {
        this.open(
          event.key === 'ArrowUp',
        );
        return;
      }
      this.moveActive(
        event.key === 'ArrowDown'
          ? 1
          : -1,
      );
      return;
    }
    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      if (!this.isOpen) {
        this.open();
        return;
      }
      const option =
        this.filteredOptions[
        this.activeIndex
        ];
      if (option) {
        this.selectOption(option);
      }
    }
  }
  onPanelKeydown(
    event: KeyboardEvent,
  ): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
      return;
    }
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp'
    ) {
      event.preventDefault();
      this.moveActive(
        event.key === 'ArrowDown'
          ? 1
          : -1,
      );
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      this.activeIndex =
        this.firstEnabledIndex();
      this.scrollActiveOptionIntoView();
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      this.activeIndex =
        this.lastEnabledIndex();
      this.scrollActiveOptionIntoView();
      return;
    }
    if (
      event.key === 'Enter' &&
      this.activeIndex >= 0
    ) {
      event.preventDefault();
      const option =
        this.filteredOptions[
        this.activeIndex
        ];
      if (option) {
        this.selectOption(option);
      }
    }
  }
  @HostListener(
    'document:pointerdown',
    ['$event'],
  )
  onDocumentPointerDown(
    event: PointerEvent,
  ): void {
    if (!this.isOpen) {
      return;
    }
    const target =
      event.target as Node;
    const insideTrigger =
      this.host.nativeElement.contains(
        target,
      );
    const insideDropdown =
      this.dropdownPanel.nativeElement
        .contains(target);
    if (
      !insideTrigger &&
      !insideDropdown
    ) {
      this.close(false);
    }
  }
  @HostListener(
    'document:focusin',
    ['$event'],
  )
  onDocumentFocusIn(
    event: FocusEvent,
  ): void {
    if (!this.isOpen) {
      return;
    }
    const target =
      event.target as Node;
    if (
      this.host.nativeElement.contains(
        target,
      ) ||
      this.dropdownPanel.nativeElement
        .contains(target)
    ) {
      return;
    }
    this.close(false);
  }
  private commit(
    value:
      | SelectValue
      | SelectValue[]
      | null,
  ): void {
    this.value = value;
    this.onChange(value);
    this.selectionChange.emit(value);
    this.changeDetector.markForCheck();
  }
  private initialActiveIndex(
    startAtLast: boolean,
  ): number {
    if (startAtLast) {
      return this.lastEnabledIndex();
    }
    const selectedIndex =
      this.filteredOptions.findIndex(
        option =>
          !option.disabled &&
          this.isSelected(option),
      );
    return selectedIndex >= 0
      ? selectedIndex
      : this.firstEnabledIndex();
  }
  private firstEnabledIndex(): number {
    return this.filteredOptions.findIndex(
      option =>
        !option.disabled,
    );
  }
  private lastEnabledIndex(): number {
    for (
      let index =
        this.filteredOptions.length - 1;
      index >= 0;
      index -= 1
    ) {
      if (
        !this.filteredOptions[index]
          ?.disabled
      ) {
        return index;
      }
    }
    return -1;
  }
  private moveActive(
    direction: 1 | -1,
  ): void {
    const options =
      this.filteredOptions;
    if (!options.length) {
      return;
    }
    let index =
      this.activeIndex;
    for (
      let checked = 0;
      checked < options.length;
      checked += 1
    ) {
      index =
        (
          index +
          direction +
          options.length
        ) % options.length;
      if (!options[index]?.disabled) {
        this.activeIndex = index;
        this.changeDetector.markForCheck();
        this.scrollActiveOptionIntoView();
        return;
      }
    }
  }
  private focusSearchField(): void {
    if (
      !this.searchable ||
      !this.isBrowser
    ) {
      return;
    }
    window.requestAnimationFrame(
      () => {
        if (!this.isOpen) {
          return;
        }
        this.searchInput?.nativeElement
          .focus({
            preventScroll: true,
          });
      },
    );
  }
  private scrollActiveOptionIntoView():
    void {
    if (
      !this.isBrowser ||
      this.activeIndex < 0
    ) {
      return;
    }
    window.requestAnimationFrame(
      () => {
        const option =
          this.dropdownPanel.nativeElement
            .querySelector<HTMLElement>(
              `[data-option-index="${this.activeIndex
              }"]`,
            );
        option?.scrollIntoView({
          block: 'nearest',
        });
      },
    );
  }
  private schedulePosition(): void {
    if (
      !this.isBrowser ||
      !this.isOpen
    ) {
      return;
    }
    if (this.frameId !== null) {
      window.cancelAnimationFrame(
        this.frameId,
      );
    }
    this.frameId =
      window.requestAnimationFrame(
        () => {
          this.frameId = null;
          this.positionDropdown();
        },
      );
  }
  private positionDropdown(): void {
    if (
      !this.isBrowser ||
      !this.isOpen
    ) {
      return;
    }
    const trigger =
      this.trigger.nativeElement;
    const panel =
      this.dropdownPanel.nativeElement;
    const bounds =
      trigger.getBoundingClientRect();
    const viewportWidth =
      window.innerWidth;
    const viewportHeight =
      window.innerHeight;
    const viewportMargin = 8;
    const triggerGap = 8;
    const spaceBelow =
      viewportHeight -
      bounds.bottom -
      viewportMargin -
      triggerGap;
    const spaceAbove =
      bounds.top -
      viewportMargin -
      triggerGap;
    if (this.placement === 'auto') {
      const minimumComfortableSpace =
        Math.min(
          260,
          this.dropdownMaxHeight,
        );
      this.resolvedPlacement =
        spaceBelow <
          minimumComfortableSpace &&
          spaceAbove > spaceBelow
          ? 'top'
          : 'bottom';
    } else {
      this.resolvedPlacement =
        this.placement;
    }
    const minimumWidth =
      this.variant === 'workspace'
        ? Math.max(
          this.dropdownMinWidth,
          285,
        )
        : this.dropdownMinWidth;
    let panelWidth =
      this.dropdownMatchTriggerWidth
        ? Math.max(
          bounds.width,
          minimumWidth,
        )
        : minimumWidth;
    panelWidth = Math.min(
      panelWidth,
      viewportWidth -
      viewportMargin * 2,
    );
    const maximumLeft =
      viewportWidth -
      panelWidth -
      viewportMargin;
    const panelLeft =
      Math.min(
        Math.max(
          bounds.left,
          viewportMargin,
        ),
        Math.max(
          viewportMargin,
          maximumLeft,
        ),
      );
    const availableSpace =
      this.resolvedPlacement ===
        'bottom'
        ? spaceBelow
        : spaceAbove;
    const panelMaxHeight =
      Math.max(
        96,
        Math.min(
          this.dropdownMaxHeight,
          availableSpace,
        ),
      );
    this.renderer.setStyle(
      panel,
      'left',
      `${panelLeft}px`,
    );
    this.renderer.setStyle(
      panel,
      'width',
      `${panelWidth}px`,
    );
    this.renderer.setStyle(
      panel,
      'max-height',
      `${panelMaxHeight}px`,
    );
    this.changeDetector.detectChanges();
    const measuredHeight =
      Math.min(
        panel.scrollHeight,
        panelMaxHeight,
      );
    const rawTop =
      this.resolvedPlacement ===
        'bottom'
        ? bounds.bottom + triggerGap
        : bounds.top -
        triggerGap -
        measuredHeight;
    const maximumTop =
      viewportHeight -
      measuredHeight -
      viewportMargin;
    const panelTop =
      Math.min(
        Math.max(
          rawTop,
          viewportMargin,
        ),
        Math.max(
          viewportMargin,
          maximumTop,
        ),
      );
    this.renderer.setStyle(
      panel,
      'top',
      `${panelTop}px`,
    );
    this.panelPositioned = true;
    this.changeDetector.detectChanges();
  }
}
