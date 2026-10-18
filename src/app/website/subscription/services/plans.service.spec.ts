import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { PlansService, PublicPlan } from './plans.service';

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

describe('PlansService', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads every page and excludes private or inactive plans', () => {
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
