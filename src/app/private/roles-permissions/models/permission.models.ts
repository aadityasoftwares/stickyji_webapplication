export type PermissionAction =
    | 'CREATE'
    | 'READ'
    | 'UPDATE'
    | 'DELETE'
    | 'MANAGE'
    | 'INVITE'
    | 'ASSIGN'
    | 'REMOVE'
    | 'ARCHIVE'
    | 'MOVE'
    | 'SHARE'
    | 'EXPORT'
    | 'IMPORT'
    | 'SETTINGS'
    | 'TRANSFER'
    | string;

export type PermissionAccess = 'GENERAL' | 'OWN' | 'ANY' | string;

export interface Permission {
    id?: string;
    _id?: string;
    name: string;
    displayName: string;
    code: string;
    module: string;
    action: PermissionAction;
    access: PermissionAccess;
    description?: string;
    sortOrder: number;
    isSystem: boolean;
    isActive: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface PermissionGroup {
    module: string;
    permissions: readonly Permission[];
}

export interface PermissionCreateRequest {
    name: string;
    displayName: string;
    code: string;
    module: string;
    action: PermissionAction;
    access?: PermissionAccess;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
}

export interface PermissionUpdateRequest {
    name?: string;
    displayName?: string;
    code?: string;
    module?: string;
    action?: PermissionAction;
    access?: PermissionAccess;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
}

export interface PermissionQuery {
    page?: number;
    limit?: number;
    search?: string;
    module?: string;
    action?: string;
    access?: string;
    isSystem?: boolean;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface Pagination {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
}

export interface PermissionCollection {
    permissions?: readonly Permission[];
    items?: readonly Permission[];
    data?: readonly Permission[];
    docs?: readonly Permission[];
    results?: readonly Permission[];
    pagination?: Pagination | null;
    meta?: Pagination | null;
}

export type PermissionListResponse = ApiResponse<
    readonly Permission[] | PermissionCollection
> & {
    meta?: Pagination | null;
    pagination?: Pagination | null;
};

export interface ApiResponse<T> {
    success?: boolean;
    message?: string;
    data: T;
}

export interface PaginatedApiResponse<T> {
    success?: boolean;
    message?: string;
    data: readonly T[];
    pagination?: Pagination | null;
    meta?: Pagination | null;
}

