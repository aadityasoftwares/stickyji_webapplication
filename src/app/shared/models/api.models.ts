export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
}

export interface PaginatedApiResponse<T> extends ApiResponse<readonly T[]> {
    data: readonly T[];
    pagination?: PaginationMeta | null;
    meta?: PaginationMeta | null;
}
