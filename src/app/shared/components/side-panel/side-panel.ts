import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  signal
} from '@angular/core';
import { LucideX } from '@lucide/angular';

import { Button } from '../button/button';
import { AppIcon } from '../icon/icon';

export type SidePanelTone =
  | 'paper'
  | 'yellow'
  | 'blue'
  | 'pink'
  | 'green'
  | 'purple';

let sidePanelInstance = 0;

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [
    AppIcon,
    Button
  ],
  templateUrl: './side-panel.html',
  styleUrl: './side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidePanel implements OnChanges, OnDestroy {
  @ViewChild('panel')
  private panel?: ElementRef<HTMLElement>;

  @Input() open = false;
  @Input() title = '';
  @Input() eyebrow = '';
  @Input() description = '';
  @Input() headerNote = '';
  @Input() icon: any = null;
  @Input() tone: SidePanelTone = 'yellow';
  @Input() width = 520;
  @Input() busy = false;
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;
  @Input() showFooter = true;
  @Input() ariaLabel = 'Side panel';

  @Output() readonly closed = new EventEmitter<void>();

  readonly LucideX = LucideX;
  readonly rendered = signal(false);
  readonly closing = signal(false);

  readonly instanceId = `app-side-panel-${++sidePanelInstance}`;
  readonly titleId = `${this.instanceId}-title`;
  readonly descriptionId = `${this.instanceId}-description`;

  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private previousBodyOverflow = '';
  private bodyLocked = false;
  private previouslyFocusedElement: HTMLElement | null = null;

  constructor(
    @Inject(DOCUMENT)
    private readonly document: Document,
    @Inject(PLATFORM_ID)
    private readonly platformId: object
  ) { }

  get resolvedWidth(): number {
    const width = Number.isFinite(this.width) ? this.width : 520;

    return Math.min(760, Math.max(320, width));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['open']) {
      return;
    }

    if (this.open) {
      this.openPanel();
      return;
    }

    this.beginClose();
  }

  ngOnDestroy(): void {
    this.cancelCloseTimer();
    this.unlockBodyScroll();
    this.restoreFocus();
  }

  requestClose(): void {
    if (this.busy || !this.open) {
      return;
    }

    this.closed.emit();
  }

  onBackdropMouseDown(event: MouseEvent): void {
    event.preventDefault();

    if (this.closeOnBackdrop) {
      this.requestClose();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.open || !this.rendered()) {
      return;
    }

    if (event.key === 'Escape') {
      if (!this.closeOnEscape || this.busy) {
        return;
      }

      event.preventDefault();
      this.requestClose();
      return;
    }

    if (event.key === 'Tab') {
      this.keepFocusInside(event);
    }
  }

  private openPanel(): void {
    this.cancelCloseTimer();

    if (!this.rendered()) {
      this.captureCurrentFocus();
    }

    this.closing.set(false);
    this.rendered.set(true);
    this.lockBodyScroll();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    requestAnimationFrame(() => {
      const firstFocusable = this.focusableElements()[0];

      (firstFocusable ?? this.panel?.nativeElement)?.focus({
        preventScroll: true
      });
    });
  }

  private beginClose(): void {
    if (!this.rendered()) {
      return;
    }

    this.closing.set(true);

    this.closeTimer = setTimeout(() => {
      this.rendered.set(false);
      this.closing.set(false);
      this.closeTimer = null;

      this.unlockBodyScroll();
      this.restoreFocus();
    }, 180);
  }

  private keepFocusInside(event: KeyboardEvent): void {
    const elements = this.focusableElements();

    if (!elements.length) {
      event.preventDefault();

      this.panel?.nativeElement.focus({
        preventScroll: true
      });

      return;
    }

    const first = elements[0];
    const last = elements[elements.length - 1];
    const active = this.document.activeElement;
    const focusIsOutsidePanel =
      !this.panel?.nativeElement.contains(active);

    if (
      event.shiftKey &&
      (active === first || focusIsOutsidePanel)
    ) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusableElements(): HTMLElement[] {
    const root = this.panel?.nativeElement;

    if (!root) {
      return [];
    }

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    return Array.from(
      root.querySelectorAll<HTMLElement>(selector)
    ).filter(
      element =>
        !element.hasAttribute('hidden') &&
        element.getClientRects().length > 0
    );
  }

  private captureCurrentFocus(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const active = this.document.activeElement;

    this.previouslyFocusedElement =
      active instanceof HTMLElement ? active : null;
  }

  private restoreFocus(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const target = this.previouslyFocusedElement;

    this.previouslyFocusedElement = null;

    if (target?.isConnected) {
      target.focus({
        preventScroll: true
      });
    }
  }

  private lockBodyScroll(): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      this.bodyLocked
    ) {
      return;
    }

    this.previousBodyOverflow =
      this.document.body.style.overflow;

    this.document.body.style.overflow = 'hidden';
    this.bodyLocked = true;
  }

  private unlockBodyScroll(): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      !this.bodyLocked
    ) {
      return;
    }

    this.document.body.style.overflow =
      this.previousBodyOverflow;

    this.bodyLocked = false;
  }

  private cancelCloseTimer(): void {
    if (!this.closeTimer) {
      return;
    }

    clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }
}