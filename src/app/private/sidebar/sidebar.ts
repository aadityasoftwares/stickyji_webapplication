import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideArchive,
  LucideBriefcaseBusiness,
  LucideCalendarDays,
  LucideCheckSquare2,
  LucideChevronDown,
  LucideHelpCircle,
  LucideLightbulb,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucidePlus,
  LucideSettings2,
  LucideStar,
  LucideStickyNote,
  LucideTrash2,
  LucideUserRound,
  LucideX,
} from '@lucide/angular';

import {
  AppIcon,
  type AppIconDefinition,
} from '../../shared/components/icon/icon';
import { Badge } from '../../shared/components/badge/badge';
import {
  Select,
  type SelectOption,
  type SelectValue,
} from '../../shared/components/select/select';

export interface SidebarItem {
  label: string;
  route: string;
  icon: AppIconDefinition;
  exact?: boolean;
  count?: number;
  color?: string;
}

export interface SidebarWorkspace extends SelectOption {
  value: string;
  memberCount?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    RouterLinkActive,
    AppIcon,
    Badge,
    Select,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Input() brandName = 'MyStickyNotes';
  @Input() workspaceName = 'My workspace';
  @Input() workspaceId = '';
  @Input() userName = 'Aaditya';
  @Input() planName = 'Free plan';
  @Input() loadingWorkspaces = false;
  @Input() workspaces: readonly SidebarWorkspace[] = [];

  @Input() mainItems: readonly SidebarItem[] = [
    {
      label: 'Today',
      route: '/app/today',
      icon: LucideCalendarDays,
      exact: true,
    },
    {
      label: 'All notes',
      route: '/app/notes',
      icon: LucideStickyNote,
    },
    {
      label: 'Tasks',
      route: '/app/tasks',
      icon: LucideCheckSquare2,
    },
    {
      label: 'Favorites',
      route: '/app/favorites',
      icon: LucideStar,
    },
  ];

  @Input() spaceItems: readonly SidebarItem[] = [
    {
      label: 'Personal',
      route: '/app/spaces/personal',
      icon: LucideUserRound,
      color: '#f2cf66',
    },
    {
      label: 'Work',
      route: '/app/spaces/work',
      icon: LucideBriefcaseBusiness,
      color: '#a8d8f0',
    },
    {
      label: 'Ideas',
      route: '/app/spaces/ideas',
      icon: LucideLightbulb,
      color: '#ddbff3',
    },
  ];

  @Input() libraryItems: readonly SidebarItem[] = [
    {
      label: 'Archive',
      route: '/app/archive',
      icon: LucideArchive,
    },
    {
      label: 'Trash',
      route: '/app/trash',
      icon: LucideTrash2,
    },
  ];

  @Input() footerItems: readonly SidebarItem[] = [
    {
      label: 'Help & support',
      route: '/app/help',
      icon: LucideHelpCircle,
    },
    {
      label: 'Settings',
      route: '/app/settings',
      icon: LucideSettings2,
    },
  ];

  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() mobileClosed = new EventEmitter<void>();
  @Output() createNote = new EventEmitter<void>();
  @Output() createSpace = new EventEmitter<void>();
  @Output() itemSelected = new EventEmitter<SidebarItem>();
  @Output() workspaceClick = new EventEmitter<void>();
  @Output() workspaceChange = new EventEmitter<string>();
  @Output() profileClick = new EventEmitter<void>();

  readonly LucidePanelLeftClose = LucidePanelLeftClose;
  readonly LucidePanelLeftOpen = LucidePanelLeftOpen;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucidePlus = LucidePlus;
  readonly LucideX = LucideX;

  get activeWorkspaceLabel(): string {
    return (
      this.workspaces.find(workspace => workspace.value === this.workspaceId)
        ?.label ?? this.workspaceName
    );
  }

  toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed);
  }

  selectItem(item: SidebarItem): void {
    this.itemSelected.emit(item);
    this.mobileClosed.emit();
  }

  onWorkspaceChange(value: SelectValue | SelectValue[] | null): void {
    if (typeof value !== 'string' || value === this.workspaceId) {
      return;
    }

    this.workspaceChange.emit(value);

    if (this.mobileOpen) {
      this.mobileClosed.emit();
    }
  }
}