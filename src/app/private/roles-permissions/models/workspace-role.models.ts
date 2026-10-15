import type { Permission } from './permission.models';

export type WorkspaceRoleType = 'SYSTEM' | 'CUSTOM' | string;
export type WorkspaceRoleScope = 'GLOBAL' | 'WORKSPACE' | string;

export interface WorkspaceRoleWorkspaceRef {
    id?: string;
    _id?: string;
    name?: string;
}

export type WorkspaceRolePermissionRef = string | Permission;
export type WorkspaceRoleWorkspaceId = string | WorkspaceRoleWorkspaceRef | null;

export interface WorkspaceRole {
    id?: string;
    _id?: string;
    name: string;
    displayName: string;
    code: string;
    description?: string;
    type: WorkspaceRoleType;
    scope: WorkspaceRoleScope;
    workspaceId?: WorkspaceRoleWorkspaceId;
    permissions: readonly WorkspaceRolePermissionRef[];
    isSystem: boolean;
    isDefault: boolean;
    priority: number;
    isActive: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface WorkspaceRoleCreateRequest {
    name: string;
    displayName: string;
    code: string;
    description?: string;
    type?: WorkspaceRoleType;
    scope?: 'WORKSPACE';
    workspaceId: string;
    permissions?: string[];
    priority?: number;
    isActive?: boolean;
}

export interface WorkspaceRoleUpdateRequest {
    name?: string;
    displayName?: string;
    code?: string;
    description?: string;
    permissions?: string[];
    isActive?: boolean;
}

export interface WorkspaceRoleQuery {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    scope?: string;
    workspaceId?: string;
    isActive?: boolean;
    isSystem?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface WorkspaceRolePagination {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
}

export interface ApiResponse<T> {
    success?: boolean;
    message?: string;
    data: T;
}

export interface WorkspaceRoleCollection {
    data?: readonly WorkspaceRole[];
    items?: readonly WorkspaceRole[];
    roles?: readonly WorkspaceRole[];
    docs?: readonly WorkspaceRole[];
    results?: readonly WorkspaceRole[];
    pagination?: WorkspaceRolePagination | null;
    meta?: WorkspaceRolePagination | null;
}

export type WorkspaceRoleListResponse = ApiResponse<
    readonly WorkspaceRole[] | WorkspaceRoleCollection
> & {
    meta?: WorkspaceRolePagination | null;
    pagination?: WorkspaceRolePagination | null;
};
