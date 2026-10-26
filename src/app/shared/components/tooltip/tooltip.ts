import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export type TooltipPosition =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export type TooltipTone =
  | 'dark'
  | 'paper'
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

export type TooltipSize = 'sm' | 'md' | 'lg';
export type TooltipTrigger = 'hover-focus' | 'hover' | 'focus' | 'click' | 'manual';

interface TooltipCoordinates {
  left: number;
  top: number;
}

let nextTooltipId = 0;

@Directive({
  selector: '[appTooltip]',
  standalone: true,
  exportAs: 'appTooltip',
})
export class Tooltip implements AfterViewInit, OnChanges, OnDestroy {
  @Input({
    alias: 'appTooltip',
    required: true,
    transform: (value: unknown) => String(value ?? ''),
  })
  text = '';

  @Input() tooltipPosition: TooltipPosition = 'top';
  @Input() tooltipTone: TooltipTone = 'dark';
  @Input() tooltipSize: TooltipSize = 'md';
  @Input() tooltipTrigger: TooltipTrigger = 'hover';

  @Input() tooltipDelay = 180;
  @Input() tooltipHideDelay = 80;
  @Input() tooltipOffset = 10;
  @Input() tooltipMaxWidth = 280;
  @Input() tooltipShowArrow = true;
  @Input() tooltipDisabled = false;
  @Input() tooltipOpen = false;

  @Output() tooltipOpenChange = new EventEmitter<boolean>();

  private readonly tooltipId = `app-tooltip-${++nextTooltipId}`;
  private readonly isBrowser: boolean;

  private anchorElement?: HTMLElement;
  private titleObserver?: MutationObserver;
  private tooltipElement?: HTMLDivElement;
  private arrowElement?: HTMLSpanElement;

  private showTimer?: ReturnType<typeof setTimeout>;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private destroyTimer?: ReturnType<typeof setTimeout>;
  private animationFrame?: number;

  private removeOutsideListener?: () => void;
  private readonly removeAnchorListeners: Array<() => void> = [];

  private visible = false;
  private hovered = false;
  private focused = false;
  private initialized = false;

  private readonly interactiveSelector = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[role="button"]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  private readonly viewportChangeHandler = () => {
    if (this.visible) {
      this.positionTooltip();
    }
  };

  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2,
    private readonly ngZone: NgZone,
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.anchorElement = this.resolveAnchorElement();
    this.suppressNativeTooltip();
    this.observeNativeTitles();
    this.bindAnchorEvents();
    this.bindViewportEvents();
    this.initialized = true;

    if (this.tooltipTrigger === 'manual' && this.tooltipOpen) {
      this.show();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tooltipDisabled']?.currentValue === true) {
      this.hide(true);
      return;
    }

    if (changes['text'] && !this.text.trim()) {
      this.hide(true);
      return;
    }

    if (this.tooltipElement) {
      this.syncTooltipElement();

      if (this.visible) {
        this.positionTooltip();
      }
    }

    if (this.initialized && changes['tooltipOpen'] && this.tooltipTrigger === 'manual') {
      this.tooltipOpen ? this.show() : this.hide(true);
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.cancelAnimationFrame();
    this.removeOutsideListener?.();
    this.removeOutsideListener = undefined;

    for (const removeListener of this.removeAnchorListeners) {
      removeListener();
    }

    this.removeAnchorListeners.length = 0;
    this.unbindViewportEvents();
    this.removeAriaDescription();
    this.titleObserver?.disconnect();
    this.titleObserver = undefined;
    this.destroyTooltip();
  }

  /** Public method for exportAs="appTooltip" usage. */
  show(): void {
    if (!this.canShow()) {
      return;
    }

    this.clearHideTimers();

    if (this.visible) {
      this.syncTooltipElement();
      this.positionTooltip();
      return;
    }

    if (this.showTimer) {
      return;
    }

    const delay = Math.max(0, Number(this.tooltipDelay) || 0);

    if (delay === 0) {
      this.showNow();
      return;
    }

    this.showTimer = setTimeout(() => {
      this.showTimer = undefined;
      this.showNow();
    }, delay);
  }

