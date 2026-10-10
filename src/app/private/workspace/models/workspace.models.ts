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

export type WorkspaceListStatus = 'ACTIVE' | 'ARCHIVED' | 'ALL';
export type WorkspaceTabKey = 'all' | 'active' | 'archived';
export type WorkspaceViewMode = 'grid' | 'list';

export { WORKSPACE_SORT_PREFERENCES } from '../../../shared/constants/common.constants';
import { WORKSPACE_SORT_PREFERENCES } from '../../../shared/constants/common.constants';

export type WorkspaceSort = keyof typeof WORKSPACE_SORT_PREFERENCES;
export type BackendWorkspaceSort = (typeof WORKSPACE_SORT_PREFERENCES)[WorkspaceSort];

export interface WorkspaceCounts {
    all: number;
    active: number;
    archived: number;
}

export interface WorkspaceListMeta extends Pagination {
    counts?: WorkspaceCounts;
}

export interface WorkspaceMemberPreview {
    id: string;
    displayName: string;
    email?: string;
    role: string;
    isOwner: boolean;
}

export interface WorkspaceAccess {
    type: 'OWNER' | 'MEMBER';
    isOwner: boolean;
    membership?: {
        id: string;
        roleId: string;
        status: string;
        joinedAt?: string | null;
    } | null;
}

export interface WorkspaceSummary {
    folderCount: number;
    memberCount: number;
    members: WorkspaceMemberPreview[];
}

export interface WorkspaceListItem extends Partial<Workspace> {
    id: string;
    name?: string;
    status?: WorkspaceStatus;
    access?: WorkspaceAccess;
    summary?: WorkspaceSummary;
    _members?: any[];
    _folderCount?: number;
    _folderCountLabel?: string;
    _memberCount?: number;
    _memberCountLabel?: string;
    _roleLabel?: string;
    _visibility?: string;
    _statusLabel?: string;
}

export interface WorkspaceListQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: WorkspaceListStatus;
    sortBy?: BackendWorkspaceSort | 'name' | 'slug' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    visibility?: WorkspaceVisibility;
    isPersonal?: boolean;
    ownerId?: string;
}

export interface WorkspaceListApiResponse {
    success: boolean;
    message: string;
    data: WorkspaceListItem[];
    meta: WorkspaceListMeta;
}

export interface WorkspaceGroup {
    id: string;
    label: string;
    status: 'ACTIVE' | 'ARCHIVED';
    accent: string;
    items: WorkspaceListItem[];
    count: number;
}