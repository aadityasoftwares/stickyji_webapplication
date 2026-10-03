import type { ApiResponse, PaginatedApiResponse } from '../../workspace-members/models/workspace-member.models';

export type StickyNoteAssigneeStatus = 'ACTIVE' | 'REMOVED';

export interface StickyNoteAssigneeUserSummary {
  id: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  profile?: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  } | null;
}

export interface StickyNoteAssignee {
  id: string;
  _id?: string;
  workspaceId: string;
  stickyNoteId: string;
  userId: string | StickyNoteAssigneeUserSummary;
  status: StickyNoteAssigneeStatus;
  assignedBy?: string | StickyNoteAssigneeUserSummary;
  removedBy?: string | StickyNoteAssigneeUserSummary | null;
  assignedAt: string | Date;
  removedAt?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface StickyNoteAssigneeSyncRequest {
  assigneeIds: string[];
}

export interface StickyNoteAssigneeCreateRequest {
  stickyNoteId: string;
  userId: string;
}

export interface StickyNoteAssigneeQuery {
  workspaceId?: string;
  stickyNoteId?: string;
  userId?: string;
  status?: StickyNoteAssigneeStatus;
  page?: number;
  limit?: number;
  sortBy?: 'assignedAt' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export type StickyNoteAssigneeResponse = ApiResponse<StickyNoteAssignee>;
export type StickyNoteAssigneesListResponse = ApiResponse<StickyNoteAssignee[]>;
export type StickyNoteAssigneePaginatedResponse = PaginatedApiResponse<StickyNoteAssignee>;
