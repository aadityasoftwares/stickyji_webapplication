import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constants';
import type {
  ApiResponse,
  PaginatedApiResponse,
  Permission,
  PermissionCollection,
  PermissionCreateRequest,
  PermissionGroup,
  PermissionListResponse,
  PermissionQuery,
  PermissionUpdateRequest,
} from '../models/permission.models';

@Injectable({ providedIn: 'root' })
export class PermissionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;
  private readonly permissionBaseUrl = `${this.baseUrl}/permissions`;
  private readonly getAllUrl = `${this.permissionBaseUrl}/getall`;
  private readonly groupedUrl = `${this.permissionBaseUrl}/grouped`;
  private readonly getUrl = `${this.permissionBaseUrl}/get`;
  private readonly createUrl = `${this.permissionBaseUrl}/create`;
  private readonly updateUrl = `${this.permissionBaseUrl}/update`;
  private readonly deleteUrl = `${this.permissionBaseUrl}/delete`;

  getAll(query: PermissionQuery = {}): Observable<PermissionListResponse> {
    return this.http.post<PermissionListResponse>(this.getAllUrl, query, {
      withCredentials: true,
    });
  }

  getById(id: string): Observable<ApiResponse<Permission>> {
    return this.http.get<ApiResponse<Permission>>(`${this.getUrl}/${encodeURIComponent(id)}`, {
      withCredentials: true,
    });
  }

  getByCode(code: string): Observable<ApiResponse<Permission>> {
    return this.http.get<ApiResponse<Permission>>(
      `${this.getUrl}/code/${encodeURIComponent(code)}`,
      { withCredentials: true },
    );
  }

  create(payload: PermissionCreateRequest): Observable<ApiResponse<Permission>> {
    return this.http
      .post<ApiResponse<Permission>>(this.createUrl, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => this.requirePermission(response)));
  }

  update(id: string, payload: PermissionUpdateRequest): Observable<ApiResponse<Permission>> {
    return this.http
      .put<ApiResponse<Permission>>(`${this.updateUrl}/${encodeURIComponent(id)}`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => this.requirePermission(response)));
  }

  changeStatus(id: string, isActive: boolean): Observable<ApiResponse<Permission>> {
    return this.http
      .patch<ApiResponse<Permission>>(
        `${this.updateUrl}/${encodeURIComponent(id)}/status`,
        { isActive },
        { withCredentials: true },
      )
      .pipe(map((response) => this.requirePermission(response)));
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.deleteUrl}/${encodeURIComponent(id)}`, {
      withCredentials: true,
    });
  }

  /**
   * Preferred API for the role builder.
   *
   * The fallback keeps the screen working even before /permissions/grouped
   * is added to the Express router. It loads active permissions and groups
   * them on the client.
   */
  getGrouped(includeInactive = false): Observable<readonly PermissionGroup[]> {
    if (includeInactive) {
      return this.getAll({
        page: 1,
        limit: 100,
        sortBy: 'sortOrder',
        sortOrder: 'asc',
      }).pipe(map((response) => this.groupPermissions(this.extractPermissions(response), true)));
    }

    return this.http
      .get<ApiResponse<readonly PermissionGroup[]>>(this.groupedUrl, {
        withCredentials: true,
      })
      .pipe(
        map((response) => this.normalizeGroups(response?.data)),
        catchError(() =>
          this.getAll({
            page: 1,
            limit: 100,
            isActive: true,
            sortBy: 'sortOrder',
            sortOrder: 'asc',
          }).pipe(map((response) => this.groupPermissions(this.extractPermissions(response)))),
        ),
      );
  }

  private requirePermission(response: ApiResponse<Permission>): ApiResponse<Permission> {
    if (!response?.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
      throw new Error(
        response?.message ||
          'The server returned an invalid permission. Refresh permissions before trying again.',
      );
    }
    return response;
  }

  private extractPermissions(
    response: PermissionListResponse | PaginatedApiResponse<Permission>,
  ): readonly Permission[] {
    const data = response?.data as readonly Permission[] | PermissionCollection | null | undefined;

    if (Array.isArray(data)) return data as readonly Permission[];
    if (!data || typeof data !== 'object') return [];

    const collection = data as PermissionCollection;
    const candidates = [
      collection.data,
      collection.items,
      collection.permissions,
      collection.docs,
      collection.results,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as readonly Permission[];
    }

    return [];
  }

  private normalizeGroups(
    groups: readonly PermissionGroup[] | null | undefined,
  ): readonly PermissionGroup[] {
    return (Array.isArray(groups) ? groups : [])
      .filter((group) => group && typeof group === 'object')
      .map((group) => ({
        module: String(group.module ?? '')
          .trim()
          .toUpperCase(),
        permissions: (Array.isArray(group.permissions) ? [...group.permissions] : [])
          .filter(
            (permission) =>
              permission && typeof permission === 'object' && permission.isActive !== false,
          )
          .sort(
            (first, second) =>
              (first.sortOrder ?? 0) - (second.sortOrder ?? 0) ||
              String(first.displayName ?? '').localeCompare(String(second.displayName ?? '')),
          ),
      }))
      .filter((group) => !!group.module && group.permissions.length > 0)
      .sort((first, second) => first.module.localeCompare(second.module));
  }

  private groupPermissions(
    permissions: readonly Permission[],
    includeInactive = false,
  ): readonly PermissionGroup[] {
    const groups = new Map<string, Permission[]>();

    for (const permission of Array.isArray(permissions) ? permissions : []) {
      if (
        !permission ||
        typeof permission !== 'object' ||
        (!includeInactive && permission.isActive === false)
      )
        continue;

      const module =
        String(permission.module ?? 'OTHER')
          .trim()
          .toUpperCase() || 'OTHER';
      const current = groups.get(module) ?? [];
      current.push(permission);
      groups.set(module, current);
    }

    return [...groups.entries()]
      .map(([module, items]) => ({
        module,
        permissions: items.sort(
          (first, second) =>
            (first.sortOrder ?? 0) - (second.sortOrder ?? 0) ||
            String(first.displayName ?? '').localeCompare(String(second.displayName ?? '')),
        ),
      }))
      .sort((first, second) => first.module.localeCompare(second.module));
  }
}
