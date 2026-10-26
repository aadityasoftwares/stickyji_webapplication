import type { LEGACY_STICKY_NOTE_SHAPES } from '../constants/sticky-note.constants';

import type { ApiDataResponse as ApiResponse } from '../../../shared/interfaces/api.interface';
import type { PaginatedDataResponse as PaginatedApiResponse } from '../../../shared/interfaces/api.interface';
import type { AvatarTone } from '../../../shared/components/avatar/avatar';

import type { BadgeVariant } from '../../../shared/components/badge/badge';

import type { CheckboxVariant } from '../../../shared/components/checkbox/checkbox';

import type { CardVariant } from '../../../shared/components/sticky-card/sticky-card';

export type KanbanStatus = 'todo' | 'doing' | 'done';

export type StickyNoteStatus = 'ACTIVE' | 'ARCHIVED' | 'TRASHED';

export type StickyNoteColor =
  'YELLOW' | 'BLUE' | 'GREEN' | 'PINK' | 'PURPLE' | 'ORANGE' | 'RED' | 'BROWN' | 'BLACK';

export type StickyNoteShape =
  (typeof LEGACY_STICKY_NOTE_SHAPES)[keyof typeof LEGACY_STICKY_NOTE_SHAPES];

export type StickyNoteColumnType = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CUSTOM';

export type StickyNoteColumnColor = 'YELLOW' | 'BLUE' | 'GREEN' | 'PINK' | 'PURPLE' | 'ORANGE';

export interface KanbanFolder {
  id: string;
  label: string;
}

export interface KanbanChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface KanbanAssignee {
  name: string;
  initials?: string;
  avatarUrl?: string | null;
  tone: AvatarTone;
}

export interface KanbanNote {
  id: string;

  status: KanbanStatus | StickyNoteStatus;

  columnId?: string;
  folderId?: string;

  eyebrow: string;
  title: string;
  description?: string;

  tone: CardVariant;

  tag?: string;
  tagVariant?: BadgeVariant;

  dueLabel?: string;
  timeEstimate?: string;

  progress?: number;
  completedAt?: string;
  compact?: boolean;

  checklist?: KanbanChecklistItem[];
  assignees?: KanbanAssignee[];
  extraAssigneeCount?: number;
}

export interface KanbanColumn {
  id: string;
  label: string;
  accent: string;
  checkboxVariant: CheckboxVariant;

  type?: StickyNoteColumnType;
  color?: StickyNoteColumnColor;

  position?: number;
  isSystem?: boolean;
}

export interface StickyNoteReference {
  _id: string;
}

export interface StickyNoteColumnReference {
  _id: string;
}

export interface StickyNoteColumn {
  _id: string;

  workspaceId: string | StickyNoteColumnReference;

  workspaceFolderId: string | StickyNoteColumnReference;

  name: string;
  type: StickyNoteColumnType;
  color: StickyNoteColumnColor;

  position: number;
  isSystem: boolean;

  createdBy?: string | StickyNoteColumnReference;

  updatedBy?: string | StickyNoteColumnReference | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface StickyNoteColumnCreateRequest {
  workspaceId: string;
  workspaceFolderId: string;
  name: string;
  color?: StickyNoteColumnColor;
}

export interface StickyNoteColumnUpdateRequest {
  name?: string;
  color?: StickyNoteColumnColor;
}

export interface StickyNoteColumnReorderRequest {
  workspaceId: string;
  workspaceFolderId: string;
  columnIds: string[];
}

export interface StickyNote {
  _id: string;

  workspaceId: string | StickyNoteReference;

  workspaceFolderId: string | StickyNoteReference | null;

  columnId: string | StickyNoteColumn;

  title: string;
  content: string;
  color: StickyNoteColor;
  shape: StickyNoteShape;

  position: number;
  status: StickyNoteStatus;

  createdBy: string | StickyNoteReference;

  updatedBy?: string | StickyNoteReference | null;

  archivedAt?: string | null;
  deletedAt?: string | null;

  noteDate: any;

  isCompleted?: boolean;
  completedAt?: string | null;
  completedBy?: string | StickyNoteReference | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface StickyNoteCreateRequest {
  workspaceId: string;
  workspaceFolderId?: string | null;
  columnId: string;

  title?: string;
  content: string;

  color?: StickyNoteColor;
  position?: number;
  isCompleted?: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
}

export interface StickyNoteUpdateRequest {
  workspaceFolderId?: string | null;
  columnId?: string;

  title?: string;
  content?: string;

  color?: StickyNoteColor;
  position?: number;
  isCompleted?: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
}

export interface StickyNoteStatusUpdateRequest {
  status: StickyNoteStatus;
}

export interface StickyNoteFilters {
  workspaceId?: string;
  workspaceFolderId?: string;
  columnId?: string;

  search?: string;

  color?: StickyNoteColor;
  status?: StickyNoteStatus;

  createdBy?: string;

  page?: number;
  limit?: number;

  sortBy?: 'createdAt' | 'updatedAt' | 'position' | 'title';

  sortOrder?: 'asc' | 'desc';
}

export type StickyNoteColumnResponse = ApiResponse<StickyNoteColumn>;

export type StickyNoteColumnsResponse = ApiResponse<StickyNoteColumn[]>;

export type DeleteStickyNoteColumnResponse = ApiResponse<null>;

export type StickyNoteResponse = ApiResponse<StickyNote>;

export type StickyNotesResponse = PaginatedApiResponse<StickyNote>;

export type DeleteStickyNoteResponse = ApiResponse<null>;
