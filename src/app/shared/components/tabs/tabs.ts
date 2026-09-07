import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { NgClass } from '@angular/common';

import {
  AppIcon,
  type AppIconDefinition,
} from '../icon/icon';

export type TabValue = string | number;
export type TabVariant = 'segmented' | 'paper' | 'underline';
export type TabShape = 'rounded' | 'pill';
export type TabSize = 'sm' | 'md' | 'lg';
export type TabDensity = 'comfortable' | 'compact';
export type TabOrientation = 'horizontal' | 'vertical';

export interface TabItem {
  value: TabValue;
  label: string;
  icon?: AppIconDefinition;
  count?: string | number | null;
  disabled?: boolean;
  ariaLabel?: string;
  ariaControls?: string;
  id?: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [NgClass, AppIcon],
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tabs {
  @ViewChildren('tabButton')
  private readonly tabButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  @Input() items: readonly TabItem[] = [];
  @Input() value: TabValue | null = null;
  @Input() variant: TabVariant = 'segmented';
  @Input() shape: TabShape = 'rounded';
  @Input() size: TabSize = 'md';
  @Input() density: TabDensity = 'comfortable';
  @Input() orientation: TabOrientation = 'horizontal';
  @Input() ariaLabel = 'Tabs';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input() scrollable = false;
  @Input() minTabWidth?: number;

  @Output() readonly valueChange = new EventEmitter<TabValue>();

  @HostBinding('class.is-full-width')
  get hostFullWidth(): boolean {
    return this.fullWidth;
  }

  get rootClasses(): readonly string[] {
    return [
      `app-tabs-${this.variant}`,
      `app-tabs-${this.size}`,
      `app-tabs-density-${this.density}`,
      `app-tabs-${this.shape}`,
      this.orientation === 'vertical' ? 'is-vertical' : '',
      this.fullWidth ? 'is-full-width' : '',
      this.scrollable ? 'is-scrollable' : '',
      this.disabled ? 'is-disabled' : '',
    ].filter(Boolean);
  }

  trackItem(index: number, item: TabItem): TabValue | string {
    return item.value ?? `tab-${index}`;
  }

  isSelected(item: TabItem): boolean {
    return item.value === this.value;
  }

  itemAriaLabel(item: TabItem): string {
    if (item.ariaLabel) {
      return item.ariaLabel;
    }

    return item.count === null || item.count === undefined
      ? item.label
      : `${item.label}, ${item.count}`;
  }

  tabIndex(item: TabItem): 0 | -1 {
    if (this.disabled || item.disabled) {
      return -1;
    }

    const selectedEnabled = this.items.some(
      candidate => !candidate.disabled && candidate.value === this.value,
    );

    if (selectedEnabled) {
      return this.isSelected(item) ? 0 : -1;
    }

    return this.firstEnabledIndex() === this.items.indexOf(item) ? 0 : -1;
  }

  select(item: TabItem): void {
    if (this.disabled || item.disabled) {
      return;
    }

    if (item.value !== this.value) {
      this.valueChange.emit(item.value);
    }
  }

  onKeydown(event: KeyboardEvent, currentIndex: number): void {
    if (this.disabled) {
      return;
    }

    const horizontal = this.orientation === 'horizontal';
    let nextIndex: number | null = null;

    if (event.key === 'Home') {
      nextIndex = this.firstEnabledIndex();
    } else if (event.key === 'End') {
      nextIndex = this.lastEnabledIndex();
    } else if (
      (horizontal && event.key === 'ArrowRight') ||
      (!horizontal && event.key === 'ArrowDown')
    ) {
      nextIndex = this.nextEnabledIndex(currentIndex, 1);
    } else if (
      (horizontal && event.key === 'ArrowLeft') ||
      (!horizontal && event.key === 'ArrowUp')
    ) {
      nextIndex = this.nextEnabledIndex(currentIndex, -1);
    }

    if (nextIndex === null || nextIndex < 0) {
      return;
    }

    event.preventDefault();

    const nextItem = this.items[nextIndex];
    this.select(nextItem);

    queueMicrotask(() => {
      const button = this.tabButtons.get(nextIndex)?.nativeElement;
      button?.focus();
      button?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }

  private firstEnabledIndex(): number {
    return this.items.findIndex(item => !item.disabled);
  }

  private lastEnabledIndex(): number {
    for (let index = this.items.length - 1; index >= 0; index -= 1) {
      if (!this.items[index].disabled) {
        return index;
      }
    }

    return -1;
  }

  private nextEnabledIndex(currentIndex: number, direction: 1 | -1): number {
    if (!this.items.length) {
      return -1;
    }

    for (let step = 1; step <= this.items.length; step += 1) {
      const index =
        (currentIndex + direction * step + this.items.length) % this.items.length;

      if (!this.items[index].disabled) {
        return index;
      }
    }

    return -1;
  }
}