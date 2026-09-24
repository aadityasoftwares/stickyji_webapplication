import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';

import { environment } from '../../../../Environments/environments';
import type {
    ApiResponse,
    PaginatedApiResponse,
    Permission,
    PermissionGroup,
    PermissionQuery
} from '../models/permission.models';

@Injectable({ providedIn: 'root' })
export class PermissionApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
    private readonly permissionBaseUrl = `${this.baseUrl}/permissions`;
    private readonly getAllUrl = `${this.permissionBaseUrl}/getall`;
    private readonly groupedUrl = `${this.permissionBaseUrl}/grouped`;

    getAll(query: PermissionQuery = {}): Observable<PaginatedApiResponse<Permission>> {
        return this.http.get<PaginatedApiResponse<Permission>>(this.getAllUrl, {
            params: this.createHttpParams(query),
            withCredentials: true
        });
    }

    /**
     * Preferred API for the role builder.
     *
     * The fallback keeps the screen working even before /permissions/grouped
     * is added to the Express router. It loads active permissions and groups
     * them on the client.
     */
    getGrouped(): Observable<readonly PermissionGroup[]> {
        return this.http
            .get<ApiResponse<readonly PermissionGroup[]>>(this.groupedUrl, {
                withCredentials: true
            })
            .pipe(
                map(response => this.normalizeGroups(response.data)),
                catchError(() =>
                    this.getAll({
                        page: 1,
                        limit: 100,
                        isActive: true,
                        sortBy: 'sortOrder',
                        sortOrder: 'asc'
                    }).pipe(map(response => this.groupPermissions(response.data ?? [])))
                )
            );
    }

    private normalizeGroups(groups: readonly PermissionGroup[] | null | undefined): readonly PermissionGroup[] {
        return [...(groups ?? [])]
            .map(group => ({
                module: String(group.module ?? '').trim().toUpperCase(),
                permissions: [...(group.permissions ?? [])]
                    .filter(permission => permission.isActive !== false)
                    .sort((first, second) =>
                        (first.sortOrder ?? 0) - (second.sortOrder ?? 0) ||
                        first.displayName.localeCompare(second.displayName)
                    )
            }))
            .filter(group => !!group.module && group.permissions.length > 0)
            .sort((first, second) => first.module.localeCompare(second.module));
    }

    private groupPermissions(permissions: readonly Permission[]): readonly PermissionGroup[] {
        const groups = new Map<string, Permission[]>();

        for (const permission of permissions) {
            if (permission.isActive === false) continue;

            const module = String(permission.module ?? 'OTHER').trim().toUpperCase() || 'OTHER';
            const current = groups.get(module) ?? [];
            current.push(permission);
            groups.set(module, current);
        }

        return [...groups.entries()]
            .map(([module, items]) => ({
                module,
                permissions: items.sort((first, second) =>
                    (first.sortOrder ?? 0) - (second.sortOrder ?? 0) ||
                    first.displayName.localeCompare(second.displayName)
                )
            }))
            .sort((first, second) => first.module.localeCompare(second.module));
    }

    private createHttpParams(query: PermissionQuery): HttpParams {
        let params = new HttpParams();

        for (const [key, value] of Object.entries(query)) {
            if (value === undefined || value === null || value === '') continue;
            params = params.set(key, String(value));
        }

        return params;
    }
}
