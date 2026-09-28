export type WorkspaceFolderStatus =
    | 'ACTIVE'
    | 'INACTIVE'
    | 'ARCHIVED'
    | 'DELETED';

export interface WorkspaceFolderUserSummary {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string | null;
}

export interface WorkspaceFolderWorkspaceSummary {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    isPersonal?: boolean;
}

export interface WorkspaceFolder {
    id: string;
    workspaceId: string | WorkspaceFolderWorkspaceSummary;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    position: number;
    isDefault: boolean;
    status: WorkspaceFolderStatus;
    createdBy?: string | WorkspaceFolderUserSummary | null;
    updatedBy?: string | WorkspaceFolderUserSummary | null;
    createdAt: string;
    updatedAt: string;
}

export interface WorkspaceFolderCreateRequest {
    workspaceId: string;
    name: string;
    slug?: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    position?: number;
    isDefault?: boolean;
}

export interface WorkspaceFolderUpdateRequest {
    name?: string;
    slug?: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    position?: number;
    isDefault?: boolean;
}

export interface WorkspaceFolderQuery {
    workspaceId?: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: WorkspaceFolderStatus;
    isDefault?: boolean;
    createdBy?: string;
    sortBy?: 'name' | 'position' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
    pagination: Pagination;
}
