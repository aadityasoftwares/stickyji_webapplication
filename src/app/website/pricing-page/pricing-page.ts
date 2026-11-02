import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CompanyShell } from '../company-pages/company-shell';
import { Subscription } from '../subscription/subscription';
import { PlanCardDTO } from '../subscription/services/plans.service';

@Component({
  selector: 'app-pricing-page',
  imports: [CompanyShell, Subscription, RouterLink],
  templateUrl: './pricing-page.html',
  styleUrl: './pricing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingPage {
  private readonly router = inject(Router);
  choosePlan(plan: Pick<PlanCardDTO, 'code'>): void {
    void this.router.navigate(['/auth/signup'], { queryParams: { plan: plan.code } });
  }
}
