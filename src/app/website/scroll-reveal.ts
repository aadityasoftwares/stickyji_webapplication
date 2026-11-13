import { afterNextRender, DestroyRef, Directive, ElementRef, inject, Input } from '@angular/core';
import { gsap } from 'gsap';
import {
  animateHandwrittenSvg,
  prefersReducedMotion,
  registerGsapPlugins,
  runInGsapContext,
} from './gsap-utils';

export type ScrollRevealVariant = 'fade-up' | 'cards' | 'notes' | 'hero' | 'stagger' | '';

/**
 * GSAP ScrollTrigger powered scroll reveal directive.
 * Animates sections, child cards, sticky notes, and handwritten SVGs when they enter viewport.
 */
@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollReveal {
  @Input('appScrollReveal') variant: ScrollRevealVariant = 'fade-up';
  @Input() staggerSelector?: string;
  @Input() delay = 0;
  @Input() duration = 0.7;

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (typeof window === 'undefined') return;
      registerGsapPlugins();

      if (prefersReducedMotion()) {
        gsap.set(this.element, { opacity: 1, y: 0, clearProps: 'all' });
        return;
      }

      runInGsapContext(
        this.element,
        (ctx) => {
          // 1. Check for handwritten SVGs in this section
          const svgPaths = this.element.querySelectorAll(
            '.handdrawn-stroke path, .handdrawn-curve path, .title-underline path, .underlined-word svg path, .heading-highlight svg path, .heading-accent svg path, .title-note svg path, .calmer-sparks path, .faq-doodle path',
          );
          svgPaths.forEach((path: Element) => {
            animateHandwrittenSvg(path as SVGPathElement, {
              duration: 1.2,
              delay: 0.3,
              scrollTrigger: {
                trigger: path.closest('section, header, div') || this.element,
                start: 'top 85%',
                once: true,
              },
            });
          });

          // 2. Select target elements for staggered or note-based animation
          const targetSelector =
            this.staggerSelector ||
            (this.variant === 'notes'
              ? '.paper-note, .idea-note, .faq-note, .hero-plan-note, .note-card, .review-index-card'
              : this.variant === 'cards' || this.variant === 'stagger'
                ? '.plan-card, .feature-card, .journey-step, .template-card, .topic-card, .guidance-card, .blog-card, .value-card, article'
                : null);

          if (targetSelector) {
            const items = this.element.querySelectorAll(targetSelector);
            if (items.length > 0) {
              // Animate section header first if present
              const header = this.element.querySelector(
                'header, .section-heading, .faq-heading, .subscription-heading, .reviews-heading, .journey-header',
              );
              if (header) {
                gsap.from(header, {
                  opacity: 0,
                  y: 24,
                  duration: this.duration,
                  delay: this.delay,
                  ease: 'power2.out',
                  scrollTrigger: {
                    trigger: this.element,
                    start: 'top 88%',
                    once: true,
                  },
                });
              }

              // Animate child cards/notes with stagger
              const isNoteVariant = this.variant === 'notes' || targetSelector.includes('note');
              gsap.from(items, {
                opacity: 0,
                y: isNoteVariant ? 35 : 28,
                scale: isNoteVariant ? 0.94 : 0.98,
                rotation: isNoteVariant ? (i: number) => (i % 2 === 0 ? -2.5 : 2.5) : 0,
                duration: this.duration,
                stagger: 0.1,
                delay: this.delay + 0.15,
                ease: isNoteVariant ? 'back.out(1.4)' : 'power2.out',
                clearProps: 'transform,opacity',
                scrollTrigger: {
                  trigger: items[0],
                  start: 'top 88%',
                  once: true,
                },
              });
              return;
            }
          }

          // 3. Default smooth reveal of the container/children
          const mainHeading = this.element.querySelector('h1, h2, .hero-title, .heading-copy');
          const secondaryContent = this.element.querySelectorAll(
            'p, .hero-subtitle, .hero-actions, .flow-layout, .review-wall, .pricing-guidance-grid, .topic-grid, .values-grid',
          );

          if (mainHeading && secondaryContent.length > 0) {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: this.element,
                start: 'top 85%',
                once: true,
              },
            });

            tl.from(mainHeading, {
              opacity: 0,
              y: 30,
              duration: this.duration,
              delay: this.delay,
              ease: 'power3.out',
            }).from(
              secondaryContent,
              {
                opacity: 0,
                y: 20,
                duration: 0.6,
                stagger: 0.08,
                ease: 'power2.out',
                clearProps: 'transform,opacity',
              },
              '-=0.4',
            );
          } else {
            // General section fade-in
            gsap.from(this.element, {
              opacity: 0,
              y: 28,
              duration: this.duration,
              delay: this.delay,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
              scrollTrigger: {
                trigger: this.element,
                start: 'top 88%',
                once: true,
              },
            });
          }
        },
        this.destroyRef,
      );
    });
  }
}
