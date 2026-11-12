import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideCheck,
  LucideSparkles,
  LucidePin,
  LucideLayout,
  LucideFolder,
  LucideCalendar,
  LucideClock3,
  LucideUsers,
  LucideShield,
  LucideSearch,
  LucideTag,
  LucideSmile,
  LucideZap,
  LucideSliders,
  LucidePalette,
  LucideFileText,
  LucideMousePointer,
  LucideCopy,
  LucideLayers,
  LucideHeart,
  LucideTrash2,
  LucideDownload,
  LucideCompass,
} from '@lucide/angular';
import { WebsiteHeader } from '../website-header/website-header';
import { WebsiteFooter } from '../website-footer/website-footer';
import { AppIcon } from '../../shared/components/icon/icon';
import { Avatar } from '../../shared/components/avatar/avatar';
import { Badge } from '../../shared/components/badge/badge';

export type FeatureTab = 'all' | 'canvas' | 'folders' | 'today' | 'collab' | 'power';
export type DemoColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';

export interface InteractiveChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface FeatureDeepDive {
  id: string;
  badge: string;
  badgeTone: 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  noteColor: DemoColor;
  noteAngle: number;
  noteContent: {
    heading: string;
    subheading: string;
    items: string[];
    footerTag: string;
    author: string;
  };
}

