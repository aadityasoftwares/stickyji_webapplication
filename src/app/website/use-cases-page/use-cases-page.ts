import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideCheck,
  LucideSparkles,
  LucidePin,
  LucideGraduationCap,
  LucideBriefcase,
  LucidePalette,
  LucideUsers,
  LucideHeart,
  LucideCalendar,
  LucideClock3,
  LucideCopy,
  LucideDownload,
  LucideBookOpen,
  LucideLayout,
  LucideSmile,
} from '@lucide/angular';
import { WebsiteHeader } from '../website-header/website-header';
import { WebsiteFooter } from '../website-footer/website-footer';
import { AppIcon } from '../../shared/components/icon/icon';
import { Avatar } from '../../shared/components/avatar/avatar';

export type PersonaId = 'students' | 'product' | 'creators' | 'teams' | 'life';

export interface PersonaBoardColumn {
  name: string;
  notes: Array<{
    title: string;
    details: string;
    color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';
    tag: string;
    pinned?: boolean;
  }>;
}

export interface PersonaProfile {
  id: PersonaId;
  label: string;
  badge: string;
  badgeColor: 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';
  icon: any;
  headline: string;
  tagline: string;
  story: string;
  painPoints: string[];
  breakthroughs: string[];
  boardColumns: PersonaBoardColumn[];
  testimonial: {
    quote: string;
    author: string;
    role: string;
    avatarInitials: string;
    avatarTone: 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';
    noteColor: 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';
  };
}

export interface BoardTemplate {
  title: string;
  category: string;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple';
  description: string;
  columnsCount: number;
  sampleItems: string[];
}

