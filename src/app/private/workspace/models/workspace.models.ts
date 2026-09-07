export type WorkspaceStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'DELETED';
export type WorkspaceAccessRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface WorkspaceUserSummary {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string | null;
}

export enum WorkspaceVisibility {
    PRIVATE = 'PRIVATE',
    INVITE_ONLY = 'INVITE_ONLY',
    PUBLIC = 'PUBLIC'
}

export interface Workspace {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    ownerId: string | WorkspaceUserSummary;
    status: WorkspaceStatus;
    visibility: WorkspaceVisibility;
    isPersonal: boolean;
    isOwner?: boolean;
    accessRole?: WorkspaceAccessRole;
    createdAt: string;
    updatedAt: string;
}

export interface WorkspaceCreateRequest {
    name: string;
    slug?: string;
    description?: string | null;
    visibility?: WorkspaceVisibility;
    isPersonal?: boolean;
}

export interface WorkspaceUpdateRequest {
    name?: string;
    slug?: string;
    description?: string | null;
    visibility?: WorkspaceVisibility;
}

export interface MyWorkspaceQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: WorkspaceStatus;
    visibility?: WorkspaceVisibility;
    isPersonal?: boolean;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
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