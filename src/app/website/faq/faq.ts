import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideChevronDown,
  LucideCircleHelp,
  LucideCreditCard,
  LucideMonitor,
  LucideRocket,
} from '@lucide/angular';
import { gsap } from 'gsap';
import { AppIcon, AppIconDefinition } from '../../shared/components/icon/icon';
import { animateHandwrittenSvg, prefersReducedMotion, runInGsapContext } from '../gsap-utils';

type FaqTheme = 'yellow' | 'blue' | 'green' | 'pink';

interface FaqAction {
  label: string;
  link: string;
  primary?: boolean;
}

interface FaqItem {
  pill: string;
  icon: AppIconDefinition;
  theme: FaqTheme;
  question: string;
  answer: string;
  actions?: readonly FaqAction[];
}

@Component({
  standalone: true,
  imports: [RouterLink, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-faq',
  styleUrl: './faq.scss',
  templateUrl: './faq.html',
})
export class Faq {
  readonly LucideChevronDown = LucideChevronDown;

  readonly items: readonly FaqItem[] = [
    {
      pill: 'Product basics',
      icon: LucideCircleHelp,
      theme: 'yellow',
      question: 'What is Sticky Ji?',
      answer:
        'Sticky Ji is a browser-based notes app by Aaditya Softwares. Capture ideas, add checklists, and organize daily tasks in workspaces and folders.',
    },
    {
      pill: 'Desktop & web',
      icon: LucideMonitor,
      theme: 'blue',
      question: 'Can I use it on a desktop computer?',
      answer:
        'Yes. Open Sticky Ji in your web browser. It is a web app, so you do not need to install a native desktop application.',
    },
    {
      pill: 'Quick setup',
      icon: LucideRocket,
      theme: 'green',
      question: 'How do I get started?',
      answer:
        'Create an account, choose a workspace, and add your first note. Use a checklist for the next steps and columns to track progress.',
      actions: [
        { label: 'Create an account', link: '/auth/signup', primary: true },
        { label: 'Explore workflow', link: '/how-it-works' },
      ],
    },
    {
      pill: 'Plans & pricing',
      icon: LucideCreditCard,
      theme: 'pink',
      question: 'Which plan should I choose?',
      answer:
        'Check the current plans and usage limits before signing up. Available plans and billing options come from the live catalogue.',
      actions: [
        { label: 'View plans', link: '/pricing', primary: true },
        { label: 'Features', link: '/features' },
        { label: 'Use cases', link: '/use-cases' },
        { label: 'Contact', link: '/contact-us' },
      ],
    },
  ];

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (typeof window === 'undefined') return;
      if (prefersReducedMotion()) return;

      runInGsapContext(
        this.element,
        () => {
          // Spark underline/accent SVG
          const spark = this.element.querySelector('.title-note svg path') as SVGPathElement | null;
          if (spark) {
            animateHandwrittenSvg(spark, {
              duration: 1.1,
              delay: 0.2,
              scrollTrigger: {
                trigger: this.element,
                start: 'top 80%',
                once: true,
              },
            });
          }

          // Gentle floating doodles
          gsap.to('.faq-doodle-left', {
            y: '+=8',
            rotation: '+=3',
            yoyo: true,
            repeat: -1,
            duration: 4.5,
            ease: 'sine.inOut',
          });

          gsap.to('.faq-doodle-right', {
            y: '-=8',
            rotation: '-=4',
            yoyo: true,
            repeat: -1,
            duration: 5,
            ease: 'sine.inOut',
          });

          // FAQ sticky note cards entrance
          gsap.from('.faq-note', {
            opacity: 0,
            y: 35,
            scale: 0.95,
            rotation: (i: number) => (i % 2 === 0 ? -1.8 : 1.8),
            duration: 0.65,
            stagger: 0.12,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: '.faq-list',
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
