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

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    pagination?: Pagination;
}

export interface RoleListContainer {
    data: WorkspaceRole[];
    pagination?: Pagination;
}

export type WorkspaceRoleListResponse =
    ApiResponse<WorkspaceRole[] | RoleListContainer>;