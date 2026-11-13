import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { prefersReducedMotion, runInGsapContext } from '../gsap-utils';

@Component({
  selector: 'app-website-not-found',
  imports: [RouterLink],
  template: `<main>
    <span class="nf-code">404</span>
    <h1 class="nf-title">This page isn't here.</h1>
    <p class="nf-desc">Let's get you back to your ideas.</p>
    <a class="nf-btn" routerLink="/">Back to Sticky Ji</a>
  </main>`,
  styles: [
    `
      main {
        max-width: 680px;
        margin: 15vh auto;
        padding: 32px;
        text-align: center;
      }
      span,
      a {
        color: #4e6240;
      }
      .nf-code {
        display: inline-block;
        font-size: 72px;
        font-weight: 700;
        line-height: 1;
        margin-bottom: 8px;
      }
      h1 {
        margin: 20px 0;
      }
      p {
        margin-bottom: 24px;
      }
      a {
        display: inline-block;
        padding: 14px 20px;
        border: 1px solid currentColor;
        border-radius: 10px;
        text-decoration: none;
        transition:
          transform 0.2s ease,
          background-color 0.2s ease;
      }
      a:hover {
        transform: translateY(-2px);
      }
    `,
  ],
})
export class WebsiteNotFound {
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

          tl.from('.nf-code', {
            opacity: 0,
            scale: 0.7,
            y: -20,
            duration: 0.65,
            ease: 'back.out(1.8)',
          })
            .from('.nf-title', { opacity: 0, y: 24, duration: 0.6 }, '-=0.25')
            .from('.nf-desc', { opacity: 0, y: 16, duration: 0.5, ease: 'power2.out' }, '-=0.3')
            .from(
              '.nf-btn',
              {
                opacity: 0,
                scale: 0.9,
                y: 14,
                duration: 0.5,
                ease: 'back.out(1.5)',
              },
              '-=0.25',
            );
        },
        this.destroyRef,
      );
    });
  }
}
