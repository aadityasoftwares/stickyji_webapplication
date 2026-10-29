import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core';

/** Animate once on entry; content stays readable without browser animation support. */
@Directive({ selector: '[appScrollReveal]' })
export class ScrollReveal {
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const viewport = this.element.ownerDocument.defaultView;
      if (!viewport || typeof IntersectionObserver === 'undefined' || !this.element.animate) return;
      const motion = viewport.matchMedia('(prefers-reduced-motion: reduce)');
      if (motion.matches) return;

      let animation: Animation | undefined;
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          if (!motion.matches) {
            animation = this.element.animate(
              [
                { opacity: 0, transform: 'translateY(24px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              { duration: 600, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
            );
          }
          observer.disconnect();
        },
        { threshold: 0, rootMargin: '0px 0px -48px 0px' },
      );
      const stopMotion = () => {
        if (motion.matches) {
          animation?.cancel();
          observer.disconnect();
        }
      };
      observer.observe(this.element);
      motion.addEventListener('change', stopMotion);
      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        animation?.cancel();
        motion.removeEventListener('change', stopMotion);
      });
    });
  }
}
