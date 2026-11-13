import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { CompanyShell } from '../company-pages/company-shell';
import { prefersReducedMotion, runInGsapContext } from '../gsap-utils';

@Component({
  selector: 'app-reviews-page',
  imports: [CompanyShell, RouterLink],
  template: `<app-company-shell>
    <div class="reviews-page-content">
      <h1>Share your Sticky Ji feedback</h1>
      <p>Tell us what helps you organize your day and what could work better.</p>
      <p>
        <a routerLink="/contact-us">Contact the Sticky Ji team</a> with feedback. Please leave out
        private notes and account credentials.
      </p>
      <p>
        Explore <a routerLink="/use-cases">workflow examples</a> or
        <a routerLink="/features">product features</a>.
      </p>
    </div>
  </app-company-shell>`,
})
export class ReviewsPage {
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (typeof window === 'undefined') return;
      if (prefersReducedMotion()) return;

      runInGsapContext(
        this.element,
        () => {
          gsap.from('.reviews-page-content > *', {
            opacity: 0,
            y: 20,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
          });
        },
        this.destroyRef,
      );
    });
  }
}
