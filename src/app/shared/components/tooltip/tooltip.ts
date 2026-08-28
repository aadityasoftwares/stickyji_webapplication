import {
  AfterViewInit,
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  Renderer2,
  SimpleChanges,
  ViewEncapsulation,
  createComponent,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser, NgClass } from '@angular/common';

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

let nextTooltipId = 0;

@Component({
  selector: 'app-tooltip-panel',
  standalone: true,
  imports: [NgClass],
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
class TooltipPanel {
  id = '';
  text = '';
  tone: TooltipTone = 'dark';
  size: TooltipSize = 'md';
  placement: TooltipPosition = 'top';
  maxWidth = 280;
  showArrow = true;
  left = 0;
  top = 0;
  ready = false;

  get panelClasses(): Record<string, boolean> {
    return {
      [`app-tooltip-${this.tone}`]: true,
      [`app-tooltip-${this.size}`]: true,
      [`app-tooltip-placement-${this.placement}`]: true,
      'app-tooltip-ready': this.ready,
    };
  }
}

interface TooltipCoordinates {
  left: number;
  top: number;
}

@Directive({
  selector: '[appTooltip]',
  standalone: true,
  exportAs: 'appTooltip',
})
export class Tooltip implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ alias: 'appTooltip', required: true }) text = '';
  @Input() tooltipPosition: TooltipPosition = 'top';
  @Input() tooltipTone: TooltipTone = 'dark';
  @Input() tooltipSize: TooltipSize = 'md';
  @Input() tooltipTrigger: TooltipTrigger = 'hover-focus';
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
  private panelRef?: ComponentRef<TooltipPanel>;
  private showTimer?: ReturnType<typeof setTimeout>;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private destroyTimer?: ReturnType<typeof setTimeout>;
  private removeOutsideListener?: () => void;
  private hovered = false;
  private focused = false;
  private visible = false;

  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2,
    private readonly applicationRef: ApplicationRef,
    private readonly environmentInjector: EnvironmentInjector,
    private readonly ngZone: NgZone,
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (this.tooltipTrigger === 'manual' && this.tooltipOpen) {
      this.show();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.panelRef && (
      changes['text'] ||
      changes['tooltipTone'] ||
      changes['tooltipSize'] ||
      changes['tooltipMaxWidth'] ||
      changes['tooltipShowArrow']
    )) {
      this.updatePanel();
      this.positionPanel();
    }

    if (changes['tooltipDisabled']?.currentValue) {
      this.hide(true);
    }

    if (
      changes['tooltipOpen'] &&
      !changes['tooltipOpen'].firstChange &&
      this.tooltipTrigger === 'manual'
    ) {
      this.tooltipOpen ? this.show() : this.hide();
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.removeOutsideListener?.();
    this.removeDescriptionReference();
    this.destroyPanel();
  }

  @HostListener('mouseenter')
  handleMouseEnter(): void {
    this.hovered = true;

    if (this.tooltipTrigger === 'hover' || this.tooltipTrigger === 'hover-focus') {
      this.show();
    }
  }

  @HostListener('mouseleave')
  handleMouseLeave(): void {
    this.hovered = false;

    if (this.tooltipTrigger === 'hover' || this.tooltipTrigger === 'hover-focus') {
      this.hideWhenInactive();
    }
  }

  @HostListener('focusin')
  handleFocusIn(): void {
    this.focused = true;

    if (this.tooltipTrigger === 'focus' || this.tooltipTrigger === 'hover-focus') {
      this.show();
    }
  }

  @HostListener('focusout')
  handleFocusOut(): void {
    this.focused = false;

    if (this.tooltipTrigger === 'focus' || this.tooltipTrigger === 'hover-focus') {
      this.hideWhenInactive();
    }
  }

  @HostListener('click')
  handleClick(): void {
    if (this.tooltipTrigger !== 'click') {
      return;
    }

    if (this.visible || this.showTimer) {
      this.hide(true);
    } else {
      this.show();
    }
  }

  @HostListener('keydown.escape')
  handleEscape(): void {
    this.hide(true);
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  handleViewportChange(): void {
    if (this.visible) {
      this.positionPanel();
    }
  }

  show(): void {
    if (!this.isBrowser || this.tooltipDisabled || !this.text.trim()) {
      return;
    }

    this.clearHideTimers();

    if (this.visible) {
      this.positionPanel();
      return;
    }

    this.clearShowTimer();
    this.showTimer = setTimeout(() => this.showNow(), Math.max(0, this.tooltipDelay));
  }

  hide(immediate = false): void {
    this.clearShowTimer();

    if (!this.visible && !this.panelRef) {
      return;
    }

    this.clearHideTimers();
    const delay = immediate ? 0 : Math.max(0, this.tooltipHideDelay);
    this.hideTimer = setTimeout(() => this.hideNow(immediate), delay);
  }

  private showNow(): void {
    if (this.tooltipDisabled || !this.text.trim()) {
      return;
    }

    this.clearHideTimers();
    this.createPanel();
    this.updatePanel();
    this.visible = true;
    this.addDescriptionReference();
    this.tooltipOpenChange.emit(true);

    if (this.tooltipTrigger === 'click') {
      this.listenForOutsideClick();
    }

    const view = this.document.defaultView;
    const position = () => {
      this.positionPanel();

      if (this.panelRef) {
        this.panelRef.instance.ready = true;
        this.panelRef.changeDetectorRef.detectChanges();
      }
    };

    view?.requestAnimationFrame
      ? view.requestAnimationFrame(position)
      : setTimeout(position, 0);
  }

  private hideNow(immediate: boolean): void {
    this.visible = false;
    this.removeOutsideListener?.();
    this.removeOutsideListener = undefined;
    this.removeDescriptionReference();
    this.tooltipOpenChange.emit(false);

    if (!this.panelRef) {
      return;
    }

    this.panelRef.instance.ready = false;
    this.panelRef.changeDetectorRef.detectChanges();

    if (immediate) {
      this.destroyPanel();
      return;
    }

    this.destroyTimer = setTimeout(() => this.destroyPanel(), 130);
  }

  private createPanel(): void {
    if (this.panelRef) {
      return;
    }

    this.panelRef = createComponent(TooltipPanel, {
      environmentInjector: this.environmentInjector,
    });

    this.applicationRef.attachView(this.panelRef.hostView);
    this.document.body.appendChild(this.panelRef.location.nativeElement);
  }

  private updatePanel(): void {
    if (!this.panelRef) {
      return;
    }

    const panel = this.panelRef.instance;
    panel.id = this.tooltipId;
    panel.text = this.text;
    panel.tone = this.tooltipTone;
    panel.size = this.tooltipSize;
    panel.maxWidth = Math.max(120, this.tooltipMaxWidth);
    panel.showArrow = this.tooltipShowArrow;
    this.panelRef.changeDetectorRef.detectChanges();
  }

  private positionPanel(): void {
    if (!this.panelRef || !this.isBrowser) {
      return;
    }

    const host = this.elementRef.nativeElement;
    const panelElement = this.panelRef.location.nativeElement.querySelector(
      '.app-tooltip-panel',
    ) as HTMLElement | null;
    const view = this.document.defaultView;

    if (!panelElement || !view) {
      return;
    }

    const hostRect = host.getBoundingClientRect();
    const panelRect = panelElement.getBoundingClientRect();
    const margin = 8;
    const placements = this.getPlacementCandidates(this.tooltipPosition);

    let selectedPlacement = placements[0];
    let coordinates = this.calculateCoordinates(
      selectedPlacement,
      hostRect,
      panelRect,
    );

    for (const placement of placements) {
      const candidate = this.calculateCoordinates(placement, hostRect, panelRect);

      if (this.fitsViewport(candidate, panelRect, view, margin)) {
        selectedPlacement = placement;
        coordinates = candidate;
        break;
      }
    }

    const maxLeft = Math.max(margin, view.innerWidth - panelRect.width - margin);
    const maxTop = Math.max(margin, view.innerHeight - panelRect.height - margin);

    this.panelRef.instance.placement = selectedPlacement;
    this.panelRef.instance.left = Math.min(Math.max(coordinates.left, margin), maxLeft);
    this.panelRef.instance.top = Math.min(Math.max(coordinates.top, margin), maxTop);
    this.panelRef.changeDetectorRef.detectChanges();
  }

  private calculateCoordinates(
    placement: TooltipPosition,
    host: DOMRect,
    panel: DOMRect,
  ): TooltipCoordinates {
    const offset = Math.max(4, this.tooltipOffset);
    const [side, alignment = 'center'] = placement.split('-');
    let left = host.left + (host.width - panel.width) / 2;
    let top = host.top + (host.height - panel.height) / 2;

    if (side === 'top') {
      top = host.top - panel.height - offset;
    } else if (side === 'bottom') {
      top = host.bottom + offset;
    } else if (side === 'left') {
      left = host.left - panel.width - offset;
    } else {
      left = host.right + offset;
    }

    if (side === 'top' || side === 'bottom') {
      if (alignment === 'start') {
        left = host.left;
      } else if (alignment === 'end') {
        left = host.right - panel.width;
      }
    } else if (alignment === 'start') {
      top = host.top;
    } else if (alignment === 'end') {
      top = host.bottom - panel.height;
    }

    return { left, top };
  }

  private fitsViewport(
    coordinates: TooltipCoordinates,
    panel: DOMRect,
    view: Window,
    margin: number,
  ): boolean {
    return (
      coordinates.left >= margin &&
      coordinates.top >= margin &&
      coordinates.left + panel.width <= view.innerWidth - margin &&
      coordinates.top + panel.height <= view.innerHeight - margin
    );
  }

  private getPlacementCandidates(preferred: TooltipPosition): TooltipPosition[] {
    const opposite: Record<string, string> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    };
    const [side, alignment] = preferred.split('-');
    const oppositePlacement = `${opposite[side]}${alignment ? `-${alignment}` : ''}` as TooltipPosition;
    const fallbacks: TooltipPosition[] = [
      preferred,
      oppositePlacement,
      'top',
      'bottom',
      'right',
      'left',
    ];

    return [...new Set(fallbacks)];
  }

  private hideWhenInactive(): void {
    if (!this.hovered && !this.focused) {
      this.hide();
    }
  }

  private listenForOutsideClick(): void {
    this.removeOutsideListener?.();

    this.ngZone.runOutsideAngular(() => {
      this.removeOutsideListener = this.renderer.listen(
        this.document,
        'pointerdown',
        (event: PointerEvent) => {
          const target = event.target as Node | null;

          if (!target || this.elementRef.nativeElement.contains(target)) {
            return;
          }

          this.ngZone.run(() => this.hide(true));
        },
      );
    });
  }

  private addDescriptionReference(): void {
    const target = this.getAriaTarget();
    const ids = (target.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter(Boolean);

    if (!ids.includes(this.tooltipId)) {
      ids.push(this.tooltipId);
    }

    this.renderer.setAttribute(target, 'aria-describedby', ids.join(' '));
  }

  private removeDescriptionReference(): void {
    const target = this.getAriaTarget();
    const ids = (target.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter((id) => Boolean(id) && id !== this.tooltipId);

    if (ids.length > 0) {
      this.renderer.setAttribute(target, 'aria-describedby', ids.join(' '));
    } else {
      this.renderer.removeAttribute(target, 'aria-describedby');
    }
  }

  private getAriaTarget(): HTMLElement {
    const host = this.elementRef.nativeElement;
    const focusableSelector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return host.matches(focusableSelector)
      ? host
      : host.querySelector<HTMLElement>(focusableSelector) || host;
  }

  private destroyPanel(): void {
    if (!this.panelRef) {
      return;
    }

    this.applicationRef.detachView(this.panelRef.hostView);
    this.panelRef.destroy();
    this.panelRef = undefined;
  }

  private clearShowTimer(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = undefined;
    }
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
}
