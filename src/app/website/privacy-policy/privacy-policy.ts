import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { CompanyShell } from '../company-pages/company-shell';
import { COMPANY, COMPANY_PAGES } from '../company-pages/company-pages.data';
import { prefersReducedMotion, runInGsapContext } from '../gsap-utils';

@Component({
  standalone: true,
  selector: 'app-privacy-policy',
  imports: [RouterLink, CompanyShell],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicy {
  readonly company = COMPANY;
  readonly page = COMPANY_PAGES['privacy'];

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (typeof window === 'undefined') return;
      if (prefersReducedMotion()) return;

      runInGsapContext(
        this.element,
        () => {
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

          tl.from('.legal-hero .eyebrow', {
            opacity: 0,
            y: 12,
            duration: 0.5,
            ease: 'back.out(1.7)',
          })
            .from('.legal-hero h1', { opacity: 0, y: 30, duration: 0.7 }, '-=0.3')
            .from(
              ['.legal-hero .intro', '.legal-hero .meta'],
              { opacity: 0, y: 16, duration: 0.55, stagger: 0.1, ease: 'power2.out' },
              '-=0.35',
            );

          gsap.from('.legal-summary > div', {
            opacity: 0,
            y: 24,
            scale: 0.96,
            duration: 0.6,
            stagger: 0.1,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: '.legal-summary',
              start: 'top 85%',
              once: true,
            },
          });

          gsap.from('.legal-body section', {
            opacity: 0,
            y: 20,
            duration: 0.55,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.legal-body',
              start: 'top 85%',
              once: true,
            },
          });
        },
        this.destroyRef,
      );
    });
  }
}
