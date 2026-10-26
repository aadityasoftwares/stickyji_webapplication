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
  signal,
} from '@angular/core';
import { LucideX } from '@lucide/angular';

import { Button } from '../button/button';
import { AppIcon } from '../icon/icon';

export type ModalTone = 'paper' | 'yellow' | 'blue' | 'pink' | 'green' | 'purple';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

let modalInstance = 0;
let bodyLockCount = 0;
let savedBodyOverflow = '';
let savedBodyPaddingRight = '';

@Component({
  host: { '[attr.title]': 'null' },
  selector: 'app-modal',
  standalone: true,
  imports: [AppIcon, Button],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal implements OnChanges, OnDestroy {
  @ViewChild('dialog')
  private dialog?: ElementRef<HTMLElement>;

  @Input() open = false;
  @Input() title = '';
  @Input() eyebrow = '';
  @Input() description = '';
  @Input() headerNote = '';
  @Input() icon: any = null;
  @Input() tone: ModalTone = 'yellow';
  @Input() size: ModalSize = 'full';
  @Input() maxWidth: number | null = null;
  @Input() busy = false;
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;
  @Input() showClose = true;
  @Input() showFooter = true;
  @Input() centered = true;
  @Input() fullscreenOnMobile = true;
  @Input() ariaLabel = 'Dialog';

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly opened = new EventEmitter<void>();

  readonly LucideX = LucideX;
  readonly rendered = signal(false);
  readonly closing = signal(false);

  readonly instanceId = `app-modal-${++modalInstance}`;
  readonly titleId = `${this.instanceId}-title`;
  readonly descriptionId = `${this.instanceId}-description`;

  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private bodyLocked = false;
  private previouslyFocusedElement: HTMLElement | null = null;

  constructor(
    @Inject(DOCUMENT)
    private readonly document: Document,
    @Inject(PLATFORM_ID)
    private readonly platformId: object,
  ) {}

  get resolvedMaxWidth(): string | null {
    if (Number.isFinite(this.maxWidth) && Number(this.maxWidth) > 0) {
      return `${Math.max(320, Number(this.maxWidth))}px`;
    }

    return null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['open']) return;

    if (this.open) {
      this.openModal();
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
    if (this.busy || !this.open) return;
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
    if (!this.open || !this.rendered()) return;

    if (event.key === 'Escape') {
      if (!this.closeOnEscape || this.busy) return;

      event.preventDefault();
      this.requestClose();
      return;
    }

    if (event.key === 'Tab') {
      this.keepFocusInside(event);
    }
  }

  private openModal(): void {
    this.cancelCloseTimer();

    if (!this.rendered()) {
      this.captureCurrentFocus();
    }

    this.closing.set(false);
    this.rendered.set(true);
    this.lockBodyScroll();

    if (!isPlatformBrowser(this.platformId)) return;

    requestAnimationFrame(() => {
      const autofocus = this.dialog?.nativeElement.querySelector<HTMLElement>('[autofocus]');
      const firstFocusable = this.focusableElements()[0];

      (autofocus ?? firstFocusable ?? this.dialog?.nativeElement)?.focus({
        preventScroll: true,
      });

      this.opened.emit();
    });
  }

  private beginClose(): void {
    if (!this.rendered()) return;

    this.closing.set(true);
    this.cancelCloseTimer();

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
      this.dialog?.nativeElement.focus({ preventScroll: true });
      return;
    }

    const first = elements[0];
    const last = elements[elements.length - 1];
    const active = this.document.activeElement;
    const focusIsOutside = !this.dialog?.nativeElement.contains(active);

    if (event.shiftKey && (active === first || focusIsOutside)) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && (active === last || focusIsOutside)) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusableElements(): HTMLElement[] {
    const root = this.dialog?.nativeElement;
    if (!root) return [];

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[contenteditable="true"]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
      (element) =>
        !element.hasAttribute('hidden') &&
        element.getAttribute('aria-hidden') !== 'true' &&
        element.getClientRects().length > 0,
    );
  }

  private captureCurrentFocus(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const active = this.document.activeElement;
    this.previouslyFocusedElement = active instanceof HTMLElement ? active : null;
  }

  private restoreFocus(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const target = this.previouslyFocusedElement;
    this.previouslyFocusedElement = null;

    if (target?.isConnected) {
      target.focus({ preventScroll: true });
    }
  }

  private lockBodyScroll(): void {
    if (!isPlatformBrowser(this.platformId) || this.bodyLocked) return;

    const body = this.document.body;
    const documentElement = this.document.documentElement;

    if (bodyLockCount === 0) {
      savedBodyOverflow = body.style.overflow;
      savedBodyPaddingRight = body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
      const currentPadding = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;

      body.style.overflow = 'hidden';

      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
      }
    }

    bodyLockCount += 1;
    this.bodyLocked = true;
  }

  private unlockBodyScroll(): void {
    if (!isPlatformBrowser(this.platformId) || !this.bodyLocked) return;

    bodyLockCount = Math.max(0, bodyLockCount - 1);
    this.bodyLocked = false;

    if (bodyLockCount === 0) {
      this.document.body.style.overflow = savedBodyOverflow;
      this.document.body.style.paddingRight = savedBodyPaddingRight;
    }
  }

  private cancelCloseTimer(): void {
    if (!this.closeTimer) return;

    clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }
}
