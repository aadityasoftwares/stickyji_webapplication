import type { ApiResult as ApiItemResponse } from '../../../shared/interfaces/api.interface';

export type StickyNoteChecklistStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

export type StickyNoteChecklistItemStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

export type MongoReference =
  | string
  | {
      _id: string;
      [key: string]: unknown;
    };

export interface StickyNoteChecklist {
  _id: string;
  stickyNoteId: MongoReference;
  title: string;
  position: number;
  status: StickyNoteChecklistStatus;
  createdBy?: MongoReference | null;
  updatedBy?: MongoReference | null;
  archivedAt?: string | Date | null;
  deletedAt?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface StickyNoteChecklistItem {
  _id: string;
  checklistId: MongoReference;
  title: string;
  position: number;
  isCompleted: boolean;
  status: StickyNoteChecklistItemStatus;
  createdBy?: MongoReference | null;
  updatedBy?: MongoReference | null;
  completedBy?: MongoReference | null;
  completedAt?: string | Date | null;
  archivedAt?: string | Date | null;
  deletedAt?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface StickyNoteChecklistCreateRequest {
  stickyNoteId: string;
  title: string;
  position?: number;
}

export interface StickyNoteChecklistUpdateRequest {
  title?: string;
  position?: number;
}

export interface StickyNoteChecklistFilters {
  stickyNoteId?: string;
  status?: StickyNoteChecklistStatus;
  page?: number;
  limit?: number;
  sortBy?: 'position' | 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface StickyNoteChecklistItemCreateRequest {
  checklistId: string;
  title: string;
  position?: number;
}

export interface StickyNoteChecklistItemUpdateRequest {
  title?: string;
  position?: number;
}

export interface StickyNoteChecklistItemFilters {
  checklistId?: string;
  status?: StickyNoteChecklistItemStatus;
  isCompleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'position' | 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ApiListEnvelope<T> {
  items?: T[];
  docs?: T[];
  results?: T[];
  checklists?: T[];
  checklistItems?: T[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
}

export interface ApiListResponse<T> {
  success?: boolean;
  message?: string;
  data: T[] | ApiListEnvelope<T>;
}

export type StickyNoteChecklistResponse = ApiItemResponse<StickyNoteChecklist>;

export type StickyNoteChecklistsResponse = ApiListResponse<StickyNoteChecklist>;

export type StickyNoteChecklistItemResponse = ApiItemResponse<StickyNoteChecklistItem>;

export type StickyNoteChecklistItemsResponse = ApiListResponse<StickyNoteChecklistItem>;
