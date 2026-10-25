import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { API_ENDPOINTS } from '../../shared/constants/api.constants';
import { Subscription } from './subscription';
import { SubscriptionCatalogResponse } from './services/plans.service';
import { AuthStore } from '../../public/auth/state/auth.store';

const mockCatalog: SubscriptionCatalogResponse = {
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
      description: 'Your simple notes workspace',
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
      description: 'Supercharge your daily workflow',
      badge: 'Recommended',
      isPopular: true,
      isCurrent: false,
      buttonText: 'Upgrade to Pro',
      buttonDisabled: false,
      prices: [
        {
          id: 'price-pro-monthly',
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
          id: 'price-pro-yearly',
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
          id: 'price-pro-monthly',
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
          id: 'price-pro-yearly',
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
      highlights: ['Custom sticky themes', 'Unlimited folders', 'Priority support'],
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
  ],
  comparisonMatrix: [
    {
      featureCode: 'NOTES_LIMIT',
      featureName: 'Sticky Notes Limit',
      description: 'Max notes you can create',
      type: 'BOOLEAN',
      plans: {
        FREE: { included: true, formattedValue: 'Unlimited', isUnlimited: true },
        PRO: { included: true, formattedValue: 'Unlimited', isUnlimited: true },
      },
    },
    {
      featureCode: 'FOLDERS',
      featureName: 'Workspace Folders',
      type: 'QUOTA',
      plans: {
        FREE: { included: true, formattedValue: '3', isUnlimited: false },
        PRO: { included: true, formattedValue: 'Unlimited', isUnlimited: true },
      },
    },
  ],
  userSubscription: {
    subscriptionId: 'sub-active-01',
    planCode: 'FREE',
    status: 'ACTIVE',
    currentPeriodEnd: '2026-12-31T00:00:00.000Z',
  },
};

describe('Subscription Component', { timeout: 20000 }, () => {
  let routerNavigateSpy: any;

  beforeEach(() => {
    const routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };
    routerNavigateSpy = routerMock.navigate;

    TestBed.configureTestingModule({
      imports: [Subscription],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  const expectCatalogRequest = () =>
    TestBed.inject(HttpTestingController).expectOne(
      (req) => req.url === API_ENDPOINTS.plans.subscriptionPlans,
    );

  it('renders loading state initially and then displays catalog plans dynamically', () => {
    const fixture = TestBed.createComponent(Subscription);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Loading available plans');

    expectCatalogRequest().flush({ success: true, data: mockCatalog });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Starter');
    expect(fixture.nativeElement.textContent).toContain('Pro');
    expect(fixture.nativeElement.textContent).toContain('$10');
    expect(fixture.nativeElement.textContent).toContain('Current Plan');
    expect(fixture.nativeElement.textContent).toContain('Popular');
    expect(
      fixture.nativeElement.querySelectorAll('.plan-note [data-card-shape="stickyFold"]').length,
    ).toBe(2);
    expect(fixture.nativeElement.querySelector('.save-badge').textContent).toContain(
      'Save up to 20%',
    );
  });

  it('toggles billing cycle between monthly and yearly correctly', () => {
    const fixture = TestBed.createComponent(Subscription);
    fixture.detectChanges();
    expectCatalogRequest().flush({ success: true, data: mockCatalog });
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.selectedCycle()).toBe('MONTHLY');
    expect(component.priceDisplay(mockCatalog.plans[1])).toBe('$10');

    // Change to yearly
    component.onCycleChange('YEARLY');
    fixture.detectChanges();

    expect(component.selectedCycle()).toBe('YEARLY');
    expect(component.priceDisplay(mockCatalog.plans[1])).toBe('$96');
    expect(component.intervalDisplay(mockCatalog.plans[1])).toBe('/ year');
    expect(fixture.nativeElement.textContent).toContain('Save 20%');
    expect(fixture.nativeElement.textContent).toContain('Billed annually ($8/mo)');
  });

  it('renders current subscription notification banner when user has active subscription', () => {
    const fixture = TestBed.createComponent(Subscription);
    fixture.detectChanges();
    expectCatalogRequest().flush({ success: true, data: mockCatalog });
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.current-sub-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('Plan: FREE');
    expect(banner.textContent).toContain('ACTIVE');
  });

  it('emits planSelected and navigates anonymous user to signup with selected plan', () => {
    const fixture = TestBed.createComponent(Subscription);
    fixture.detectChanges();
    expectCatalogRequest().flush({ success: true, data: mockCatalog });
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const selectedPlanSpy = vi.fn();
    component.planSelected.subscribe(selectedPlanSpy);

    // Click Pro plan CTA
    component.choosePlan(mockCatalog.plans[1]);

    expect(selectedPlanSpy).toHaveBeenCalledWith(mockCatalog.plans[1]);
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/auth/signup'], {
      queryParams: { plan: 'PRO', cycle: 'MONTHLY' },
    });
  });

  it('renders comparison matrix with feature names and indicators', () => {
    const fixture = TestBed.createComponent(Subscription);
    fixture.detectChanges();
    expectCatalogRequest().flush({ success: true, data: mockCatalog });
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('.comparison-table');
    expect(table).not.toBeNull();
    expect(table.textContent).toContain('Sticky Notes Limit');
    expect(table.textContent).toContain('Workspace Folders');
    expect(table.textContent).toContain('Unlimited');
  });

  it('shows error state when catalog fails to load and allows retry', () => {
    const fixture = TestBed.createComponent(Subscription);
    fixture.detectChanges();

    expectCatalogRequest().flush('Server error', { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Plans are taking a little longer to load');

    // Click retry
    fixture.componentInstance.loadPlans();
    expectCatalogRequest().flush({ success: true, data: mockCatalog });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Starter');
  });

  it('shows empty state when no plans are returned', () => {
    const fixture = TestBed.createComponent(Subscription);
    fixture.detectChanges();

    expectCatalogRequest().flush({
      success: true,
      data: { ...mockCatalog, plans: [] },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('New plans are on the way');
  });
});
