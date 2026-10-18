import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';

@Injectable({
  providedIn: 'root',
})
export class UserPreferenceService {
  private readonly http = inject(HttpClient);

  getMyPreferences(): Observable<any> {
    return this.http.get<any>(API_ENDPOINTS.userPreferences.my, { withCredentials: true });
  }

  getPreference(key: string): Observable<any> {
    return this.http.get<any>(API_ENDPOINTS.userPreferences.byKey(key), { withCredentials: true });
  }

  createPreference(key: string, value: any): Observable<any> {
    return this.http.post<any>(
      API_ENDPOINTS.userPreferences.create,
      { key, value },
      { withCredentials: true },
    );
  }

  updatePreference(key: string, value: any): Observable<any> {
    return this.http.put<any>(
      API_ENDPOINTS.userPreferences.update,
      { key, value },
      { withCredentials: true },
    );
  }

  deletePreference(key: string): Observable<any> {
    return this.http.delete<any>(API_ENDPOINTS.userPreferences.byKey(key), {
      withCredentials: true,
    });
  }

  resetPreference(key: string): Observable<any> {
    return this.http.post<any>(
      API_ENDPOINTS.userPreferences.reset,
      { key },
      { withCredentials: true },
    );
  }

  resetAllPreferences(): Observable<any> {
    return this.http.post<any>(
      API_ENDPOINTS.userPreferences.resetAll,
      {},
      { withCredentials: true },
    );
  }
}
