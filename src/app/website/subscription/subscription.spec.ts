import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subscription } from './subscription';
import { API_ENDPOINTS } from '../../shared/constants/api.constants';

const plan = {
  _id: 'free',
  code: 'FREE',
  name: 'Starter',
  description: 'Your notes',
  type: 'FREE',
  pricingModel: 'FIXED',
  visibility: 'PUBLIC',
  isActive: true,
  isDefault: true,
  isPopular: false,
  trialDays: 0,
  sortOrder: 0,
} as const;

describe('Subscription', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [Subscription],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  const request = () =>
    TestBed.inject(HttpTestingController).expectOne(
      (req) => req.url === API_ENDPOINTS.plans.getAll,
    );

  it('renders live plans and emits the selected plan', () => {
    const fixture = TestBed.createComponent(Subscription);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading available plans');
    request().flush({ success: true, data: [plan] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Starter');
    expect(fixture.nativeElement.textContent).not.toContain('$');
    const selected = vi.fn();
    fixture.componentInstance.planSelected.subscribe(selected);
    fixture.nativeElement.querySelector('.plan-action button').click();
    expect(selected).toHaveBeenCalledWith(plan);
  });

  it('shows failure and retries successfully into the empty state', () => {
    const fixture = TestBed.createComponent(Subscription);
    fixture.detectChanges();
    request().flush({}, { status: 500, statusText: 'Failed' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    fixture.nativeElement.querySelector('.state-card button').click();
    request().flush({ success: true, data: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('no public plans available');
  });

  it('does not present paid or custom plans as free', () => {
    const component = TestBed.createComponent(Subscription).componentInstance;
    expect(component.priceLabel({ ...plan, type: 'PAID' })).toBe('Paid plan');
    expect(component.priceLabel({ ...plan, type: 'CUSTOM', pricingModel: 'CUSTOM' })).toBe(
      'Custom pricing',
    );
  });
});
