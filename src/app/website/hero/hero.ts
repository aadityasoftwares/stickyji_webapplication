import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCheck, LucideSparkles, LucideStar, LucideUsersRound } from '@lucide/angular';
import { gsap } from 'gsap';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { AppIcon } from '../../shared/components/icon/icon';
import { animateHandwrittenSvg, prefersReducedMotion, runInGsapContext } from '../gsap-utils';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [AppIcon, RouterLink, Button, Badge],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  @Output() readonly startFree = new EventEmitter<void>();
  @Output() readonly watchDemo = new EventEmitter<void>();

  readonly LucideCheck = LucideCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideStar = LucideStar;
  readonly LucideUsersRound = LucideUsersRound;

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

          // 1. Hero Eyebrow
          tl.from('.hero-eyebrow', {
            opacity: 0,
            scale: 0.85,
            y: 12,
            duration: 0.5,
            ease: 'back.out(1.7)',
          })
            // 2. Hero Title & Subtitle lines
            .from(
              '.hero-title',
              {
                opacity: 0,
                y: 36,
                duration: 0.75,
              },
              '-=0.3',
            )
            // 3. Hero description
            .from(
              '.hero-description',
              {
                opacity: 0,
                y: 20,
                duration: 0.6,
                ease: 'power2.out',
              },
              '-=0.4',
            )
            // 4. Hero actions & proof items
            .from(
              ['.hero-actions', '.hero-assurance', '.hero-use-cases'],
              {
                opacity: 0,
                y: 22,
                duration: 0.55,
                stagger: 0.1,
                ease: 'power2.out',
              },
              '-=0.4',
            );

          // Animate title underline path drawing
          const underline = this.element.querySelector(
            '.title-underline path',
          ) as SVGPathElement | null;
          if (underline) {
            animateHandwrittenSvg(underline, {
              duration: 1.1,
              delay: 0.65,
              ease: 'power2.out',
            });
          }

          // 5. Right column Weekly Plan Board
          const planTl = gsap.timeline({ delay: 0.35, defaults: { ease: 'power2.out' } });

          planTl
            .from('.hero-plan', {
              opacity: 0,
              y: -24,
              duration: 0.75,
              ease: 'back.out(1.2)',
            })
            .from(
              '.hero-plan-tape',
              {
                opacity: 0,
                scaleX: 0.4,
                duration: 0.4,
                ease: 'power2.out',
              },
              '-=0.4',
            )
            // Notes pop in like physical notes
            .from(
              ['.hero-plan-note-yellow', '.hero-plan-note-blue', '.hero-plan-note-green'],
              {
                opacity: 0,
                y: 35,
                scale: 0.9,
                duration: 0.65,
                stagger: 0.14,
                ease: 'back.out(1.5)',
              },
              '-=0.2',
            )
            // Progress bar in green note expands
            .from(
              '.hero-plan-progress i',
              {
                scaleX: 0,
                transformOrigin: 'left center',
                duration: 0.8,
                ease: 'power2.out',
              },
              '-=0.3',
            )
            // Tasks checkmark pulse
            .from(
              '.hero-plan-task.is-done i',
              {
                scale: 0,
                duration: 0.4,
                ease: 'back.out(2)',
              },
              '-=0.5',
            );

          // 6. Ambient subtle floating idle motion for the sticky notes
          gsap.to('.hero-plan-note-yellow', {
            y: '+=6',
            rotation: '-=1.2',
            yoyo: true,
            repeat: -1,
            duration: 4.2,
            ease: 'sine.inOut',
          });

          gsap.to('.hero-plan-note-blue', {
            y: '-=5',
            rotation: '+=1',
            yoyo: true,
            repeat: -1,
            duration: 3.8,
            ease: 'sine.inOut',
          });

          gsap.to('.hero-plan-note-green', {
            y: '+=5',
            rotation: '+=0.8',
            yoyo: true,
            repeat: -1,
            duration: 4.5,
            ease: 'sine.inOut',
          });

          // Rainbow doodle subtle float
          gsap.to('.hero-rainbow', {
            y: '+=8',
            yoyo: true,
            repeat: -1,
            duration: 5,
            ease: 'sine.inOut',
          });
        },
        this.destroyRef,
      );
    });
  }

  onCreateAccountAction(): void {
    this.startFree.emit();
  }
}
