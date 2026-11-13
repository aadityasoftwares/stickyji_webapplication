import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, finalize, shareReplay, takeUntil, tap } from 'rxjs';
import { SessionLifecycleService } from '../../../shared/services/session-lifecycle.service';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { buildHttpParams } from '../../../shared/functions/api.functions';
import type {
  WorkspaceDropdownQuery,
  WorkspaceDropdownResponse,
} from '../interfaces/workspace-dropdown.interface';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private readonly lifecycle = inject(SessionLifecycleService);

  constructor() {
    this.lifecycle.registerReset(() => this.dropdownRequests.clear());
  }
  private readonly http = inject(HttpClient);
  private readonly dropdownRequests = new Map<string, Observable<WorkspaceDropdownResponse>>();

  getWorkspaceDropdown(
    query: WorkspaceDropdownQuery | string = {},
  ): Observable<WorkspaceDropdownResponse> {
    const search = typeof query === 'string' ? query : query?.search;
    const key = search?.trim() ?? '';
    const pending = this.dropdownRequests.get(key);
    if (pending) return pending;
    const params = key ? buildHttpParams({ search: key }) : undefined;

    const request$ = this.http
      .get<WorkspaceDropdownResponse>(API_ENDPOINTS.workspaces.dropdown, {
        params,
        withCredentials: true,
      })
      .pipe(
        takeUntil(this.lifecycle.ended$),
        // Release before notifying subscribers: a completed load can trigger a refresh.
        tap(() => this.dropdownRequests.delete(key)),
        finalize(() => {
          if (this.dropdownRequests.get(key) === request$) this.dropdownRequests.delete(key);
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    this.dropdownRequests.set(key, request$);
    return request$;
  }

  getDropdown(search?: string): Observable<WorkspaceDropdownResponse> {
    return this.getWorkspaceDropdown(search);
  }

  getAll(query: any = {}): Observable<any> {
    return this.getAllWorkspaces(query);
  }

  getAllWorkspaces(query: any = {}): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.workspaces.getAll, query, {
      withCredentials: true,
    });
  }

  getMyWorkspaces(query: any = {}): Observable<any> {
    const params = buildHttpParams(query);

    return this.http.get<any>(API_ENDPOINTS.workspaces.my, {
      params,
      withCredentials: true,
    });
  }

  getById(id: any = ''): Observable<any> {
    return this.http.get<any>(API_ENDPOINTS.workspaces.get(String(id)), {
      withCredentials: true,
    });
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.workspaces.create, payload, {
      withCredentials: true,
    });
  }

  update(id: any = '', payload: any = {}): Observable<any> {
    return this.http.put<any>(API_ENDPOINTS.workspaces.update(String(id)), payload, {
      withCredentials: true,
    });
  }

  updateStatus(id: any = '', status: any): Observable<any> {
    return this.http.put<any>(
      API_ENDPOINTS.workspaces.status(String(id)),
      { status },
      {
        withCredentials: true,
      },
    );
  }

  delete(id: any = ''): Observable<any> {
    return this.http.delete<any>(API_ENDPOINTS.workspaces.delete(String(id)), {
      withCredentials: true,
    });
  }

  moveToTrash(id: any = ''): Observable<any> {
    return this.http.put<any>(
      `${API_ENDPOINTS.workspaces.base}/trash/${encodeURIComponent(String(id))}`,
      {},
      {
        withCredentials: true,
      },
    );
  }

  restore(id: any = ''): Observable<any> {
    return this.http.put<any>(
      API_ENDPOINTS.workspaces.restore(String(id)),
      {},
      {
        withCredentials: true,
      },
    );
  }

  permanentlyDelete(id: any = ''): Observable<any> {
    return this.http.delete<any>(
      `${API_ENDPOINTS.workspaces.base}/permanent/${encodeURIComponent(String(id))}`,
      {
        withCredentials: true,
      },
    );
  }

  getTrash(query: any = {}): Observable<any> {
    return this.getMyWorkspaces({
      status: 'DELETED',
      ...query,
    });
  }
}
