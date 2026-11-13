import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { animateHandwrittenSvg, prefersReducedMotion, runInGsapContext } from '../gsap-utils';
import {
  LucideArrowRight,
  LucideCheck,
  LucideSparkles,
  LucidePin,
  LucideLightbulb,
  LucidePalette,
  LucideColumns3,
  LucideCalendarCheck2,
  LucideTrophy,
  LucideClock3,
  LucideSmile,
  LucideMousePointer,
  LucideZap,
  LucidePlus,
  LucideTrash2,
} from '@lucide/angular';
import { WebsiteHeader } from '../website-header/website-header';
import { WebsiteFooter } from '../website-footer/website-footer';
import { AppIcon } from '../../shared/components/icon/icon';

export type StepId = 'capture' | 'color' | 'columns' | 'today' | 'celebrate';
export type SandboxColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple';

export interface SandboxNote {
  id: string;
  title: string;
  body: string;
  color: SandboxColor;
  angle: number;
  author: string;
  isCustom?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-how-it-works-page',
  imports: [RouterLink, WebsiteHeader, WebsiteFooter, AppIcon],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorksPage {
  private readonly router = inject(Router);

  // Lucide Icons
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly LucidePin = LucidePin;
  readonly LucideLightbulb = LucideLightbulb;
  readonly LucidePalette = LucidePalette;
  readonly LucideColumns3 = LucideColumns3;
  readonly LucideCalendarCheck2 = LucideCalendarCheck2;
  readonly LucideTrophy = LucideTrophy;
  readonly LucideClock3 = LucideClock3;
  readonly LucideSmile = LucideSmile;
  readonly LucideMousePointer = LucideMousePointer;
  readonly LucideZap = LucideZap;
  readonly LucidePlus = LucidePlus;
  readonly LucideTrash2 = LucideTrash2;

  // Selected Step tab in workflow journey
  readonly activeStep = signal<StepId>('capture');

  // Sandbox Creator State
  readonly sandboxNotes = signal<SandboxNote[]>([
    {
      id: 'demo-1',
      title: 'Morning Brain Dump',
      body: 'Get ideas out of your head within seconds before they slip away.',
      color: 'yellow',
      angle: -2.5,
      author: 'Step 01',
    },
    {
      id: 'demo-2',
      title: 'Pink for Urgent ⚠️',
      body: 'Client prototype review due at 3:00 PM. High contrast visual flag.',
      color: 'pink',
      angle: 1.8,
      author: 'Step 02',
    },
    {
      id: 'demo-3',
      title: 'Move to Today View',
      body: 'Drag this note to the Today column to protect focus.',
      color: 'blue',
      angle: -1.2,
      author: 'Step 04',
    },
  ]);

  readonly newNoteTitle = signal<string>('My new idea');
  readonly newNoteBody = signal<string>('A quick note that will turn into real progress.');
  readonly newNoteColor = signal<SandboxColor>('green');

  readonly steps = [
    {
      id: 'capture' as StepId,
      number: '01',
      eyebrow: 'STEP 01 · NO FRICTION',
      title: 'Capture at the speed of thought',
      tagline: 'Give each idea a place before moving to the next task.',
      desc: 'Choose a workspace and folder, open a new note, and write a title and description. Add a checklist when an idea needs several steps.',
      bullets: [
        'Create notes within your chosen workspace and folder',
        'Save your note to keep it in your workspace',
        'Markdown formatting support for bullet points, bold text, and checklists',
      ],
      icon: LucideLightbulb,
      color: 'yellow' as SandboxColor,
    },
    {
      id: 'color' as StepId,
      number: '02',
      eyebrow: 'STEP 02 · VISUAL PSYCHOLOGY',
      title: 'Group & color-code by energy',
      tagline: 'Use consistent colors to recognize related notes.',
      desc: 'Use our 6 curated pastel hues to categorize your board without reading a single label. Yellow for quick everyday actions, Pink for time-sensitive priorities, Blue for reference and research, Green for financial goals, and Purple for creative brainstorms.',
      bullets: [
        'Pastel note colors for organizing different topics',
        'Choose colors when creating or editing notes',
        'Visual priority ribbons and dog-eared status indicators',
      ],
      icon: LucidePalette,
      color: 'pink' as SandboxColor,
    },
    {
      id: 'columns' as StepId,
      number: '03',
      eyebrow: 'STEP 03 · KINETIC FLOW',
      title: 'Structure into natural Kanban columns',
      tagline: 'Static lists go to die. Moving boards keep momentum alive.',
      desc: 'Organize notes across columns that fit your personal way of working. Move notes from Idea → To Do → In Progress → Review → Done with smooth, satisfying drag-and-drop feedback that feels like moving cards across a real pinboard.',
      bullets: [
        'Custom column names and color accents for any project',
        'Move notes between columns as work progresses',
        'Multi-board switching for work, university, side hustles, and life',
      ],
      icon: LucideColumns3,
      color: 'blue' as SandboxColor,
    },
    {
      id: 'today' as StepId,
      number: '04',
      eyebrow: 'STEP 04 · PROTECT YOUR HEADSPACE',
      title: 'Isolate what matters in the "Today" Sanctuary',
      tagline: 'Staring at 100 tasks causes paralysis. Staring at 3 creates focus.',
      desc: 'Open Today to review daily tasks and due dates. Choose a manageable set of priorities, then update notes and checklists as you work.',
      bullets: [
        'Dedicated Today view completely isolated from overwhelming backlogs',
        'Gentle overdue reminders that nudge without blaring red panic alarms',
        'Review your priorities and due dates each morning',
      ],
      icon: LucideCalendarCheck2,
      color: 'green' as SandboxColor,
    },
    {
      id: 'celebrate' as StepId,
      number: '05',
      eyebrow: 'STEP 05 · MINDFUL COMPLETION',
      title: 'Peel, celebrate, and archive cleanly',
      tagline: 'Ending the day with a clean desk feels genuinely good.',
      desc: 'Mark finished notes complete and review the completed section of your workspace. Update unfinished work so the next step is clear when you return.',
      bullets: [
        'Pleasing check animations with strike-through progress bars',
        'Completed notes keep finished work separate from active tasks',
        'Create a summary note if you want to record what you learned',
      ],
      icon: LucideTrophy,
      color: 'purple' as SandboxColor,
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
          // 1. Hero timeline
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

          tl.from('.hero-eyebrow', { opacity: 0, y: 12, duration: 0.5, ease: 'back.out(1.7)' })
            .from('.how-heading', { opacity: 0, y: 35, duration: 0.75 }, '-=0.3')
            .from('.how-intro', { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' }, '-=0.4')
            .from('.how-hero-actions', { opacity: 0, y: 18, duration: 0.5 }, '-=0.3');

          // Handwritten curve SVG draw
          const curve = this.element.querySelector(
            '.handdrawn-curve path',
          ) as SVGPathElement | null;
          if (curve) {
            animateHandwrittenSvg(curve, {
              duration: 1.1,
              delay: 0.6,
              ease: 'power2.out',
            });
          }

          // 2. Journey steps
          gsap.from('.journey-step-btn', {
            opacity: 0,
            y: 20,
            duration: 0.55,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.journey-steps-nav',
              start: 'top 85%',
              once: true,
            },
          });

          // 3. Step visual card
          gsap.from('.step-visual-card', {
            opacity: 0,
            scale: 0.94,
            y: 30,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.step-visual-card',
              start: 'top 85%',
              once: true,
            },
          });

          // 4. Sandbox notes entrance
          gsap.from('.board-sticky-note', {
            opacity: 0,
            scale: 0.88,
            y: 35,
            duration: 0.65,
            stagger: 0.12,
            ease: 'back.out(1.5)',
            scrollTrigger: {
              trigger: '.sandbox-shell',
              start: 'top 85%',
              once: true,
            },
          });

          // 5. Mechanics cards
          gsap.from('.mechanics-card', {
            opacity: 0,
            y: 25,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.mechanics-grid',
              start: 'top 88%',
              once: true,
            },
          });
        },
        this.destroyRef,
      );
    });
  }

  selectStep(stepId: StepId): void {
    this.activeStep.set(stepId);

    if (typeof window !== 'undefined' && !prefersReducedMotion()) {
      setTimeout(() => {
        const visualCard = this.element.querySelector('.step-visual-card');
        if (visualCard) {
          gsap.fromTo(
            visualCard,
            { opacity: 0, scale: 0.96, y: 15 },
            { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.4)' },
          );
        }
      }, 0);
    }
  }

  get currentStepData() {
    return this.steps.find((s) => s.id === this.activeStep()) ?? this.steps[0];
  }

  setSandboxColor(color: SandboxColor): void {
    this.newNoteColor.set(color);
  }

  addSandboxNote(): void {
    const title = this.newNoteTitle().trim() || 'Untitled Note';
    const body = this.newNoteBody().trim() || 'Thoughts in motion...';
    const angle = Math.random() * 6 - 3;

    const newNote: SandboxNote = {
      id: 'custom-' + Date.now(),
      title,
      body,
      color: this.newNoteColor(),
      angle,
      author: 'You',
      isCustom: true,
    };

    this.sandboxNotes.update((notes) => [newNote, ...notes.slice(0, 5)]);
    this.newNoteTitle.set('Another idea...');
    this.newNoteBody.set('Give it a home on your board.');
  }

  deleteSandboxNote(id: string): void {
    this.sandboxNotes.update((notes) => notes.filter((n) => n.id !== id));
  }

  navigateToAuth(page: 'login' | 'signup'): void {
    void this.router.navigate(['/auth', page]);
  }
}
