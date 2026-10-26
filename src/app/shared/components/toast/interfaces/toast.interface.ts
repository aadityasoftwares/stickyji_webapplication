import type { AppIconDefinition } from '../../icon/icon';

export type ToastVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'noteYellow'
  | 'notePink'
  | 'noteBlue'
  | 'noteGreen'
  | 'notePurple';

export type ToastPosition =
  'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastAction {
  label: string;
  ariaLabel?: string;
  handler: () => void;
  dismissOnClick?: boolean;
}

export interface ToastOptions {
  title?: string;
  variant?: ToastVariant;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
  icon?: AppIconDefinition | null;
  ariaLabel?: string;
  dedupeKey?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
  duration: number;
  dismissible: boolean;
  action?: ToastAction;
  icon?: AppIconDefinition | null;
  ariaLabel?: string;
  dedupeKey?: string;
  createdAt: number;
  revision: number;
}
