import type { PaginationMeta as Pagination } from '../../../shared/interfaces/api.interface';
import type { ApiDataResponse } from '../../../shared/interfaces/api.interface';
export interface WorkspaceRole {
  id?: string;
  _id?: string;

  name: string;
  displayName: string;
  code: string;

  description?: string | null;

  type: 'SYSTEM' | 'CUSTOM';
  scope: 'GLOBAL' | 'ORGANIZATION' | 'WORKSPACE';

  workspaceId?:
    | string
    | {
        id?: string;
        _id?: string;
      }
    | null;

  isSystem: boolean;
  isDefault?: boolean;
  priority?: number;
  isActive: boolean;

  permissions?: unknown[];
}

export interface WorkspaceRoleQuery {
  workspaceId?: string;
  scope?: 'WORKSPACE';
  isActive?: boolean;
  isSystem?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> extends ApiDataResponse<T> {
  pagination?: Pagination;
}

export interface RoleListContainer {
  data: WorkspaceRole[];
  pagination?: Pagination;
}

export type WorkspaceRoleListResponse = ApiResponse<WorkspaceRole[] | RoleListContainer>;
