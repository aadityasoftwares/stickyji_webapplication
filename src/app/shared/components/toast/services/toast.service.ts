import { Injectable, signal } from '@angular/core';
import { ToastOptions, ToastItem, ToastVariant } from '../models/toast.model';

type VariantToastOptions = Omit<ToastOptions, 'variant'>;

@Injectable({ providedIn: 'root' })
export class ToastService {
    private static readonly queueLimit = 50;

    private readonly toastState = signal<ToastItem[]>([]);
    private nextId = 0;

    readonly toasts = this.toastState.asReadonly();

    show(message: string, options: ToastOptions = {}): string {
        const cleanMessage = message.trim();
        const cleanTitle = options.title?.trim() || undefined;

        if (!cleanMessage && !cleanTitle) {
            return '';
        }

        const variant = options.variant ?? 'neutral';
        const existing = options.dedupeKey
            ? this.toastState().find((toast) => toast.dedupeKey === options.dedupeKey)
            : undefined;

        if (existing) {
            this.toastState.update((toasts) =>
                toasts.map((toast) =>
                    toast.id === existing.id
                        ? {
                            ...toast,
                            ...options,
                            message: cleanMessage,
                            title: cleanTitle,
                            variant,
                            duration: this.resolveDuration(variant, options.duration),
                            dismissible: options.dismissible ?? true,
                            createdAt: Date.now(),
                            revision: toast.revision + 1,
                        }
                        : toast,
                ),
            );

            return existing.id;
        }

        const id = this.createId();
        const toast: ToastItem = {
            id,
            message: cleanMessage,
            title: cleanTitle,
            variant,
            duration: this.resolveDuration(variant, options.duration),
            dismissible: options.dismissible ?? true,
            action: options.action,
            icon: options.icon,
            ariaLabel: options.ariaLabel,
            dedupeKey: options.dedupeKey,
            createdAt: Date.now(),
            revision: 0,
        };

        this.toastState.update((toasts) =>
            [...toasts, toast].slice(-ToastService.queueLimit),
        );

        return id;
    }

    success(message: string, options: VariantToastOptions = {}): string {
        return this.show(message, { ...options, variant: 'success' });
    }

    warning(message: string, options: VariantToastOptions = {}): string {
        return this.show(message, { ...options, variant: 'warning' });
    }

    error(message: string, options: VariantToastOptions = {}): string {
        return this.show(message, { ...options, variant: 'danger' });
    }

    info(message: string, options: VariantToastOptions = {}): string {
        return this.show(message, { ...options, variant: 'info' });
    }

    note(message: string, options: VariantToastOptions = {}): string {
        return this.show(message, { ...options, variant: 'noteYellow' });
    }

    dismiss(id: string): void {
        this.toastState.update((toasts) => toasts.filter((toast) => toast.id !== id));
    }

    clear(): void {
        this.toastState.set([]);
    }

    private resolveDuration(variant: ToastVariant, duration?: number): number {
        if (duration !== undefined) {
            return Math.min(60_000, Math.max(0, duration));
        }

        return variant === 'danger' ? 7_000 : 4_500;
    }

    private createId(): string {
        this.nextId += 1;
        return `app-toast-${Date.now()}-${this.nextId}`;
    }
}

