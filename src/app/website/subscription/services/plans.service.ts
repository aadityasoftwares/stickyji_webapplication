import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, of } from 'rxjs';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { ApiResponse, PaginatedApiResponse } from '../../../shared/models/api.models';

export type BillingInterval = 'MONTHLY' | 'YEARLY';
export type BillingCycle = BillingInterval;

export interface PlanPriceDTO {
  id?: string | null;
  billingInterval?: BillingInterval;
  amountMinor?: number;
  amountMajor?: number;
  currency?: string;
  currencySymbol?: string;
  formatted?: string;
  monthlyEquivalent?: number;
  savingsPercentage?: number | null;
  // Optional / backwards-compatibility
  planPriceId?: string | null;
  amount?: number;
  billingCycle?: BillingInterval;
  formattedPrice?: string;
  pricePerMonthFormatted?: string;
}

export interface PlanPricingDTO {
  monthly?: PlanPriceDTO;
  yearly?: PlanPriceDTO;
  [key: string]: PlanPriceDTO | undefined;
}

export interface PlanFeatureDTO {
  code: string;
  name: string;
  description?: string;
  category?: string;
  type: 'BOOLEAN' | 'QUOTA' | string;
  isEnabled: boolean;
  limit?: number | null;
  limitType?: string;
  isUnlimited: boolean;
  formattedLimit?: string;
  // Backwards compatibility
  featureId?: string;
  value?: string | number | boolean;
  displayValue?: string;
}

export interface PlanCardDTO {
  id: string;
  name: string;
  code: string;
  type?: 'FREE' | 'PAID' | string;
  description: string;
  badge: string | null;
  isPopular: boolean;
  isDefault?: boolean;
  trialDays?: number;
  sortOrder?: number;
  isCurrent: boolean;
  prices: PlanPriceDTO[] | Record<string, PlanPriceDTO>;
  pricing?: PlanPricingDTO;
  highlights: string[];
  features: PlanFeatureDTO[];
  featureCategories?: Record<string, PlanFeatureDTO[]>;
  // UI helpers
  buttonText?: string;
  buttonDisabled?: boolean;
}

export interface ComparisonPlanValue {
  included?: boolean;
  formattedValue?: string;
  isUnlimited: boolean;
  // Backwards compatibility
  isEnabled?: boolean;
  displayValue?: string;
  raw?: any;
}

export interface ComparisonMatrixRow {
  featureCode: string;
  featureName: string;
  category?: string;
  description?: string;
  type: 'BOOLEAN' | 'QUOTA' | string;
  unit?: string;
  plans?: Record<string, ComparisonPlanValue>;
  // Backwards compatibility
  values?: Record<string, ComparisonPlanValue>;
}

export interface CatalogCurrency {
  code: string;
  symbol: string;
}

export interface UserSubscriptionDTO {
  subscriptionId?: string;
  planCode?: string;
  status?: string;
  currentPeriodEnd?: string;
  [key: string]: any;
}

export interface SubscriptionCatalogResponse {
  plans: PlanCardDTO[];
  billingIntervals: BillingInterval[];
  currency: CatalogCurrency | string;
  comparisonMatrix: ComparisonMatrixRow[];
  userSubscription: UserSubscriptionDTO | null;
  // Backwards compatibility
  billingCycles?: Array<{
    id: BillingInterval;
    label: string;
    badge: string | null;
  }>;
  currentSubscription?: UserSubscriptionDTO | null;
}

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

  getSubscriptionCatalog(): Observable<SubscriptionCatalogResponse> {
    return this.http
      .get<ApiResponse<SubscriptionCatalogResponse>>(API_ENDPOINTS.plans.subscriptionPlans)
      .pipe(
        map((response) => {
          const data = response?.data ?? (response as unknown as SubscriptionCatalogResponse);
          if (!data || !Array.isArray(data.plans)) {
            throw new Error('Subscription catalog data is unavailable.');
          }
          if (data.userSubscription && !data.currentSubscription) {
            data.currentSubscription = data.userSubscription;
          } else if (data.currentSubscription && !data.userSubscription) {
            data.userSubscription = data.currentSubscription;
          }
          return data;
        }),
      );
  }

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
