import { Tooltip } from '../../shared/components/tooltip/tooltip';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  LucideAlertCircle,
  LucideArrowRight,
  LucideCheck,
  LucideInfo,
  LucideMinus,
  LucideRefreshCw,
  LucideShield,
  LucideSparkles,
  LucideZap,
} from '@lucide/angular';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { AppIcon } from '../../shared/components/icon/icon';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';
import { TabItem, TabValue } from '../../shared/components/tabs/tabs';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { AuthStore } from '../../public/auth/state/auth.store';
import {
  BillingInterval,
  ComparisonMatrixRow,
  ComparisonPlanValue,
  PlanCardDTO,
  PlanPriceDTO,
  PlansService,
  SubscriptionCatalogResponse,
  UserSubscriptionDTO,
} from './services/plans.service';
import { BillingService, RazorpayPaymentSuccessResponse } from './services/billing.service';

export const DEFAULT_PLANS: PlanCardDTO[] = [
  {
    id: 'plan-free',
    name: 'Free',
    code: 'FREE',
    type: 'FREE',
    description: 'All essential productivity features with free usage limits.',
    badge: null,
    isPopular: false,
    isCurrent: false,
    prices: [
      {
        id: null,
        billingInterval: 'MONTHLY',
        amountMajor: 0,
        formatted: 'Free',
        currencySymbol: '₹',
      },
      {
        id: null,
        billingInterval: 'YEARLY',
        amountMajor: 0,
        formatted: 'Free',
        currencySymbol: '₹',
      },
    ],
    pricing: {
      monthly: {
        id: null,
        billingInterval: 'MONTHLY',
        amountMajor: 0,
        formatted: 'Free',
        currencySymbol: '₹',
      },
      yearly: {
        id: null,
        billingInterval: 'YEARLY',
        amountMajor: 0,
        formatted: 'Free',
        currencySymbol: '₹',
      },
    },
    highlights: [
      '3 Workspaces',
      '500 Sticky Notes',
      '100 MB Cloud Storage',
      '3 AI Note-Take Tax',
      'Kanban Boards & Checklists',
    ],
    features: [
      {
        code: 'WORKSPACES',
        name: 'Workspaces',
        type: 'QUOTA',
        formattedLimit: '3',
        isUnlimited: false,
        isEnabled: true,
      },
      {
        code: 'NOTES',
        name: 'Sticky Notes',
        type: 'QUOTA',
        formattedLimit: '500',
        isUnlimited: false,
        isEnabled: true,
      },
      {
        code: 'STORAGE',
        name: 'Cloud Storage',
        type: 'QUOTA',
        formattedLimit: '100 MB',
        isUnlimited: false,
        isEnabled: true,
      },
    ],
    buttonText: 'Get started free',
  },
  {
    id: 'plan-individual',
    name: 'Individual',
    code: 'INDIVIDUAL',
    type: 'PAID',
    description: 'More capacity for personal productivity.',
    badge: null,
    isPopular: false,
    isCurrent: false,
    prices: [
      {
        id: 'price-individual-monthly',
        billingInterval: 'MONTHLY',
        amountMajor: 49,
        formatted: '₹49',
        currencySymbol: '₹',
        savingsPercentage: 0,
      },
      {
        id: 'price-individual-yearly',
        billingInterval: 'YEARLY',
        amountMajor: 499,
        formatted: '₹499',
        monthlyEquivalent: 42,
        savingsPercentage: 15,
        currencySymbol: '₹',
        pricePerMonthFormatted: '₹42',
      },
    ],
    pricing: {
      monthly: {
        id: 'price-individual-monthly',
        billingInterval: 'MONTHLY',
        amountMajor: 49,
        formatted: '₹49',
        currencySymbol: '₹',
      },
      yearly: {
        id: 'price-individual-yearly',
        billingInterval: 'YEARLY',
        amountMajor: 499,
        formatted: '₹499',
        monthlyEquivalent: 42,
        savingsPercentage: 15,
        currencySymbol: '₹',
        pricePerMonthFormatted: '₹42',
      },
    },
    highlights: [
      '5 Workspaces',
      '5,000 Sticky Notes',
      '1 GB Cloud Storage',
      '100 MB Note-Take Tax',
      'Search & Productivity Filters',
    ],
    features: [
      {
        code: 'WORKSPACES',
        name: 'Workspaces',
        type: 'QUOTA',
        formattedLimit: '5',
        isUnlimited: false,
        isEnabled: true,
      },
      {
        code: 'NOTES',
        name: 'Sticky Notes',
        type: 'QUOTA',
        formattedLimit: '5,000',
        isUnlimited: false,
        isEnabled: true,
      },
      {
        code: 'STORAGE',
        name: 'Cloud Storage',
        type: 'QUOTA',
        formattedLimit: '1 GB',
        isUnlimited: false,
        isEnabled: true,
      },
    ],
    buttonText: 'Upgrade to Individual',
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    code: 'PRO',
    type: 'PAID',
    description: 'Expanded capacity for power users and teams.',
    badge: 'Popular',
    isPopular: true,
    isCurrent: false,
    prices: [
      {
        id: 'price-pro-monthly',
        billingInterval: 'MONTHLY',
        amountMajor: 99,
        formatted: '₹99',
        currencySymbol: '₹',
        savingsPercentage: 0,
      },
      {
        id: 'price-pro-yearly',
        billingInterval: 'YEARLY',
        amountMajor: 999,
        formatted: '₹999',
        monthlyEquivalent: 83,
        savingsPercentage: 15,
        currencySymbol: '₹',
        pricePerMonthFormatted: '₹83',
      },
    ],
    pricing: {
      monthly: {
        id: 'price-pro-monthly',
        billingInterval: 'MONTHLY',
        amountMajor: 99,
        formatted: '₹99',
        currencySymbol: '₹',
      },
      yearly: {
        id: 'price-pro-yearly',
        billingInterval: 'YEARLY',
        amountMajor: 999,
        formatted: '₹999',
        monthlyEquivalent: 83,
        savingsPercentage: 15,
        currencySymbol: '₹',
        pricePerMonthFormatted: '₹83',
      },
    },
    highlights: [
      '20 Workspaces',
      '25,000 Sticky Notes',
      '10 GB Cloud Storage',
      '3 MB Note-Take Tax',
      'Team Member Collaboration & Roles',
      'Activity & Audit History',
    ],
    features: [
      {
        code: 'WORKSPACES',
        name: 'Workspaces',
        type: 'QUOTA',
        formattedLimit: '20',
        isUnlimited: false,
        isEnabled: true,
      },
      {
        code: 'NOTES',
        name: 'Sticky Notes',
        type: 'QUOTA',
        formattedLimit: '25,000',
        isUnlimited: false,
        isEnabled: true,
      },
      {
        code: 'STORAGE',
        name: 'Cloud Storage',
        type: 'QUOTA',
        formattedLimit: '10 GB',
        isUnlimited: false,
        isEnabled: true,
      },
    ],
    buttonText: 'Upgrade to Pro',
  },
];

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [Tooltip, AppIcon, Badge, StickyCard],
  templateUrl: './subscription.html',
  styleUrl: './subscription.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subscription implements OnInit {
  private readonly plansService = inject(PlansService);
  private readonly billingService = inject(BillingService);
  private readonly authStore = inject(AuthStore);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Lucide Icons
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideMinus = LucideMinus;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideShield = LucideShield;
  readonly LucideZap = LucideZap;
  readonly LucideInfo = LucideInfo;
  readonly LucideAlertCircle = LucideAlertCircle;
  readonly LucideRefreshCw = LucideRefreshCw;

  // Catalog State Signals
  readonly catalog = signal<SubscriptionCatalogResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly selectedCycle = signal<BillingInterval>('MONTHLY');
  readonly processingPlanId = signal<string | null>(null);
  readonly yearlySavings = computed(() =>
    Math.max(
      0,
      ...this.plans().map(
        (plan) => this.getPlanIntervalPrice(plan, 'YEARLY')?.savingsPercentage ?? 0,
      ),
    ),
  );

  @Output() planSelected = new EventEmitter<PlanCardDTO>();

  // Computed state
  readonly plans = computed<PlanCardDTO[]>(() => this.catalog()?.plans ?? []);

  readonly comparisonMatrix = computed<ComparisonMatrixRow[]>(
    () => this.catalog()?.comparisonMatrix ?? [],
  );

  readonly userSubscription = computed<UserSubscriptionDTO | null>(
    () => this.catalog()?.userSubscription ?? this.catalog()?.currentSubscription ?? null,
  );

  readonly billingIntervals = computed<BillingInterval[]>(() => {
    const cat = this.catalog();
    if (cat?.billingIntervals?.length) {
      return cat.billingIntervals;
    }
    if (cat?.billingCycles?.length) {
      return cat.billingCycles.map((c) => c.id);
    }
    return ['MONTHLY', 'YEARLY'];
  });

  readonly cycleTabs = computed<TabItem[]>(() => {
    const intervals = this.billingIntervals();
    const plansList = this.plans();

    const yearlySavings = plansList.reduce((max, plan) => {
      const yrPrice = this.getPlanIntervalPrice(plan, 'YEARLY');
      return Math.max(max, yrPrice?.savingsPercentage ?? 0);
    }, 0);

    return intervals.map((interval) => {
      if (interval === 'YEARLY') {
        return {
          value: 'YEARLY',
          label: 'Yearly billing',
          count: yearlySavings > 0 ? `Save up to ${yearlySavings}%` : undefined,
        };
      }
      return {
        value: 'MONTHLY',
        label: 'Monthly billing',
      };
    });
  });

  readonly hasCurrentSubscription = computed(() =>
    Boolean(this.userSubscription() || this.plans().some((p) => p.isCurrent)),
  );

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading.set(true);
    this.error.set(false);

    this.plansService
      .getSubscriptionCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.catalog.set(data);
          const intervals = data.billingIntervals?.length
            ? data.billingIntervals
            : data.billingCycles?.map((c) => c.id);

          if (intervals?.length) {
            const hasCurrentSelected = intervals.includes(this.selectedCycle());
            if (!hasCurrentSelected) {
              this.selectedCycle.set(intervals[0]);
            }
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  onCycleChange(cycleValue: TabValue): void {
    const cycle = cycleValue as BillingInterval;
    if (cycle === 'MONTHLY' || cycle === 'YEARLY') {
      this.selectedCycle.set(cycle);
    }
  }

  getPlanIntervalPrice(plan: PlanCardDTO, interval: BillingInterval): PlanPriceDTO | null {
    if (plan.pricing) {
      const key = interval.toLowerCase() as 'monthly' | 'yearly';
      if (plan.pricing[key]) {
        return plan.pricing[key]!;
      }
    }
    if (Array.isArray(plan.prices)) {
      return plan.prices.find((p) => p.billingInterval === interval) ?? null;
    }
    if (plan.prices && typeof plan.prices === 'object') {
      return (plan.prices as Record<BillingInterval, PlanPriceDTO>)[interval] ?? null;
    }
    return null;
  }

  getPrice(plan: PlanCardDTO): PlanPriceDTO | null {
    return this.getPlanIntervalPrice(plan, this.selectedCycle());
  }

  isPriceAvailable(plan: PlanCardDTO): boolean {
    const price = this.getPrice(plan);
    if (!price) return false;
    if (
      plan.code === 'FREE' ||
      plan.type === 'FREE' ||
      price.amountMajor === 0 ||
      (price as any).amount === 0
    ) {
      return true;
    }
    return price.id !== null || (price as any).planPriceId !== null;
  }

  priceDisplay(plan: PlanCardDTO): string {
    const price = this.getPrice(plan);
    if (!price) return 'Unavailable';
    if (
      plan.code === 'FREE' ||
      plan.type === 'FREE' ||
      price.amountMajor === 0 ||
      (price as any).amount === 0
    ) {
      return 'Free';
    }
    if (price.currencySymbol && price.amountMajor !== undefined) {
      return `${price.currencySymbol}${price.amountMajor}`;
    }
    if ((price as any).amount !== undefined) {
      return `${price.currency || '₹'} ${(price as any).amount}`;
    }
    return price.formatted || 'Unavailable';
  }

  intervalDisplay(plan: PlanCardDTO): string {
    const price = this.getPrice(plan);
    if (
      !price ||
      plan.code === 'FREE' ||
      plan.type === 'FREE' ||
      price.amountMajor === 0 ||
      (price as any).amount === 0
    ) {
      return '';
    }
    return this.selectedCycle() === 'YEARLY' ? '/ year' : '/ month';
  }

  getButtonLabel(plan: PlanCardDTO): string {
    if (plan.isCurrent) return 'Current Plan';
    if (plan.code !== 'FREE') return 'Coming soon';
    if (this.processingPlanId() === plan.id) return 'Starting checkout...';
    if (plan.buttonText) return plan.buttonText;
    if (plan.code === 'FREE') return 'Get started free';
    return 'Upgrade to ' + plan.name;
  }

  isButtonDisabled(plan: PlanCardDTO): boolean {
    if (plan.code !== 'FREE') return true;
    if (this.processingPlanId() !== null) return true;
    if (plan.isCurrent) return true;
    if (plan.buttonDisabled) return true;
    return false;
  }

  getButtonVariant(plan: PlanCardDTO): 'primary' | 'secondary' | 'outline' {
    if (plan.isCurrent) return 'secondary';
    if (plan.isPopular) return 'primary';
    return 'outline';
  }

  getFeatureValue(row: ComparisonMatrixRow, plan: PlanCardDTO): ComparisonPlanValue | null {
    if (row.plans) {
      const val = row.plans[plan.code] ?? row.plans[plan.id];
      if (val) return val;
    }
    const legacyValues = row.values;
    if (legacyValues) {
      const val = legacyValues[plan.code] ?? legacyValues[plan.id];
      if (val) {
        return {
          included: val.included ?? val.isEnabled ?? false,
          formattedValue: val.formattedValue ?? val.displayValue ?? '',
          isUnlimited: val.isUnlimited ?? false,
        };
      }
    }
    return null;
  }

  formatPeriodEnd(endDateStr?: string): string {
    if (!endDateStr) return '';
    try {
      const date = new Date(endDateStr);
      if (isNaN(date.getTime())) return endDateStr;
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return endDateStr;
    }
  }

  choosePlan(plan: PlanCardDTO): void {
    this.planSelected.emit(plan);

    // If current plan, inform user
    if (plan.isCurrent) {
      this.toastService.info('You are already on the ' + plan.name + ' plan.');
      return;
    }

    const price = this.getPrice(plan);
    const isFree =
      plan.code === 'FREE' ||
      plan.type === 'FREE' ||
      (price !== null && (price.amountMajor === 0 || (price as any).amount === 0));

    const priceId = price?.id ?? price?.planPriceId ?? null;

    const isAuthenticated = this.authStore.isAuthenticated();

    // Anonymous visitor redirection
    if (!isAuthenticated) {
      if (isFree) {
        void this.router.navigate(['/auth/signup'], {
          queryParams: { plan: plan.code },
        });
      } else {
        void this.router.navigate(['/auth/signup'], {
          queryParams: {
            plan: plan.code,
            cycle: this.selectedCycle(),
          },
        });
      }
      return;
    }

    // Free plan for authenticated users
    if (isFree) {
      void this.router.navigate(['/app']);
      return;
    }

    if (!priceId) {
      this.toastService.warning(
        'This billing cycle is not available for ' +
          plan.name +
          '. Please select another plan or cycle.',
      );
      return;
    }

    // Prevent duplicate checkout request
    if (this.processingPlanId() !== null) {
      return;
    }

    // Authenticated Paid Checkout Flow
    this.processingPlanId.set(plan.id);

    this.billingService
      .subscribe(priceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (checkoutDetails) => {
          try {
            const result = await this.billingService.openCheckout({
              checkoutDetails,
              planName: plan.name,
              userEmail: this.authStore.userEmail(),
              userName: null,
            });

            if (result.status === 'SUCCESS' && result.paymentData) {
              this.handlePaymentSuccess(result.paymentData);
            } else if (result.status === 'DISMISSED') {
              this.toastService.info('Checkout was cancelled.');
              this.processingPlanId.set(null);
            } else {
              this.toastService.error(
                result.error?.description || 'Payment could not be completed. Please try again.',
              );
              this.processingPlanId.set(null);
            }
          } catch (err: any) {
            this.toastService.error(err?.message || 'Payment gateway could not be launched.');
            this.processingPlanId.set(null);
          }
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            err?.message ||
            'Could not initialize checkout. Please try again.';
          this.toastService.error(message);
          this.processingPlanId.set(null);
        },
      });
  }

  private handlePaymentSuccess(paymentData: RazorpayPaymentSuccessResponse): void {
    this.billingService
      .verifyPayment(paymentData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Payment verified! Your subscription is now active.');
          this.processingPlanId.set(null);
          this.loadPlans();
        },
        error: () => {
          this.toastService.success('Payment received! Confirming your subscription status...');
          this.processingPlanId.set(null);
          this.loadPlans();
        },
      });
  }
}