@Component({
  standalone: true,
  selector: 'app-use-cases-page',
  imports: [
    RouterLink,
    WebsiteHeader,
    WebsiteFooter,
    AppIcon,
    Avatar,
  ],
  templateUrl: './use-cases-page.html',
  styleUrl: './use-cases-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UseCasesPage {
  private readonly router = inject(Router);

  // Lucide Icons
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly LucidePin = LucidePin;
  readonly LucideGraduationCap = LucideGraduationCap;
  readonly LucideBriefcase = LucideBriefcase;
  readonly LucidePalette = LucidePalette;
  readonly LucideUsers = LucideUsers;
  readonly LucideHeart = LucideHeart;
  readonly LucideCalendar = LucideCalendar;
  readonly LucideClock3 = LucideClock3;
  readonly LucideCopy = LucideCopy;
  readonly LucideDownload = LucideDownload;
  readonly LucideBookOpen = LucideBookOpen;
  readonly LucideLayout = LucideLayout;
  readonly LucideSmile = LucideSmile;

  // Active persona selector
  readonly activePersona = signal<PersonaId>('students');

  readonly personas: PersonaProfile[] = [
    {
      id: 'students',
      label: 'Students & Academics',
      badge: 'LEARNING & EXAMS',
      badgeColor: 'yellow',
      icon: LucideGraduationCap,
      headline: 'Ace exams and research without the burnout',
      tagline: 'Replace scattered notebooks with clean, color-coded visual semester boards.',
      story:
        'Between five classes, research deadlines, and everyday life, students get overwhelmed by linear checklists. Sticky Ji lets you lay out every course syllabus, track assignment deadlines, and drag today’s readings into your quiet "Today" focus board.',
      painPoints: [
        'Important homework buried in 10 different syllabi and LMS tabs',
        'Cramming anxiety caused by lack of visual timeline clarity',
        'Disorganized reading notes scattered across loose paper and docs',
      ],
      breakthroughs: [
        'Color code each subject: Psychology in Yellow, History in Pink, Econ in Blue',
        'Drag 3 study goals into Today each morning to eliminate cramming panic',
        'Nested checklists inside sticky notes track thesis chapter progress',
      ],
      boardColumns: [
        {
          name: 'Semester Backlog',
          notes: [
            { title: 'Macroeconomics Midterm', details: 'Chapters 4–7 review', color: 'blue', tag: 'Exam Nov 12' },
            { title: 'Literature Essay Draft', details: 'Comparative analysis (1,500 words)', color: 'purple', tag: 'Drafting' },
          ],
        },
        {
          name: 'This Week Priority',
          notes: [
            { title: 'Cognitive Science Lab', details: 'Clean survey data and export CSV', color: 'yellow', tag: 'Due Thursday', pinned: true },
          ],
        },
        {
          name: 'Today Focus',
          notes: [
            { title: 'Read Chapter 5 Summary', details: '30 mins active recall notes', color: 'green', tag: 'High Impact' },
          ],
        },
      ],
      testimonial: {
        quote: 'Sticky Ji saved my final year. I stopped waking up panicking about what I forgot.',
        author: 'Nina Kapoor',
        role: 'Design & Cognitive Science Student',
        avatarInitials: 'NK',
        avatarTone: 'yellow',
        noteColor: 'yellow',
      },
    },
    {
      id: 'product',
      label: 'PMs & Developers',
      badge: 'TECH & SPRINTS',
      badgeColor: 'blue',
      icon: LucideBriefcase,
      headline: 'Prioritize real value—not bloated ticket machinery',
      tagline: 'A visual kanban board that gets straight to the point.',
      story:
        'Product builders spend half their day updating ticket statuses and attending status meetings. Sticky Ji gives tech leads and PMs a fast, visual space to triage bugs, draft sprint priorities, and align their core squad without administrative sludge.',
      painPoints: [
        'Heavy enterprise PM tools take 45 seconds just to load a single card',
        'Endless status update meetings just to check who is doing what',
        'Backlog bloat where 400 tickets sit forgotten for two years',
      ],
      breakthroughs: [
        'Instant drag-and-drop bug triage with color-coded severity notes',
        'Multi-user shared workspace with live cursor presence',
        'High-velocity keyboard capture for rapid standup note-taking',
      ],
      boardColumns: [
        {
          name: 'Sprint Backlog',
          notes: [
            { title: 'Auth Token Refresh Bug', details: 'Reproduce on iOS Safari 17.4', color: 'pink', tag: 'P1 Critical', pinned: true },
            { title: 'Pastel Dark Theme Wash', details: 'CSS variable tokens update', color: 'purple', tag: 'Design Polish' },
          ],
        },
        {
          name: 'Active In Review',
          notes: [
            { title: 'Stripe Webhook Handler', details: 'Pending staging tests', color: 'blue', tag: 'PR #142' },
          ],
        },
        {
          name: 'Ready to Ship',
          notes: [
            { title: 'Export to PDF Engine', details: 'Validated across all boards', color: 'green', tag: 'Approved' },
          ],
        },
      ],
      testimonial: {
        quote: 'It shows me the work, not the machinery around it. We cut our standup time in half.',
        author: 'Arjun Mehta',
        role: 'Head of Product',
        avatarInitials: 'AM',
        avatarTone: 'blue',
        noteColor: 'blue',
      },
    },
    {
      id: 'creators',
      label: 'Creators & Writers',
      badge: 'CREATIVE FLOW',
      badgeColor: 'pink',
      icon: LucidePalette,
      headline: 'Give your creative sparks room to expand',
      tagline: 'Mood boards, content pipelines, and scripts on one visual wall.',
      story:
        'Ideas are visual, messy, and nonlinear. Forcing them into rigid text docs or spreadsheets suffocates inspiration. Sticky Ji acts as your infinite studio wall where ideas can sit, marinate, group, and evolve into finished creations.',
      painPoints: [
        'Fleeting creative hooks lost because capture was too slow',
        'Spreadsheets make creative brainstorming feel like doing taxes',
        'Content calendar burnout from unrealistic linear scheduling',
      ],
      breakthroughs: [
        'Virtual mood boards with colorful notes, quotes, and hooks',
        'Visual pipeline: Spark → Outline → Draft → Polished → Published',
        'Distraction-free zen interface that keeps you in creative flow',
      ],
      boardColumns: [
        {
          name: 'Idea Seeds',
          notes: [
            { title: 'Why Attention is Sacred', details: 'Essay hook on digital solitude', color: 'yellow', tag: 'Substack Draft' },
            { title: 'Minimalist Desk Setup', details: 'Short video script outline', color: 'pink', tag: 'YouTube' },
          ],
        },
        {
          name: 'In Drafting',
          notes: [
            { title: 'Chapter 4: The Quiet Room', details: 'Rewrite the opening dialogue', color: 'purple', tag: 'Fiction Novel', pinned: true },
          ],
        },
        {
          name: 'Scheduled',
          notes: [
            { title: 'Weekly Newsletter #52', details: 'Assets finalized & approved', color: 'green', tag: 'Sends Friday' },
          ],
        },
      ],
      testimonial: {
        quote: 'My book outlines finally feel alive. Moving sticky notes around unlocked my drafting speed.',
        author: 'Sarah Linden',
        role: 'Author & Essayist',
        avatarInitials: 'SL',
        avatarTone: 'pink',
        noteColor: 'pink',
      },
    },
    {
      id: 'teams',
      label: 'Small Teams & Studios',
      badge: 'COLLABORATION',
      badgeColor: 'purple',
      icon: LucideUsers,
      headline: 'Work together without endless coordination pings',
      tagline: 'Shared workspaces with real-time sync, member roles, and total clarity.',
      story:
        'Small agencies and remote studios don’t need bloated enterprise software with 100 confusing sub-menus. Sticky Ji gives your team a shared room where everyone knows the plan, client deliverables stay visible, and accountability is effortless.',
      painPoints: [
        'Team members working on outdated versions of project plans',
        'Clients confused by complex project management portals',
        'Endless "Where are we on this?" messages cluttering Slack',
      ],
      breakthroughs: [
        'Shared boards with instant multi-user synchronization',
        'Roles (Owner, Editor, Viewer) to safely collaborate with clients',
        'Teammate author avatars show exactly who is driving which note',
      ],
      boardColumns: [
        {
          name: 'Client Requests',
          notes: [
            { title: 'Brand Identity Refresh', details: 'Deliver primary logo & typography brief', color: 'yellow', tag: 'Client: Acme' },
            { title: 'Q1 Marketing Deck', details: '10 slide investor overview', color: 'blue', tag: 'Client: Nova' },
          ],
        },
        {
          name: 'In Production',
          notes: [
            { title: 'Figma Design System', details: 'Buttons, tokens, and dark theme variants', color: 'purple', tag: 'Assigned: Elena', pinned: true },
          ],
        },
        {
          name: 'Client Approved',
          notes: [
            { title: 'Webflow Landing Page', details: 'Domain mapped & live test passed', color: 'green', tag: 'Shipped' },
          ],
        },
      ],
      testimonial: {
        quote: 'Our agency ditched three separate tools for Sticky Ji. Our clients actually enjoy checking our board.',
        author: 'Marcus Vance',
        role: 'Studio Founder',
        avatarInitials: 'MV',
        avatarTone: 'purple',
        noteColor: 'purple',
      },
    },
    {
      id: 'life',
      label: 'Life & Mindful Habits',
      badge: 'EVERYDAY CLARITY',
      badgeColor: 'green',
      icon: LucideHeart,
      headline: 'Declutter your mental load outside of work',
      tagline: 'Meal plans, home projects, books to read, and daily habits.',
      story:
        'Life outside work is full of micro-tasks that consume mental bandwidth. Sticky Ji gives you a gentle, guilt-free canvas to track family routines, home improvements, reading lists, and weekend adventures without feeling like you are managing another job.',
      painPoints: [
        'Mental fatigue from trying to remember 30 small household chores',
        'Rigid habit trackers that induce guilt when you miss a day',
        'Important personal documents, recipes, and notes lost in messy apps',
      ],
      breakthroughs: [
        'Simple, cheerful visual boards that feel like personal stationery',
        'No guilt-inducing streaks or aggressive red alert reminders',
        'Dedicated "Weekend Projects" board to enjoy your free time',
      ],
      boardColumns: [
        {
          name: 'Home & Life',
          notes: [
            { title: 'Book Annual Vet Checkup', details: 'Call Dr. Miller for Milo', color: 'yellow', tag: 'Family' },
            { title: 'Balcony Garden Herbs', details: 'Potting soil & basil seeds', color: 'green', tag: 'Weekend Project' },
          ],
        },
        {
          name: 'This Week',
          notes: [
            { title: 'Sunday Meal Prep', details: 'Quinoa bowls, grilled veggies, lentil soup', color: 'pink', tag: 'Health', pinned: true },
          ],
        },
        {
          name: 'Books to Read',
          notes: [
            { title: 'Four Thousand Weeks', details: 'By Oliver Burkeman', color: 'blue', tag: 'Mindfulness' },
          ],
        },
      ],
      testimonial: {
        quote: 'It cleared the constant low-level buzz in my head. I feel completely on top of our household.',
        author: 'Zoe Cooper',
        role: 'Community Lead & Mom of two',
        avatarInitials: 'ZC',
        avatarTone: 'green',
        noteColor: 'green',
      },
    },
  ];

  // 6 Pre-built Board Templates
  readonly templates: BoardTemplate[] = [
    {
      title: 'University Semester Master',
      category: 'Education',
      color: 'yellow',
      description: 'Organize syllabus deadlines, weekly readings, and exam revision walls.',
      columnsCount: 4,
      sampleItems: ['Syllabus Backlog', 'Assignments Due', 'In Revision', 'Aced ✓'],
    },
    {
      title: 'Lightweight Sprint Board',
      category: 'Software & PM',
      color: 'blue',
      description: 'A clean 4-column sprint flow for engineering squads without ticket bloat.',
      columnsCount: 4,
      sampleItems: ['Backlog', 'In Dev', 'Testing', 'Deployed'],
    },
    {
      title: 'Creator Content Pipeline',
      category: 'Creative',
      color: 'pink',
      description: 'Move video scripts, essays, and newsletter issues from hook to published.',
      columnsCount: 5,
      sampleItems: ['Idea Sparks', 'Outlining', 'Drafting', 'In Polish', 'Published'],
    },
    {
      title: 'Client Project Dashboard',
      category: 'Agency & Studio',
      color: 'purple',
      description: 'Keep client deliverables, milestones, and feedback loop organized in one spot.',
      columnsCount: 4,
      sampleItems: ['Briefs', 'Active Production', 'Client Review', 'Delivered'],
    },
    {
      title: 'Calm Daily Habit Planner',
      category: 'Life & Wellness',
      color: 'green',
      description: 'Gentle habit tracking and weekly routines without stressful streak pressures.',
      columnsCount: 3,
      sampleItems: ['Morning Ritual', 'Daily Focus (Top 3)', 'Evening Wrap-up'],
    },
    {
      title: 'Home Renovation & Moving',
      category: 'Personal',
      color: 'yellow',
      description: 'Track contractor quotes, paint swatches, furniture orders, and moving checklists.',
      columnsCount: 4,
      sampleItems: ['Room Ideas', 'Quotes & Budget', 'In Progress', 'Finished'],
    },
  ];

  setPersona(id: PersonaId): void {
    this.activePersona.set(id);
  }

  get currentPersona(): PersonaProfile {
    return this.personas.find((p) => p.id === this.activePersona()) ?? this.personas[0];
  }

  navigateToAuth(page: 'login' | 'signup'): void {
    void this.router.navigate(['/auth', page]);
  }
}
