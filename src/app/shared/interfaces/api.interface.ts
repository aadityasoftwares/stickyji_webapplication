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

/** A successful endpoint contract with a required payload. */
export interface ApiDataResponse<T> extends ApiResponse<T> {
  data: T;
}

/** Endpoints that return a payload but omit success/message metadata. */
export interface ApiResult<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export type PartialPaginationMeta = Partial<PaginationMeta>;

export interface CompletePaginationMeta extends PaginationMeta {
  totalPages: number;
}

export interface PaginatedDataResponse<T> extends ApiDataResponse<T[]> {
  pagination: PaginationMeta;
}

export interface PaginatedResult<T> extends ApiResult<T[]> {
  pagination: PaginationMeta;
}

/** Member and assignee lists require meta; older deployments also return pagination. */
export interface MetaPaginatedResponse<T> extends ApiDataResponse<readonly T[]> {
  meta: CompletePaginationMeta;
  pagination?: CompletePaginationMeta | null;
}

export interface ApiCollectionResponse<T> extends ApiResult<readonly T[]> {
  pagination?: PartialPaginationMeta | null;
  meta?: PartialPaginationMeta | null;
}

export interface ApiDeleteResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}