@Component({
  standalone: true,
  selector: 'app-features-page',
  imports: [RouterLink, WebsiteHeader, WebsiteFooter, AppIcon, Avatar, Badge],
  templateUrl: './features.html',
  styleUrl: './features.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesPage {
  private readonly router = inject(Router);

  // Lucide Icons
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly LucidePin = LucidePin;
  readonly LucideLayout = LucideLayout;
  readonly LucideFolder = LucideFolder;
  readonly LucideCalendar = LucideCalendar;
  readonly LucideClock3 = LucideClock3;
  readonly LucideUsers = LucideUsers;
  readonly LucideShield = LucideShield;
  readonly LucideSearch = LucideSearch;
  readonly LucideTag = LucideTag;
  readonly LucideSmile = LucideSmile;
  readonly LucideZap = LucideZap;
  readonly LucideSliders = LucideSliders;
  readonly LucidePalette = LucidePalette;
  readonly LucideFileText = LucideFileText;
  readonly LucideMousePointer = LucideMousePointer;
  readonly LucideCopy = LucideCopy;
  readonly LucideLayers = LucideLayers;
  readonly LucideHeart = LucideHeart;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideDownload = LucideDownload;
  readonly LucideCompass = LucideCompass;

  // Active Category Filter
  readonly activeCategory = signal<FeatureTab>('all');

  // Interactive Live Sticky Playground State
  readonly demoColor = signal<DemoColor>('yellow');
  readonly demoPinned = signal<boolean>(true);
  readonly demoChecklist = signal<InteractiveChecklistItem[]>([
    { id: '1', label: 'Capture early thoughts without stress', done: true },
    { id: '2', label: 'Color code by project or mood', done: true },
    { id: '3', label: 'Move to Today column for execution', done: false },
    { id: '4', label: 'Celebrate finishing with a gentle peel', done: false },
  ]);

  // Deep Dive Pillars
  readonly pillars: FeatureDeepDive[] = [
    {
      id: 'canvas',
      badge: 'PILLAR 01 · VISUAL FREEDOM',
      badgeTone: 'yellow',
      title: 'Digital Sticky Notes That Feel Tangible',
      tagline: 'Write, pin, fold, and arrange notes just like on your real desk.',
      description:
        'Sticky Ji rejects stiff database rows. Every note is a tactile canvas with authentic paper feel, natural tilt angles, folded corners, and curated pastel hues that make reading a pleasure.',
      highlights: [
        'Color-coded notes to distinguish work at a glance',
        'Rich text formatting: bold, italic, bullet points, and checkable lists',
        'Favourite notes to keep useful information close',
        'Note priorities, due dates, and completion status',
      ],
      noteColor: 'yellow',
      noteAngle: -2,
      noteContent: {
        heading: 'Product Roadmap 2026',
        subheading: 'Launch milestone v2.4',
        items: ['Sticky canvas zoom & pan', 'Pastel dark mode wash', 'Shared workspace guest view'],
        footerTag: 'High Priority',
        author: 'Alex K.',
      },
    },
    {
      id: 'folders',
      badge: 'PILLAR 02 · INTUITIVE ORDER',
      badgeTone: 'blue',
      title: 'Smart Folders, Boards & Kanban Columns',
      tagline: 'Structure that adapts to you—not rigid rules you have to manage.',
      description:
        'Organize your thoughts naturally. Group boards into workspaces (Work, Personal, University, Creative), sort notes into folders, and watch them move across flexible Kanban columns.',
      highlights: [
        'Dedicated Workspaces for separating clients, personal life, and teams',
        'Visual Folder hierarchy that keeps related boards neatly bundled',
        'Custom column workflows: Backlog, Today, In Review, Completed',
        'Move notes between columns as work progresses',
      ],
      noteColor: 'blue',
      noteAngle: 1.8,
      noteContent: {
        heading: 'Sprint 14: Mobile Polish',
        subheading: 'Frontend & Animations',
        items: ['Haptic note release', 'Responsive sheet drawer', 'Smooth column reorder'],
        footerTag: 'In Progress',
        author: 'Dev Studio',
      },
    },
    {
      id: 'today',
      badge: 'PILLAR 03 · CALM EXECUTION',
      badgeTone: 'pink',
      title: 'The "Today" Sanctuary & Daily Triage',
      tagline: 'Never drown in an overwhelming 500-task backlog again.',
      description:
        'Open the Today view to see daily work, review overdue notes, and focus on your next steps. Use due dates and completion status to keep your plans current.',
      highlights: [
        'Dedicated Today dashboard isolated from the noise of bigger backlogs',
        'Gentle overdue reminders that nudge without screeching red alerts',
        'Review due dates and priorities when planning your day',
        'Check completed notes to review your progress',
      ],
      noteColor: 'pink',
      noteAngle: -1.2,
      noteContent: {
        heading: 'My 3 Focus Items Today',
        subheading: 'Wednesday · Mindful Work',
        items: [
          'Ship marketing landing page',
          'Call with Maya regarding launch',
          '30 min evening walk',
        ],
        footerTag: 'Today View',
        author: 'You',
      },
    },
    {
      id: 'collab',
      badge: 'PILLAR 04 · SEAMLESS TEAMWORK',
      badgeTone: 'purple',
      title: 'Shared Workspaces and Permissions',
      tagline: 'Brainstorm, plan, and execute together without friction.',
      description:
        'Invite teammates or study partners into a workspace. Assign notes, manage membership, and review roles and permissions before sharing work.',
      highlights: [
        'Shared access to notes within a workspace',
        'Workspace roles and configurable permissions',
        'Member assignments for shared tasks',
        'Workspace invitations with an acceptance flow',
      ],
      noteColor: 'purple',
      noteAngle: 2.1,
      noteContent: {
        heading: 'Brand Studio Sync',
        subheading: 'Launch Campaign Notes',
        items: [
          'Illustrations approved ✓',
          'Packaging sticker sample ✓',
          'Social teasers copy review',
        ],
        footerTag: '4 Members Active',
        author: 'Team Space',
      },
    },
    {
      id: 'power',
      badge: 'PILLAR 05 · SPEED & MASTERY',
      badgeTone: 'green',
      title: 'Find Notes and Keep Work Organized',
      tagline: 'Built for thinkers who value lightning speed.',
      description:
        'Search notes, keep useful items in favourites, and review your folders. Use trash and restore controls when you need to recover a deleted note.',
      highlights: [
        'Search notes to find the work you need',
        'Use folders and priorities to organize related tasks',
        'Review deleted notes in the trash view',
        'Restore notes from trash when available',
      ],
      noteColor: 'green',
      noteAngle: -1.5,
      noteContent: {
        heading: 'Quick Search: #marketing',
        subheading: '12 notes matched across 3 boards',
        items: ['Copy brief v2.md', 'Newsletter issue 48', 'Podcast sponsorship outreach'],
        footerTag: 'Filtered View',
        author: 'Instant Query',
      },
    },
  ];

  // Delightful micro features
  readonly microFeatures = [
    {
      title: 'Washi Tape & Pins',
      desc: 'A paper-inspired workspace with colorful note cards.',
      icon: LucidePin,
      color: 'yellow',
    },
    {
      title: 'Paper Palette Moods',
      desc: 'Choose note colors to distinguish topics or priorities.',
      icon: LucidePalette,
      color: 'pink',
    },
    {
      title: 'Progress Checklists',
      desc: 'Interactive checkbox items with real-time percentage indicators on each note.',
      icon: LucideCheck,
      color: 'blue',
    },
    {
      title: 'Overdue Protection',
      desc: 'Soft indicators highlight overdue items without stressful blaring countdown timers.',
      icon: LucideClock3,
      color: 'orange',
    },
    {
      title: 'Drag & Drop Canvas',
      desc: 'Move notes between workflow columns as their status changes.',
      icon: LucideLayers,
      color: 'purple',
    },
    {
      title: 'Mobile Responsive',
      desc: 'Fully optimized for phones, tablets, and wide monitors. Your thoughts anywhere.',
      icon: LucideCompass,
      color: 'green',
    },
    {
      title: 'Zero Clutter UI',
      desc: 'No endless ribbons or complex side panels. The workspace stays out of your way.',
      icon: LucideSparkles,
      color: 'yellow',
    },
    {
      title: 'Safe Trash & Restore',
      desc: 'Accidentally deleted a note? Recover it in one click from the workspace trash bin.',
      icon: LucideTrash2,
      color: 'pink',
    },
  ];

  setCategory(tab: FeatureTab): void {
    this.activeCategory.set(tab);
  }

  setDemoColor(color: DemoColor): void {
    this.demoColor.set(color);
  }

  toggleDemoPin(): void {
    this.demoPinned.update((v) => !v);
  }

  toggleChecklistItem(id: string): void {
    this.demoChecklist.update((items) =>
      items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  }

  get completedCount(): number {
    return this.demoChecklist().filter((i) => i.done).length;
  }

  get totalCount(): number {
    return this.demoChecklist().length;
  }

  get filteredPillars(): FeatureDeepDive[] {
    const cat = this.activeCategory();
    if (cat === 'all') return this.pillars;
    return this.pillars.filter((p) => p.id === cat);
  }

  navigateToAuth(page: 'login' | 'signup'): void {
    void this.router.navigate(['/auth', page]);
  }
}
