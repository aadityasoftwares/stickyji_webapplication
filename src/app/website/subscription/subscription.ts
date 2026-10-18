import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideArrowRight, LucideCheck, LucideSparkles } from '@lucide/angular';
import { Button } from '../../shared/components/button/button';
import { AppIcon } from '../../shared/components/icon/icon';
import { PlansService, PublicPlan } from './services/plans.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [Button, AppIcon],
  templateUrl: './subscription.html',
  styleUrl: './subscription.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subscription implements OnInit {
  private readonly service = inject(PlansService);
  private readonly destroyRef = inject(DestroyRef);
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly plans = signal<readonly PublicPlan[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  @Output() planSelected = new EventEmitter<PublicPlan>();

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service
      .getPublicPlans()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plans) => {
          this.plans.set(plans);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  priceLabel(plan: PublicPlan): string {
    if (plan.type === 'FREE') return 'Free';
    return plan.pricingModel === 'CUSTOM' || plan.type === 'CUSTOM'
      ? 'Custom pricing'
      : 'Paid plan';
  }

  choosePlan(plan: PublicPlan): void {
    this.planSelected.emit(plan);
  }
}
