import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import {
  LucideCalendarDays,
  LucideCircleUserRound,
  LucideFolderOpen,
  LucideLogOut,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucidePanelsTopLeft,
  LucideSlidersHorizontal,
  LucideStar,
  LucideStickyNote,
  LucideUsersRound,
  LucideX,
} from '@lucide/angular';

import {
  AppIcon,
  type AppIconDefinition,
} from '../../shared/components/icon/icon';

import {
  Select,
  type SelectOption,
  type SelectValue,
} from '../../shared/components/select/select';

import {
  Divider,
} from '../../shared/components/divider/divider';

interface SidebarItem {
  label: string;
  route: string;
  icon: AppIconDefinition;
}

interface SidebarGroup {
  label: string;
  items: readonly SidebarItem[];
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
    Select,
    Divider,
  ],

  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {

  @Input() collapsed = false;
  @Input() mobileOpen = false;

  @Input() workspaceId = '';
  @Input() loadingWorkspaces = false;

  @Input()
  workspaces: readonly SidebarWorkspace[] = [];

  @Output()
  collapsedChange = new EventEmitter<boolean>();

  @Output()
  mobileClosed = new EventEmitter<void>();

  @Output()
  workspaceChange = new EventEmitter<string>();

  @Output()
  logout = new EventEmitter<void>();


  /*
   * ============================================================
   * SIMPLE SIDEBAR STRUCTURE
   * ============================================================
   *
   * Home
   *   Today
   *
   * Workspace
   *   Workspaces
   *   Folders
   *   Members
   *
   * Notes
   *   Notes
   *   Favourites
   *
   * Account
   *   Profile
   *   Preferences
   */

  readonly navigationGroups: readonly SidebarGroup[] = [

    {
      label: 'Home',

      items: [
        {
          label: 'Today',
          route: '/app/today',
          icon: LucideCalendarDays,
        },
      ],
    },

    {
      label: 'Workspace',

      items: [
        {
          label: 'Workspaces',
          route: '/app/workspaces/my',
          icon: LucidePanelsTopLeft,
        },

        {
          label: 'Folders',
          route: '/app/workspacefolders/my',
          icon: LucideFolderOpen,
        },

        {
          label: 'Members',
          route: '/app/workspace-members',
          icon: LucideUsersRound,
        },
      ],
    },

    {
      label: 'Notes',

      items: [
        {
          label: 'Notes',
          route: '/app/sticky-notes/my',
          icon: LucideStickyNote,
        },

        {
          label: 'Favourites',
          route: '/app/favorites',
          icon: LucideStar,
        },
      ],
    },

    {
      label: 'Account',

      items: [
        {
          label: 'Profile',
          route: '/app/account/profile',
          icon: LucideCircleUserRound,
        },

        {
          label: 'Preferences',
          route: '/app/account/preferences',
          icon: LucideSlidersHorizontal,
        },
      ],
    },

  ];


  /*
   * ============================================================
   * TEMPLATE ICONS
   * ============================================================
   */

  readonly LucidePanelLeftClose =
    LucidePanelLeftClose;

  readonly LucidePanelLeftOpen =
    LucidePanelLeftOpen;

  readonly LucideLogOut =
    LucideLogOut;

  readonly LucideX =
    LucideX;


  /*
   * ============================================================
   * ACTIVE WORKSPACE
   * ============================================================
   */

  get activeWorkspaceLabel(): string {

    return (
      this.workspaces.find(
        workspace =>
          workspace.value === this.workspaceId,
      )?.label ?? 'My workspace'
    );

  }


  /*
   * ============================================================
   * SIDEBAR COLLAPSE
   * ============================================================
   */

  toggleCollapsed(): void {

    this.collapsedChange.emit(
      !this.collapsed,
    );

  }


  /*
   * ============================================================
   * MOBILE CLOSE
   * ============================================================
   */

  closeMobileNavigation(): void {

    if (this.mobileOpen) {
      this.mobileClosed.emit();
    }

  }


  /*
   * ============================================================
   * WORKSPACE CHANGE
   * ============================================================
   */

  onWorkspaceChange(
    value: SelectValue | SelectValue[] | null,
  ): void {

    if (
      typeof value !== 'string' ||
      value === this.workspaceId
    ) {
      return;
    }

    this.workspaceChange.emit(value);

    this.closeMobileNavigation();

  }


  /*
   * ============================================================
   * LOGOUT
   * ============================================================
   */

  requestLogout(): void {

    this.closeMobileNavigation();

    this.logout.emit();

  }

}