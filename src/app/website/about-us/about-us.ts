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
  selector: 'app-about-us',
  imports: [RouterLink, CompanyShell],
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutUs {
  readonly company = COMPANY;
  readonly page = COMPANY_PAGES['about'];

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (typeof window === 'undefined') return;
      if (prefersReducedMotion()) return;

      runInGsapContext(
        this.element,
        () => {
          // 1. Hero copy timeline
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

          tl.from('.about-hero .eyebrow', {
            opacity: 0,
            y: 12,
            duration: 0.5,
            ease: 'back.out(1.7)',
          })
            .from('.about-hero h1', { opacity: 0, y: 32, duration: 0.75 }, '-=0.3')
            .from(
              '.about-hero .intro',
              { opacity: 0, y: 18, duration: 0.6, ease: 'power2.out' },
              '-=0.4',
            )
            .from(
              ['.about-hero .button-link', '.about-hero .meta'],
              {
                opacity: 0,
                y: 16,
                duration: 0.5,
                stagger: 0.1,
              },
              '-=0.3',
            );

          // 2. Right idea board and sticky notes
          const boardTl = gsap.timeline({ delay: 0.25, defaults: { ease: 'power2.out' } });

          boardTl
            .from('.idea-board', { opacity: 0, y: -20, duration: 0.7, ease: 'back.out(1.2)' })
            .from(
              '.idea-note',
              {
                opacity: 0,
                y: 35,
                scale: 0.9,
                duration: 0.65,
                stagger: 0.14,
                ease: 'back.out(1.5)',
              },
              '-=0.2',
            );

          // Subtle floating idle motion for the 3 idea notes
          gsap.to('.idea-note.yellow', {
            y: '+=5',
            rotation: '-=1',
            yoyo: true,
            repeat: -1,
            duration: 4,
            ease: 'sine.inOut',
          });

          gsap.to('.idea-note.blue', {
            y: '-=4',
            rotation: '+=0.8',
            yoyo: true,
            repeat: -1,
            duration: 3.6,
            ease: 'sine.inOut',
          });

          gsap.to('.idea-note.pink', {
            y: '+=5',
            rotation: '+=1',
            yoyo: true,
            repeat: -1,
            duration: 4.2,
            ease: 'sine.inOut',
          });

          // 3. Mission section
          gsap.from('.mission', {
            opacity: 0,
            y: 30,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.mission',
              start: 'top 85%',
              once: true,
            },
          });

          // 4. Values grid cards
          gsap.from('.values-grid article', {
            opacity: 0,
            y: 28,
            duration: 0.65,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.values-grid',
              start: 'top 85%',
              once: true,
            },
          });

          // 5. Origin section
          gsap.from('.origin', {
            opacity: 0,
            y: 28,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.origin',
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
