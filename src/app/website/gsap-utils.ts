import { DestroyRef } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Register plugins safely in browser environment.
 */
let pluginsRegistered = false;
export function registerGsapPlugins(): void {
  if (typeof window === 'undefined') return;
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    pluginsRegistered = true;
  }
}

/**
 * Checks whether user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Runs GSAP animations inside a scoped context with automatic cleanup on DestroyRef.
 */
export function runInGsapContext(
  scope: Element | HTMLElement,
  initFn: (ctx: gsap.Context) => void,
  destroyRef?: DestroyRef,
): gsap.Context | undefined {
  if (typeof window === 'undefined') return undefined;
  registerGsapPlugins();

  const ctx = gsap.context(initFn, scope);

  if (destroyRef) {
    destroyRef.onDestroy(() => {
      ctx.revert();
    });
  }

  return ctx;
}

/**
 * Animate a handwritten SVG path stroke (draws the path dynamically).
 */
export function animateHandwrittenSvg(
  pathElement: SVGPathElement | SVGElement | null | undefined,
  options?: {
    duration?: number;
    delay?: number;
    ease?: string;
    scrollTrigger?: gsap.DOMTarget | ScrollTrigger.Vars;
  },
): gsap.core.Tween | undefined {
  if (typeof window === 'undefined' || !pathElement) return undefined;
  if (prefersReducedMotion()) return undefined;

  try {
    const svgPath = pathElement as SVGPathElement;
    const length = typeof svgPath.getTotalLength === 'function' ? svgPath.getTotalLength() : 300;

    gsap.set(svgPath, {
      strokeDasharray: length,
      strokeDashoffset: length,
      opacity: 1,
    });

    const vars: gsap.TweenVars = {
      strokeDashoffset: 0,
      duration: options?.duration ?? 1.1,
      delay: options?.delay ?? 0.2,
      ease: options?.ease ?? 'power2.out',
    };

    if (options?.scrollTrigger) {
      vars.scrollTrigger =
        typeof options.scrollTrigger === 'object' && 'trigger' in options.scrollTrigger
          ? options.scrollTrigger
          : {
              trigger: options.scrollTrigger as gsap.DOMTarget,
              start: 'top 85%',
              once: true,
            };
    }

    return gsap.to(svgPath, vars);
  } catch {
    return undefined;
  }
}

/**
 * Tactile note-entrance animation mimicking real sticky notes being placed on a board.
 */
export function animateStickyNotesEntrance(
  elements: Element[] | NodeListOf<Element> | string,
  options?: {
    scope?: Element | HTMLElement;
    stagger?: number;
    duration?: number;
    delay?: number;
    rotationVariation?: number;
    scrollTrigger?: gsap.DOMTarget | ScrollTrigger.Vars;
  },
): gsap.core.Tween | undefined {
  if (typeof window === 'undefined') return undefined;
  if (prefersReducedMotion()) {
    gsap.set(elements, { opacity: 1, y: 0, scale: 1 });
    return undefined;
  }

  const rotVar = options?.rotationVariation ?? 3;

  const vars: gsap.TweenVars = {
    opacity: 1,
    y: 0,
    scale: 1,
    rotation: (index: number) => {
      const angles = [-rotVar, rotVar * 0.8, -rotVar * 0.6, rotVar * 1.1, -rotVar * 0.9];
      return angles[index % angles.length];
    },
    duration: options?.duration ?? 0.7,
    delay: options?.delay ?? 0,
    stagger: options?.stagger ?? 0.12,
    ease: 'back.out(1.5)',
  };

  if (options?.scrollTrigger) {
    vars.scrollTrigger =
      typeof options.scrollTrigger === 'object' && 'trigger' in options.scrollTrigger
        ? options.scrollTrigger
        : {
            trigger: options.scrollTrigger as gsap.DOMTarget,
            start: 'top 85%',
            once: true,
          };
  }

  // Initial state
  gsap.set(elements, {
    opacity: 0,
    y: 35,
    scale: 0.92,
    transformOrigin: 'top center',
  });

  return gsap.to(elements, vars);
}

