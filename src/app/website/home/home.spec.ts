import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Home } from './home';
import { API_ENDPOINTS } from '../../shared/constants/api.constants';

describe('Home', { timeout: 30000 }, () => {
  let fixture: ComponentFixture<Home>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.url === API_ENDPOINTS.plans.subscriptionPlans)
      .flush({
        success: true,
        data: {
          currency: 'USD',
          billingCycles: [],
          plans: [],
          comparisonMatrix: [],
          currentSubscription: null,
        },
      });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('renders the homepage with an empty plan catalogue', () =>
    expect(fixture.componentInstance).toBeTruthy());
  it('preserves the selected plan code when opening signup', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.choosePlan({
      _id: 'pro',
      name: 'Pro',
      code: 'PRO',
      description: 'Pro',
      type: 'PAID',
      pricingModel: 'FIXED',
      visibility: 'PUBLIC',
      trialDays: 7,
      isPopular: true,
      sortOrder: 1,
      isDefault: false,
      isActive: true,
    });
    expect(navigate).toHaveBeenCalledWith(['/auth/signup'], { queryParams: { plan: 'PRO' } });
  });
});
