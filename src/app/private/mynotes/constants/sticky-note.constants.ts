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
  badgeDot?: boolean;
}[] = [
  { value: StickyNotePriority.NONE, label: 'None', badgeVariant: 'neutral', badgeDot: true },
  { value: StickyNotePriority.LOW, label: 'Low', badgeVariant: 'info', badgeDot: true },
  { value: StickyNotePriority.MEDIUM, label: 'Medium', badgeVariant: 'warning', badgeDot: true },
  { value: StickyNotePriority.HIGH, label: 'High', badgeVariant: 'noteOrange', badgeDot: true },
  { value: StickyNotePriority.URGENT, label: 'Urgent', badgeVariant: 'danger', badgeDot: true },
];

export function isStickyNotePriority(value: unknown): value is StickyNotePriority {
  return STICKY_NOTE_PRIORITY_OPTIONS.some((option) => option.value === value);
}

export enum StickyNoteStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  TRASHED = 'TRASHED',
}

export const STICKY_NOTE_STATUS_OPTIONS: readonly {
  value: StickyNoteStatus;
  label: string;
  badgeVariant: BadgeVariant;
  badgeDot?: boolean;
}[] = [
  { value: StickyNoteStatus.ACTIVE, label: 'Active', badgeVariant: 'success', badgeDot: true },
  { value: StickyNoteStatus.ARCHIVED, label: 'Archived', badgeVariant: 'neutral', badgeDot: true },
  { value: StickyNoteStatus.TRASHED, label: 'Trashed', badgeVariant: 'danger', badgeDot: true },
];

export function isStickyNoteStatus(value: unknown): value is StickyNoteStatus {
  return STICKY_NOTE_STATUS_OPTIONS.some((option) => option.value === value);
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
