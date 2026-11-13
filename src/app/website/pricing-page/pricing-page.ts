import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { CompanyShell } from '../company-pages/company-shell';
import { PlanCardDTO } from '../subscription/services/plans.service';
import { Subscription } from '../subscription/subscription';
import { prefersReducedMotion, runInGsapContext } from '../gsap-utils';

@Component({
  selector: 'app-pricing-page',
  imports: [CompanyShell, Subscription, RouterLink],
  templateUrl: './pricing-page.html',
  styleUrl: './pricing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingPage {
  private readonly router = inject(Router);
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (typeof window === 'undefined') return;
      if (prefersReducedMotion()) return;

      runInGsapContext(
        this.element,
        () => {
          // Hero
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

          tl.from('.pricing-hero .section-eyebrow', {
            opacity: 0,
            y: 12,
            duration: 0.5,
            ease: 'back.out(1.7)',
          })
            .from('.pricing-hero h1', { opacity: 0, y: 32, duration: 0.75 }, '-=0.3')
            .from(
              ['.pricing-lead', '.pricing-note'],
              { opacity: 0, y: 18, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
              '-=0.4',
            );

          // Guidance cards
          gsap.from('.guidance-card', {
            opacity: 0,
            y: 30,
            scale: 0.95,
            duration: 0.65,
            stagger: 0.12,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: '.pricing-guidance-grid',
              start: 'top 85%',
              once: true,
            },
          });
        },
        this.destroyRef,
      );
    });
  }

  choosePlan(plan: Pick<PlanCardDTO, 'code'>): void {
    void this.router.navigate(['/auth/signup'], { queryParams: { plan: plan.code } });
  }
}
