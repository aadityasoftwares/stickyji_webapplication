import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import type { ApiResponse } from '../../../shared/interfaces/api.interface';
import { SessionLifecycleService } from '../../../shared/services/session-lifecycle.service';
import type {
  InitialSetupPayload,
  InitialSetupResult,
  OnboardingStatus,
} from '../interfaces/onboarding.interface';

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly lifecycle = inject(SessionLifecycleService);

  readonly status = signal<OnboardingStatus | null>(null);
  readonly checking = signal<boolean>(false);
  readonly showModal = signal<boolean>(false);
  readonly completed = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);

  constructor() {
    this.lifecycle.registerReset(() => this.reset());
  }

  checkStatus(): Observable<OnboardingStatus | null> {
    this.checking.set(true);

    return this.http
      .get<ApiResponse<OnboardingStatus>>(API_ENDPOINTS.onboarding.status, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response?.data ?? (response as unknown as OnboardingStatus)),
        tap((status) => {
          this.status.set(status);
          this.checking.set(false);
          if (status?.requiresOnboarding) {
            this.showModal.set(true);
          } else {
            this.showModal.set(false);
          }
        }),
        catchError(() => {
          this.checking.set(false);
          return of(null);
        }),
      );
  }

  initialSetup(payload: InitialSetupPayload): Observable<ApiResponse<InitialSetupResult>> {
    this.submitting.set(true);

    return this.http
      .post<ApiResponse<InitialSetupResult>>(API_ENDPOINTS.onboarding.initialSetup, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.submitting.set(false);
          if (response?.success) {
            this.status.set({
              hasWorkspaces: true,
              hasFolders: true,
              requiresOnboarding: false,
            });
            this.showModal.set(false);
            this.completed.set(true);
          }
        }),
        catchError((error) => {
          this.submitting.set(false);
          throw error;
        }),
      );
  }

  openModal(): void {
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  reset(): void {
    this.status.set(null);
    this.checking.set(false);
    this.showModal.set(false);
    this.completed.set(false);
    this.submitting.set(false);
  }
}

