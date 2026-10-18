import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  booleanAttribute,
  inject,
} from '@angular/core';

/**
 * Focuses an element (or its inner input/textarea) and positions the cursor
 * at the end of the text.
 *
 * @param element Target HTMLElement or wrapper component host.
 * @returns boolean indicating whether an element was focused.
 */
export function focusAtEnd(element: HTMLElement | null | undefined): boolean {
  if (!element) return false;

  let target: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null = null;
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    target = element;
  } else {
    target = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([disabled]), textarea:not([disabled])',
    );
  }

  if (target) {
    target.focus({ preventScroll: false });
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      const len = target.value?.length ?? 0;
      try {
        if (typeof target.setSelectionRange === 'function') {
          target.setSelectionRange(len, len);
        }
      } catch {
        // Safe fallback for types that do not support setSelectionRange (e.g. date, number)
      }
    }
    return true;
  }

  if (typeof element.focus === 'function') {
    element.focus();
    return true;
  }

  return false;
}

const FOCUSABLE_SELECTOR = [
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([disabled]):not([readonly])',
  'textarea:not([disabled]):not([readonly])',
  '[contenteditable="true"]:not([disabled])',
].join(', ');

/**
 * Shared directive for keyboard navigation between form inputs.
 *
 * Usage:
 * - On a container (form, section, or checklist group):
 *   <div class="checklist-group" appFocusNavigation (noNextFocus)="onNoNextFocus($event)">
 *     Navigates with Down Arrow / Enter (next) and Up Arrow (previous).
 *
 * - On an individual input:
 *   <app-input appFocusNext="#nextInputId" />
 */
@Directive({
  selector: '[appFocusNavigation], [appFocusNext]',
  standalone: true,
})
export class FocusNavigationDirective {
  private readonly el = inject(ElementRef);

  @Input('appFocusNavigation') enabled: boolean | '' = true;
  @Input('appFocusNext') nextTargetSelector?: string | HTMLElement;
  @Input() focusContainerSelector?: string;
  @Input({ transform: booleanAttribute }) enableEnter = true;
  @Input({ transform: booleanAttribute }) enableArrowDown = true;
  @Input({ transform: booleanAttribute }) enableArrowUp = true;
  @Input({ transform: booleanAttribute }) focusLoop = false;
  @Input({ transform: booleanAttribute }) focusToEnd = true;

  @Output() readonly focusedNext = new EventEmitter<{ current: HTMLElement; next: HTMLElement }>();
  @Output() readonly focusedPrev = new EventEmitter<{ current: HTMLElement; prev: HTMLElement }>();
  @Output() readonly noNextFocus = new EventEmitter<{ current: HTMLElement; key: string }>();

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.enabled === false) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const key = event.key;
    const isEnter = key === 'Enter';
    const isArrowDown = key === 'ArrowDown';
    const isArrowUp = key === 'ArrowUp';

    if (!isEnter && !isArrowDown && !isArrowUp) return;
    if (isEnter && !this.enableEnter) return;
    if (isArrowDown && !this.enableArrowDown) return;
    if (isArrowUp && !this.enableArrowUp) return;

    const target = event.target as HTMLElement | null;
    if (!target) return;

    // Handle multiline textarea
    if (target instanceof HTMLTextAreaElement) {
      if (isEnter) {
        // Allow regular newlines in textarea
        return;
      }
      if (isArrowDown) {
        // Only navigate if cursor is at the end of text
        if (target.selectionEnd !== target.value.length) return;
      }
      if (isArrowUp) {
        // Only navigate if cursor is at the very beginning
        if (target.selectionStart !== 0) return;
      }
    }

    // Explicit next target specified via [appFocusNext]
    if (this.nextTargetSelector && (isEnter || isArrowDown)) {
      const nextEl =
        typeof this.nextTargetSelector === 'string'
          ? (document.querySelector(this.nextTargetSelector) as HTMLElement | null)
          : this.nextTargetSelector;

      if (nextEl) {
        event.preventDefault();
        if (this.focusToEnd) {
          focusAtEnd(nextEl);
        } else {
          nextEl.focus();
        }
        this.focusedNext.emit({ current: target, next: nextEl });
        return;
      }
    }

    // Find the enclosing navigation container
    const container = this.resolveContainer(target);
    if (!container) return;

    const focusables = this.getFocusableElements(container);
    if (!focusables.length) return;

    const currentIndex = this.findCurrentIndex(focusables, target);
    if (currentIndex === -1) return;

    if (isEnter || isArrowDown) {
      const nextIndex = currentIndex + 1;
      if (nextIndex < focusables.length) {
        event.preventDefault();
        const nextEl = focusables[nextIndex];
        if (this.focusToEnd) {
          focusAtEnd(nextEl);
        } else {
          nextEl.focus();
        }
        this.focusedNext.emit({ current: target, next: nextEl });
      } else if (this.focusLoop && focusables.length > 0) {
        event.preventDefault();
        const nextEl = focusables[0];
        if (this.focusToEnd) {
          focusAtEnd(nextEl);
        } else {
          nextEl.focus();
        }
        this.focusedNext.emit({ current: target, next: nextEl });
      } else {
        this.noNextFocus.emit({ current: target, key });
      }
      return;
    }

    if (isArrowUp && this.enableArrowUp) {
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        event.preventDefault();
        const prevEl = focusables[prevIndex];
        if (this.focusToEnd) {
          focusAtEnd(prevEl);
        } else {
          prevEl.focus();
        }
        this.focusedPrev.emit({ current: target, prev: prevEl });
      }
    }
  }

  private resolveContainer(target: HTMLElement): HTMLElement | null {
    if (this.focusContainerSelector) {
      const customContainer = target.closest<HTMLElement>(this.focusContainerSelector);
      if (customContainer) return customContainer;
    }

    const host = this.el.nativeElement as HTMLElement;
    // If the directive host is a container (not an input itself) and contains target
    if (host && host !== target && host.contains(target)) {
      return host;
    }

    // Otherwise find closest navigation container
    return (
      target.closest<HTMLElement>('[appFocusNavigation]') ||
      target.closest<HTMLElement>('.checklist-group') ||
      target.closest<HTMLElement>('.note-fields') ||
      target.closest<HTMLElement>('form') ||
      host
    );
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const rawList = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    return rawList.filter((el) => {
      // Must be visible
      return el.offsetParent !== null || el.getClientRects().length > 0;
    });
  }

  private findCurrentIndex(list: HTMLElement[], target: HTMLElement): number {
    const exact = list.indexOf(target);
    if (exact !== -1) return exact;

    // Check if target is inside one of the focusable elements
    return list.findIndex((el) => el.contains(target) || target.contains(el));
  }
}

/**
 * Directives for auto-positioning cursor at end of text on focus.
 */
@Directive({
  selector: '[appFocusToEnd]',
  standalone: true,
})
export class FocusToEndDirective {
  @HostListener('focus', ['$event'])
  onFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement | null;
    if (target) {
      queueMicrotask(() => {
        focusAtEnd(target);
      });
    }
  }
}
