import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { buildHttpParams } from '../../../shared/functions/api.functions';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private readonly http = inject(HttpClient);

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
