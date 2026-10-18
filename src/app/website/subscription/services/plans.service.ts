import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, of } from 'rxjs';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { PaginatedApiResponse } from '../../../shared/models/api.models';

export interface PublicPlan {
  _id: string;
  name: string;
  code: string;
  description: string;
  type: 'FREE' | 'PAID' | 'CUSTOM';
  pricingModel: 'FIXED' | 'CUSTOM';
  visibility: 'PUBLIC' | 'PRIVATE';
  trialDays: number;
  isPopular: boolean;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlansService {
  private readonly http = inject(HttpClient);

  getPublicPlans(): Observable<readonly PublicPlan[]> {
    return this.getPage(1).pipe(
      map((plans) =>
        plans
          .filter((plan) => plan.isActive && plan.visibility === 'PUBLIC')
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
      ),
    );
  }

  private getPage(page: number): Observable<PublicPlan[]> {
    return this.http
      .get<PaginatedApiResponse<PublicPlan>>(API_ENDPOINTS.plans.getAll, {
        params: {
          page,
          limit: 100,
          isActive: true,
          visibility: 'PUBLIC',
          sortBy: 'sortOrder',
          sortOrder: 'asc',
        },
      })
      .pipe(
        switchMap((response) => {
          if (!response.success || !Array.isArray(response.data)) {
            throw new Error('Plans could not be loaded.');
          }
          const plans = [...response.data];
          const meta = response.meta ?? response.pagination;
          const totalPages = meta?.totalPages ?? (meta ? Math.ceil(meta.total / meta.limit) : page);
          return page < totalPages && plans.length > 0
            ? this.getPage(page + 1).pipe(map((next) => [...plans, ...next]))
            : of(plans);
        }),
      );
  }
}
