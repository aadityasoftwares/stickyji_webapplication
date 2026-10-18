import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { PlansService, PublicPlan, SubscriptionCatalogResponse } from './plans.service';

export const planFixture = (overrides: Partial<PublicPlan> = {}): PublicPlan => ({
  _id: 'plan-free',
  name: 'Free',
  code: 'FREE',
  description: 'A personal workspace',
  type: 'FREE',
  pricingModel: 'FIXED',
  visibility: 'PUBLIC',
  trialDays: 0,
  isPopular: false,
  sortOrder: 0,
  isDefault: true,
  isActive: true,
  ...overrides,
});

export const catalogFixture = (): SubscriptionCatalogResponse => ({
  currency: {
    code: 'USD',
    symbol: '$',
  },
  billingIntervals: ['MONTHLY', 'YEARLY'],
  plans: [
    {
      id: 'plan-free',
      code: 'FREE',
      name: 'Starter',
      type: 'FREE',
      description: 'Free note taking',
      badge: null,
      isPopular: false,
      isCurrent: true,
      buttonText: 'Current Plan',
      buttonDisabled: true,
      prices: [
        {
          id: null,
          billingInterval: 'MONTHLY',
          amountMinor: 0,
          amountMajor: 0,
          currency: 'USD',
          currencySymbol: '$',
          formatted: 'Free',
          monthlyEquivalent: 0,
          savingsPercentage: 0,
        },
        {
          id: null,
          billingInterval: 'YEARLY',
          amountMinor: 0,
          amountMajor: 0,
          currency: 'USD',
          currencySymbol: '$',
          formatted: 'Free',
          monthlyEquivalent: 0,
          savingsPercentage: 0,
        },
      ],
      pricing: {
        monthly: {
          id: null,
          billingInterval: 'MONTHLY',
          amountMinor: 0,
          amountMajor: 0,
          currency: 'USD',
          currencySymbol: '$',
          formatted: 'Free',
          monthlyEquivalent: 0,
          savingsPercentage: 0,
        },
        yearly: {
          id: null,
          billingInterval: 'YEARLY',
          amountMinor: 0,
          amountMajor: 0,
          currency: 'USD',
          currencySymbol: '$',
          formatted: 'Free',
          monthlyEquivalent: 0,
          savingsPercentage: 0,
        },
      },
      highlights: ['Unlimited personal sticky notes', 'Single workspace'],
      features: [
        {
          code: 'NOTES_LIMIT',
          name: 'Notes',
          type: 'BOOLEAN',
          limit: null,
          formattedLimit: 'Unlimited',
          isUnlimited: true,
          isEnabled: true,
        },
      ],
    },
    {
      id: 'plan-pro',
      code: 'PRO',
      name: 'Pro',
      type: 'PAID',
      description: 'For growing productivity',
      badge: 'Popular',
      isPopular: true,
      isCurrent: false,
      buttonText: 'Upgrade to Pro',
      buttonDisabled: false,
      prices: [
        {
          id: 'price-pro-m',
          billingInterval: 'MONTHLY',
          amountMinor: 1000,
          amountMajor: 10,
          currency: 'USD',
          currencySymbol: '$',
          formatted: '$10/month',
          monthlyEquivalent: 10,
          savingsPercentage: 0,
        },
        {
          id: 'price-pro-y',
          billingInterval: 'YEARLY',
          amountMinor: 9600,
          amountMajor: 96,
          currency: 'USD',
          currencySymbol: '$',
          formatted: '$96/year',
          monthlyEquivalent: 8,
          savingsPercentage: 20,
        },
      ],
      pricing: {
        monthly: {
          id: 'price-pro-m',
          billingInterval: 'MONTHLY',
          amountMinor: 1000,
          amountMajor: 10,
          currency: 'USD',
          currencySymbol: '$',
          formatted: '$10/month',
          monthlyEquivalent: 10,
          savingsPercentage: 0,
        },
        yearly: {
          id: 'price-pro-y',
          billingInterval: 'YEARLY',
          amountMinor: 9600,
          amountMajor: 96,
          currency: 'USD',
          currencySymbol: '$',
          formatted: '$96/year',
          monthlyEquivalent: 8,
          savingsPercentage: 20,
        },
      },
      highlights: ['Custom themes', 'Unlimited folders'],
      features: [],
    },
  ],
  comparisonMatrix: [
    {
      featureCode: 'NOTES_LIMIT',
      featureName: 'Sticky Notes Limit',
      type: 'BOOLEAN',
      plans: {
        FREE: { included: true, formattedValue: 'Unlimited', isUnlimited: true },
        PRO: { included: true, formattedValue: 'Unlimited', isUnlimited: true },
      },
    },
  ],
  userSubscription: {
    subscriptionId: 'sub-123',
    planCode: 'FREE',
    status: 'ACTIVE',
  },
});

describe('PlansService', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('retrieves subscription catalog and unwraps response data', () => {
    let result: SubscriptionCatalogResponse | null = null;
    const fixture = catalogFixture();

    TestBed.inject(PlansService)
      .getSubscriptionCatalog()
      .subscribe((catalog) => (result = catalog));

    const req = http.expectOne(API_ENDPOINTS.plans.subscriptionPlans);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: fixture });

    expect(result).not.toBeNull();
    expect(result!.plans.length).toBe(2);
    expect(result!.plans[0].code).toBe('FREE');
    expect(result!.userSubscription?.subscriptionId).toBe('sub-123');
    expect(result!.currentSubscription?.subscriptionId).toBe('sub-123');
  });

  it('handles invalid or empty catalog responses with an error', () => {
    const errorFn = vi.fn();

    TestBed.inject(PlansService).getSubscriptionCatalog().subscribe({ error: errorFn });

    http.expectOne(API_ENDPOINTS.plans.subscriptionPlans).flush({ success: false, data: null });

    expect(errorFn).toHaveBeenCalledOnce();
  });

  it('loads every page and excludes private or inactive plans for getPublicPlans', () => {
    let result: readonly PublicPlan[] = [];
    TestBed.inject(PlansService)
      .getPublicPlans()
      .subscribe((plans) => (result = plans));
    const first = http.expectOne(
      (req) => req.url === API_ENDPOINTS.plans.getAll && req.params.get('page') === '1',
    );
    expect(first.request.params.get('visibility')).toBe('PUBLIC');
    expect(first.request.params.get('isActive')).toBe('true');
    first.flush({
      success: true,
      data: [
        planFixture({ _id: 'pro', name: 'Pro', sortOrder: 2 }),
        planFixture({ _id: 'hidden', visibility: 'PRIVATE' }),
      ],
      meta: { totalPages: 2 },
    });
    http
      .expectOne((req) => req.params.get('page') === '2')
      .flush({
        success: true,
        data: [planFixture(), planFixture({ _id: 'inactive', isActive: false })],
        meta: { totalPages: 2 },
      });
    expect(result.map((plan) => plan._id)).toEqual(['plan-free', 'pro']);
  });

  it('propagates server failure without substituting demo plans', () => {
    const error = vi.fn();
    TestBed.inject(PlansService).getPublicPlans().subscribe({ error });
    http
      .expectOne((req) => req.url === API_ENDPOINTS.plans.getAll)
      .flush('Failed', { status: 500, statusText: 'Server error' });
    expect(error).toHaveBeenCalledOnce();
  });
});
