import { isPlatformBrowser, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Input,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import {
  LucideBell,
  LucideCheckCircle2,
  LucideCircleAlert,
  LucideInfo,
  LucideSparkles,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';

import {
  AppIcon,
  type AppIconDefinition,
} from '../icon/icon';
import { ToastPosition, ToastItem } from './models/toast.model';
import { ToastService } from './services/toast.service';

interface ToastTimer {
  handle?: ReturnType<typeof setTimeout>;
  remaining: number;
  startedAt: number;
  revision: number;
}

@Component({
  standalone: true,
  imports: [NgClass, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast',
  styleUrl: './toast.scss',
  templateUrl: './toast.html',
})
export class Toast implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly timers = new Map<string, ToastTimer>();
  private readonly pausedToastIds = new Set<string>();

  readonly toastService = inject(ToastService);

  readonly LucideX = LucideX;

  @Input() position: ToastPosition = 'top-right';
  @Input() maxVisible = 4;
  @Input() newestOnTop = true;

  constructor() {
    effect(() => {
      const visibleToasts = this.resolveVisibleToasts(this.toastService.toasts());
      this.syncTimers(visibleToasts);
    });
  }

  get visibleToasts(): readonly ToastItem[] {
    return this.resolveVisibleToasts(this.toastService.toasts());
  }

  get regionClasses(): Record<string, boolean> {
    return {
      [`app-toast-region-${this.position}`]: true,
      'app-toast-region-newest-first': this.newestOnTop,
    };
  }

  toastClasses(toast: ToastItem): Record<string, boolean> {
    return {
      [`app-toast-${toast.variant}`]: true,
      'app-toast-paused': this.pausedToastIds.has(toast.id),
      'app-toast-persistent': toast.duration === 0,
    };
  }

  toastRole(toast: ToastItem): 'alert' | 'status' {
    return toast.variant === 'danger' || toast.variant === 'warning'
      ? 'alert'
      : 'status';
  }

  resolvedIcon(toast: ToastItem): AppIconDefinition | null {
    if (toast.icon === null) {
      return null;
    }

    if (toast.icon) {
      return toast.icon;
    }

    switch (toast.variant) {
      case 'success':
      case 'noteGreen':
        return LucideCheckCircle2;
      case 'warning':
        return LucideTriangleAlert;
      case 'danger':
        return LucideCircleAlert;
      case 'info':
      case 'noteBlue':
        return LucideInfo;
      case 'noteYellow':
      case 'notePink':
      case 'notePurple':
        return LucideSparkles;
      default:
        return LucideBell;
    }
  }

  pause(toast: ToastItem): void {
    if (!this.isBrowser || toast.duration === 0 || this.pausedToastIds.has(toast.id)) {
      return;
    }

    const timer = this.timers.get(toast.id);

    if (!timer) {
      return;
    }

    this.pausedToastIds.add(toast.id);

    if (timer.handle) {
      clearTimeout(timer.handle);
      timer.handle = undefined;
      timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
    }
  }

  resume(toast: ToastItem): void {
    if (!this.isBrowser || !this.pausedToastIds.delete(toast.id)) {
      return;
    }

    const timer = this.timers.get(toast.id);

    if (timer) {
      this.startTimer(toast, timer);
    }
  }

  dismiss(id: string): void {
    this.clearTimer(id);
    this.toastService.dismiss(id);
  }

  runAction(event: MouseEvent, toast: ToastItem): void {
    event.stopPropagation();

    if (!toast.action) {
      return;
    }

    try {
      toast.action.handler();
    } finally {
      if (toast.action.dismissOnClick !== false) {
        this.dismiss(toast.id);
      }
    }
  }

  ngOnDestroy(): void {
    for (const id of this.timers.keys()) {
      this.clearTimer(id);
    }
  }

  private resolveVisibleToasts(toasts: readonly ToastItem[]): ToastItem[] {
    const limit = Math.max(1, Math.floor(this.maxVisible || 1));

    return this.newestOnTop
      ? toasts.slice(-limit).reverse()
      : toasts.slice(0, limit);
  }

  private syncTimers(visibleToasts: readonly ToastItem[]): void {
    if (!this.isBrowser) {
      return;
    }

    const visibleIds = new Set(visibleToasts.map((toast) => toast.id));

    for (const id of this.timers.keys()) {
      if (!visibleIds.has(id)) {
        this.clearTimer(id);
      }
    }

    for (const toast of visibleToasts) {
      const currentTimer = this.timers.get(toast.id);

      if (toast.duration === 0) {
        if (currentTimer) {
          this.clearTimer(toast.id);
        }
        continue;
      }

      if (!currentTimer || currentTimer.revision !== toast.revision) {
        this.clearTimer(toast.id);

        const timer: ToastTimer = {
          remaining: toast.duration,
          startedAt: Date.now(),
          revision: toast.revision,
        };

        this.timers.set(toast.id, timer);
        this.startTimer(toast, timer);
      }
    }
  }

  private startTimer(toast: ToastItem, timer: ToastTimer): void {
    if (this.pausedToastIds.has(toast.id) || timer.remaining <= 0) {
      return;
    }

    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => this.dismiss(toast.id), timer.remaining);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);

    if (timer?.handle) {
      clearTimeout(timer.handle);
    }

    this.timers.delete(id);
    this.pausedToastIds.delete(id);
  }
}