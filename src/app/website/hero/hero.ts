import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  signal,
  computed,
} from '@angular/core';
import {
  LucideAArrowUp,
  LucideArrowRight,
  LucideBell,
  LucideCalendarDays,
  LucideCheck,
  LucideCheckCircle2,
  LucideChevronDown,
  LucideCircleUserRound,
  LucideClockAlert,
  LucideFolderOpen,
  LucideList,
  LucideLogOut,
  LucideMoreHorizontal,
  LucidePanelLeftClose,
  LucidePanelsTopLeft,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideSearch,
  LucideShieldCheck,
  LucideSlidersHorizontal,
  LucideSparkles,
  LucideStar,
  LucideStickyNote,
  LucideTrash2,
  LucideType,
  LucideUsersRound,
} from '@lucide/angular';
import { AppIcon, type AppIconDefinition } from '../../shared/components/icon/icon';

interface PreviewNavItem {
  readonly label: string;
  readonly icon: AppIconDefinition;
  readonly active?: boolean;
}

interface PreviewNavGroup {
  readonly label: string;
  readonly items: readonly PreviewNavItem[];
}

interface PreviewNote {
  readonly title: string;
  readonly description: string;
  readonly color: 'yellow' | 'blue' | 'green' | 'pink';
  readonly key?: string;
  readonly column?: string;
  readonly due?: string;
  readonly checklist?: { readonly label: string; readonly done: number; readonly total: number };
  readonly progress?: number;
  readonly assignees?: readonly string[];
  readonly completed?: boolean;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [AppIcon, NgTemplateOutlet],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  readonly previewView = signal<'notes' | 'kanban' | 'table'>('notes');
  readonly previewSearch = signal('');
  readonly previewViews = [
    { id: 'notes', label: 'Notes', icon: LucideStickyNote },
    { id: 'kanban', label: 'Kanban', icon: LucidePanelsTopLeft },
    { id: 'table', label: 'Table', icon: LucideList },
  ] as const;
  readonly visiblePreviewNotes = computed(() => {
    const query = this.previewSearch().trim().toLowerCase();
    return this.previewNotes.filter((note) =>
      `${note.title} ${note.description} ${note.key}`.toLowerCase().includes(query),
    );
  });
  readonly previewGroups = computed(() =>
    ['Todo', 'In progress', 'Completed'].map((label) => ({
      label,
      notes: this.visiblePreviewNotes().filter((note) => note.column === label),
    })),
  );
  @Output() readonly startFree = new EventEmitter<void>();
  @Output() readonly watchDemo = new EventEmitter<void>();

  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideBell = LucideBell;
  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideCheck = LucideCheck;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideSearch = LucideSearch;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideStar = LucideStar;
  readonly LucideStickyNote = LucideStickyNote;
  readonly LucideType = LucideType;
  readonly LucideAArrowUp = LucideAArrowUp;
  readonly LucidePanelLeftClose = LucidePanelLeftClose;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucideList = LucideList;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideClockAlert = LucideClockAlert;

  /** The navigation the signed-in app actually ships today. */
  readonly previewNav: readonly PreviewNavGroup[] = [
    {
      label: 'Home',
      items: [{ label: 'Today', icon: LucideCalendarDays, active: true }],
    },
    {
      label: 'Notes',
      items: [
        { label: 'Notes', icon: LucideStickyNote },
        { label: 'Favourites', icon: LucideStar },
      ],
    },
    {
      label: 'Workspace',
      items: [
        { label: 'Workspaces', icon: LucidePanelsTopLeft },
        { label: 'Folders', icon: LucideFolderOpen },
        { label: 'Members', icon: LucideUsersRound },
        { label: 'Roles & permissions', icon: LucideShieldCheck },
      ],
    },
  ];

  readonly previewAccount: readonly PreviewNavItem[] = [
    { label: 'Profile', icon: LucideCircleUserRound },
    { label: 'Preferences', icon: LucideSlidersHorizontal },
    { label: 'Logout', icon: LucideLogOut },
  ];

  /** Notes that look like the ones a real workspace holds today. */
  readonly previewNotes: readonly PreviewNote[] = [
    {
      title: 'Member Related Issues',
      description: 'Correct workspace member roles and permissions.',
      color: 'yellow',
      key: 'ST-000005',
      column: 'Todo',
      due: '25/10/2026',
      assignees: ['AD'],
    },
    {
      title: 'Home Page Corrections',
      description: 'Make the corrections to the home page.',
      color: 'blue',
      key: 'ST-000002',
      column: 'In progress',
      due: '25/10/2026',
      checklist: { label: 'Page corrections', done: 7, total: 12 },
      progress: 58,
    },
  ];
}
