import type { BadgeVariant } from '../../../shared/components/badge/badge';

export enum StickyNotePriority {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export const STICKY_NOTE_PRIORITY_OPTIONS: readonly {
  value: StickyNotePriority;
  label: string;
  badgeVariant: BadgeVariant;
}[] = [
  { value: StickyNotePriority.NONE, label: 'None', badgeVariant: 'neutral' },
  { value: StickyNotePriority.LOW, label: 'Low', badgeVariant: 'info' },
  { value: StickyNotePriority.MEDIUM, label: 'Medium', badgeVariant: 'warning' },
  { value: StickyNotePriority.HIGH, label: 'High', badgeVariant: 'noteOrange' },
  { value: StickyNotePriority.URGENT, label: 'Urgent', badgeVariant: 'danger' },
];

export function isStickyNotePriority(value: unknown): value is StickyNotePriority {
  return STICKY_NOTE_PRIORITY_OPTIONS.some((option) => option.value === value);
}

// Legacy note shape values differ from the current editor layout options.
export const LEGACY_STICKY_NOTE_SHAPES = {
  NOTE: 'NOTE',
  ROUNDED: 'ROUNDED',
  SOFT: 'SOFT',
  SQUARE: 'SQUARE',
  CUT: 'CUT',
  TICKET: 'TICKET',
  FOLDED: 'FOLDED',
} as const;
