import { PublicPlan } from '../subscription/services/plans.service';
import { Router } from '@angular/router';
import { Component, inject } from '@angular/core';
import { Hero } from '../hero/hero';
import { WebsiteHeader } from '../website-header/website-header';
import { ThoughtFlow } from '../thought-flow/thought-flow';
import { UseCases } from '../use-cases/use-cases';
import { Reviews } from '../reviews/reviews';
import { Subscription } from '../subscription/subscription';
import { WebsiteFooter } from '../website-footer/website-footer';

@Component({
  imports: [Hero, WebsiteHeader, ThoughtFlow, UseCases, Reviews, Subscription, WebsiteFooter],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  private readonly router = inject(Router);
  choosePlan(plan: PublicPlan): void {
    void this.router.navigate(['/auth/signup'], { queryParams: { plan: plan.code } });
  }

  navigateToAuth(page: 'login' | 'signup'): void {
    void this.router.navigate(['/auth', page]);
  }
}