  /** Public method for exportAs="appTooltip" usage. */
  hide(immediate = false): void {
    this.clearShowTimer();

    if (!this.visible && !this.tooltipElement) {
      return;
    }

    this.clearHideTimers();

    if (immediate) {
      this.hideNow(true);
      return;
    }

    const delay = Math.max(0, Number(this.tooltipHideDelay) || 0);

    if (delay === 0) {
      this.hideNow(false);
      return;
    }

    this.hideTimer = setTimeout(() => {
      this.hideTimer = undefined;
      this.hideNow(false);
    }, delay);
  }

  /** Public convenience method. */
  toggle(): void {
    if (this.visible || this.showTimer) {
      this.hide(true);
    } else {
      this.show();
    }
  }

  private bindAnchorEvents(): void {
    const anchor = this.anchorElement;

    if (!anchor) {
      return;
    }

    this.removeAnchorListeners.push(
      this.renderer.listen(anchor, 'pointerenter', (event: PointerEvent) => {
        if (event.pointerType === 'touch') {
          return;
        }

        this.hovered = true;

        if (this.tooltipTrigger === 'hover' || this.tooltipTrigger === 'hover-focus') {
          this.show();
        }
      }),
    );

    this.removeAnchorListeners.push(
      this.renderer.listen(anchor, 'pointerleave', (event: PointerEvent) => {
        if (event.pointerType === 'touch') {
          return;
        }

        this.hovered = false;

        if (this.tooltipTrigger === 'hover' || this.tooltipTrigger === 'hover-focus') {
          this.hideWhenInactive();
        }
      }),
    );

    // Mouse fallback for environments where PointerEvent is unavailable.
    if (!this.document.defaultView?.PointerEvent) {
      this.removeAnchorListeners.push(
        this.renderer.listen(anchor, 'mouseenter', () => {
          this.hovered = true;

          if (this.tooltipTrigger === 'hover' || this.tooltipTrigger === 'hover-focus') {
            this.show();
          }
        }),
      );

      this.removeAnchorListeners.push(
        this.renderer.listen(anchor, 'mouseleave', () => {
          this.hovered = false;

          if (this.tooltipTrigger === 'hover' || this.tooltipTrigger === 'hover-focus') {
            this.hideWhenInactive();
          }
        }),
      );
    }

    this.removeAnchorListeners.push(
      this.renderer.listen(anchor, 'focusin', () => {
        const usesFocus = this.tooltipTrigger === 'focus' || this.tooltipTrigger === 'hover-focus';
        this.focused = usesFocus;
        if (usesFocus) this.show();
      }),
    );

    this.removeAnchorListeners.push(
      this.renderer.listen(anchor, 'focusout', (event: FocusEvent) => {
        const nextTarget = event.relatedTarget as Node | null;

        if (nextTarget && anchor.contains(nextTarget)) {
          return;
        }

        this.focused = false;

        if (this.tooltipTrigger === 'focus' || this.tooltipTrigger === 'hover-focus') {
          this.hideWhenInactive();
        }
      }),
    );

    this.removeAnchorListeners.push(
      this.renderer.listen(anchor, 'click', () => {
        if (this.tooltipTrigger === 'click') {
          this.toggle();
        } else if (this.tooltipTrigger !== 'manual') {
          this.hide(true);
        }
      }),
    );

    this.removeAnchorListeners.push(
      this.renderer.listen(anchor, 'keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          this.hide(true);
        }
      }),
    );
  }

  private bindViewportEvents(): void {
    const view = this.document.defaultView;

    if (!view) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      view.addEventListener('resize', this.viewportChangeHandler, {
        passive: true,
      });

      // capture=true catches scrolling inside nested app panels/containers too.
      view.addEventListener('scroll', this.viewportChangeHandler, {
        passive: true,
        capture: true,
      });
    });
  }

  private unbindViewportEvents(): void {
    const view = this.document.defaultView;

    if (!view) {
      return;
    }

    view.removeEventListener('resize', this.viewportChangeHandler);
    view.removeEventListener('scroll', this.viewportChangeHandler, true);
  }

  private showNow(): void {
    this.showTimer = undefined;

    if (!this.canShow()) {
      return;
    }

    this.clearHideTimers();
    this.createTooltip();
    this.syncTooltipElement();

    if (!this.tooltipElement) {
      return;
    }

    this.visible = true;
    this.addAriaDescription();
    this.positionTooltip();

    if (this.tooltipTrigger === 'click') {
      this.listenForOutsideClick();
    }

    this.cancelAnimationFrame();

    const view = this.document.defaultView;

    const reveal = () => {
      this.animationFrame = undefined;

      if (!this.visible || !this.tooltipElement) {
        return;
      }

      this.positionTooltip();
      this.tooltipElement.classList.add('app-tooltip-ready');
    };

    if (view?.requestAnimationFrame) {
      this.animationFrame = view.requestAnimationFrame(reveal);
    } else {
      setTimeout(reveal, 0);
    }

    this.tooltipOpenChange.emit(true);
  }

  private hideNow(immediate: boolean): void {
    this.hideTimer = undefined;
    this.cancelAnimationFrame();

    const wasVisible = this.visible;
    this.visible = false;

    this.removeOutsideListener?.();
    this.removeOutsideListener = undefined;
    this.removeAriaDescription();

    if (this.tooltipElement) {
      this.tooltipElement.classList.remove('app-tooltip-ready');
    }

    if (wasVisible) {
      this.tooltipOpenChange.emit(false);
    }

    if (immediate) {
      this.destroyTooltip();
      return;
    }

    this.destroyTimer = setTimeout(() => {
      this.destroyTimer = undefined;
      this.destroyTooltip();
    }, 140);
  }

  private createTooltip(): void {
    if (this.tooltipElement || !this.isBrowser) {
      return;
    }

    const tooltip = this.renderer.createElement('div') as HTMLDivElement;
    const text = this.renderer.createElement('span') as HTMLSpanElement;

    this.renderer.setAttribute(tooltip, 'id', this.tooltipId);
    this.renderer.setAttribute(tooltip, 'role', 'tooltip');
    this.renderer.addClass(tooltip, 'app-tooltip-panel');

    this.renderer.addClass(text, 'app-tooltip-text');
    this.renderer.appendChild(tooltip, text);

    this.tooltipElement = tooltip;

    if (this.tooltipShowArrow) {
      this.createArrow();
    }

    // document.body avoids clipping from cards, sidebars, dialogs and overflow containers.
    this.renderer.appendChild(this.document.body, tooltip);
  }

  private createArrow(): void {
    if (!this.tooltipElement || this.arrowElement) {
      return;
    }

    const arrow = this.renderer.createElement('span') as HTMLSpanElement;
    this.renderer.addClass(arrow, 'app-tooltip-arrow');
    this.renderer.setAttribute(arrow, 'aria-hidden', 'true');
    this.renderer.appendChild(this.tooltipElement, arrow);
    this.arrowElement = arrow;
  }

  private removeArrow(): void {
    if (!this.tooltipElement || !this.arrowElement) {
      return;
    }

    this.renderer.removeChild(this.tooltipElement, this.arrowElement);
    this.arrowElement = undefined;
  }

  private syncTooltipElement(): void {
    const tooltip = this.tooltipElement;

    if (!tooltip) {
      return;
    }

    const textElement = tooltip.querySelector('.app-tooltip-text') as HTMLSpanElement | null;

    if (textElement) {
      textElement.textContent = this.text.trim();
    }

    tooltip.className = [
      'app-tooltip-panel',
      `app-tooltip-${this.tooltipTone}`,
      `app-tooltip-${this.tooltipSize}`,
      `app-tooltip-placement-${this.tooltipPosition}`,
      this.visible ? 'app-tooltip-ready' : '',
    ]
      .filter(Boolean)
      .join(' ');

    tooltip.style.maxWidth = `${Math.max(120, Number(this.tooltipMaxWidth) || 280)}px`;

    if (this.tooltipShowArrow) {
      this.createArrow();
    } else {
      this.removeArrow();
    }
  }

  private positionTooltip(): void {
    const tooltip = this.tooltipElement;
    const anchor = this.anchorElement ?? this.resolveAnchorElement();
    const view = this.document.defaultView;

    if (!tooltip || !anchor || !view) {
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();

    if (anchorRect.width <= 0 && anchorRect.height <= 0) {
      return;
    }

    // The tooltip is in the DOM and visibility:hidden/opacity:0 still allows measurement.
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 8;
    const placements = this.getPlacementCandidates(this.tooltipPosition);

    let selectedPlacement = placements[0];
    let coordinates = this.calculateCoordinates(selectedPlacement, anchorRect, tooltipRect);

    for (const placement of placements) {
      const candidate = this.calculateCoordinates(placement, anchorRect, tooltipRect);

      if (this.fitsViewport(candidate, tooltipRect, view, margin)) {
        selectedPlacement = placement;
        coordinates = candidate;
        break;
      }
    }

    const maxLeft = Math.max(margin, view.innerWidth - tooltipRect.width - margin);
    const maxTop = Math.max(margin, view.innerHeight - tooltipRect.height - margin);

    const left = Math.min(Math.max(coordinates.left, margin), maxLeft);
    const top = Math.min(Math.max(coordinates.top, margin), maxTop);

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;

    this.setPlacementClass(selectedPlacement);
  }

  private setPlacementClass(placement: TooltipPosition): void {
    const tooltip = this.tooltipElement;

    if (!tooltip) {
      return;
    }

    const placementClasses: TooltipPosition[] = [
      'top',
      'top-start',
      'top-end',
      'bottom',
      'bottom-start',
      'bottom-end',
      'left',
      'left-start',
      'left-end',
      'right',
      'right-start',
      'right-end',
    ];

    for (const item of placementClasses) {
      tooltip.classList.remove(`app-tooltip-placement-${item}`);
    }

    tooltip.classList.add(`app-tooltip-placement-${placement}`);
  }

  private calculateCoordinates(
    placement: TooltipPosition,
    anchor: DOMRect,
    tooltip: DOMRect,
  ): TooltipCoordinates {
    const offset = Math.max(4, Number(this.tooltipOffset) || 10);
    const [side, alignment = 'center'] = placement.split('-');

    let left = anchor.left + (anchor.width - tooltip.width) / 2;
    let top = anchor.top + (anchor.height - tooltip.height) / 2;

    switch (side) {
      case 'top':
        top = anchor.top - tooltip.height - offset;
        break;

      case 'bottom':
        top = anchor.bottom + offset;
        break;

      case 'left':
        left = anchor.left - tooltip.width - offset;
        break;

      case 'right':
        left = anchor.right + offset;
        break;
    }

    if (side === 'top' || side === 'bottom') {
      if (alignment === 'start') {
        left = anchor.left;
      } else if (alignment === 'end') {
        left = anchor.right - tooltip.width;
      }
    } else {
      if (alignment === 'start') {
        top = anchor.top;
      } else if (alignment === 'end') {
        top = anchor.bottom - tooltip.height;
      }
    }

    return { left, top };
  }

  private fitsViewport(
    coordinates: TooltipCoordinates,
    tooltip: DOMRect,
    view: Window,
    margin: number,
  ): boolean {
    return (
      coordinates.left >= margin &&
      coordinates.top >= margin &&
      coordinates.left + tooltip.width <= view.innerWidth - margin &&
      coordinates.top + tooltip.height <= view.innerHeight - margin
    );
  }

  private getPlacementCandidates(preferred: TooltipPosition): TooltipPosition[] {
    const opposite: Record<'top' | 'bottom' | 'left' | 'right', string> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    };

    const [rawSide, alignment] = preferred.split('-');
    const side = rawSide as 'top' | 'bottom' | 'left' | 'right';

    const oppositePlacement = `${opposite[side]}${
      alignment ? `-${alignment}` : ''
    }` as TooltipPosition;

    return [
      ...new Set<TooltipPosition>([preferred, oppositePlacement, 'top', 'bottom', 'right', 'left']),
    ];
  }

  private resolveAnchorElement(): HTMLElement {
    const host = this.elementRef.nativeElement;

    // Native button/link/input: use the host itself.
    if (host.matches(this.interactiveSelector)) {
      return host;
    }

    // Custom Angular component such as <app-button>:
    // use its actual rendered interactive child.
    return host.querySelector<HTMLElement>(this.interactiveSelector) ?? host;
  }

  private suppressNativeTooltip(): void {
    const host = this.elementRef.nativeElement;
    // Component host titles are inherited by rendered controls.
    for (const element of [host, ...Array.from(host.querySelectorAll('[title]'))]) {
      if (element.hasAttribute('title')) {
        this.renderer.removeAttribute(element, 'title');
      }
    }
  }

  private observeNativeTitles(): void {
    const Observer = this.document.defaultView?.MutationObserver;
    if (!Observer) return;

    this.ngZone.runOutsideAngular(() => {
      this.titleObserver = new Observer(() => this.suppressNativeTooltip());
      this.titleObserver.observe(this.elementRef.nativeElement, {
        attributes: true,
        attributeFilter: ['title'],
        childList: true,
        subtree: true,
      });
    });
  }

  private canShow(): boolean {
    return (
      this.isBrowser &&
      !this.tooltipDisabled &&
      this.text.trim().length > 0 &&
      Boolean(this.anchorElement ?? this.elementRef.nativeElement)
    );
  }

  private hideWhenInactive(): void {
    if (!this.hovered && !this.focused) {
      this.hide();
    }
  }

  private listenForOutsideClick(): void {
    this.removeOutsideListener?.();

    this.removeOutsideListener = this.renderer.listen(
      this.document,
      'pointerdown',
      (event: PointerEvent) => {
        const target = event.target as Node | null;
        const host = this.elementRef.nativeElement;
        const anchor = this.anchorElement;

        if (!target || host.contains(target) || Boolean(anchor?.contains(target))) {
          return;
        }

        this.hide(true);
      },
    );
  }

  private addAriaDescription(): void {
    const target = this.anchorElement ?? this.elementRef.nativeElement;
    const ids = (target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);

    if (!ids.includes(this.tooltipId)) {
      ids.push(this.tooltipId);
    }

    this.renderer.setAttribute(target, 'aria-describedby', ids.join(' '));
  }

  private removeAriaDescription(): void {
    const target = this.anchorElement ?? this.elementRef.nativeElement;
    const ids = (target.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((id) => id && id !== this.tooltipId);

    if (ids.length > 0) {
      this.renderer.setAttribute(target, 'aria-describedby', ids.join(' '));
    } else {
      this.renderer.removeAttribute(target, 'aria-describedby');
    }
  }

  private destroyTooltip(): void {
    const tooltip = this.tooltipElement;

    if (!tooltip) {
      return;
    }

    tooltip.remove();
    this.tooltipElement = undefined;
    this.arrowElement = undefined;
  }

  private clearShowTimer(): void {
    if (!this.showTimer) {
      return;
    }

    clearTimeout(this.showTimer);
    this.showTimer = undefined;
  }

  private clearHideTimers(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }

    if (this.destroyTimer) {
      clearTimeout(this.destroyTimer);
      this.destroyTimer = undefined;
    }
  }

  private clearTimers(): void {
    this.clearShowTimer();
    this.clearHideTimers();
  }

  private cancelAnimationFrame(): void {
    if (this.animationFrame === undefined) {
      return;
    }

    this.document.defaultView?.cancelAnimationFrame(this.animationFrame);
    this.animationFrame = undefined;
  }
}
