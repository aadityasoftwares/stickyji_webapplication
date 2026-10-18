import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { RouterLink, RouterLinkActive } from '@angular/router';

import {
  LucideCalendarDays,
  LucideCircleUserRound,
  LucideFolderOpen,
  LucideLogOut,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucidePanelsTopLeft,
  LucideShieldCheck,
  LucideSlidersHorizontal,
  LucideStar,
  LucideStickyNote,
  LucideUsersRound,
  LucideX,
} from '@lucide/angular';

import { AppIcon, type AppIconDefinition } from '../../shared/components/icon/icon';

import { Select, type SelectOption, type SelectValue } from '../../shared/components/select/select';

import { Divider } from '../../shared/components/divider/divider';
import { APP_ROUTES } from '../../shared/constants/route.constants';

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

  imports: [FormsModule, RouterLink, RouterLinkActive, AppIcon, Divider],

  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  @Input()
  collapsed = false;

  @Input()
  mobileOpen = false;

  @Input()
  workspaceId = '';

  @Input()
  loadingWorkspaces = false;

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
   * NAVIGATION
   * ============================================================
   *
   * Home
   *   Today
   *
   * Workspace
   *   Workspaces
   *   Folders
   *   Members
   *   Roles & permissions
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
          route: APP_ROUTES.TODAY,
          icon: LucideCalendarDays,
        },
      ],
    },

    {
      label: 'Workspace',

      items: [
        {
          label: 'Workspaces',
          route: APP_ROUTES.WORKSPACES,
          icon: LucidePanelsTopLeft,
        },

        {
          label: 'Folders',
          route: APP_ROUTES.WORKSPACE_FOLDERS,
          icon: LucideFolderOpen,
        },

        {
          label: 'Members',
          route: APP_ROUTES.WORKSPACE_MEMBERS,
          icon: LucideUsersRound,
        },

        {
          label: 'Roles & permissions',
          route: APP_ROUTES.ROLES_PERMISSIONS,
          icon: LucideShieldCheck,
        },
      ],
    },

    {
      label: 'Notes',

      items: [
        {
          label: 'Notes',
          route: APP_ROUTES.MY_NOTES,
          icon: LucideStickyNote,
        },

        {
          label: 'Favourites',
          route: APP_ROUTES.FAVORITE_NOTES,
          icon: LucideStar,
        },
      ],
    },

    {
      label: 'Account',

      items: [
        {
          label: 'Profile',
          route: APP_ROUTES.PROFILE,
          icon: LucideCircleUserRound,
        },

        {
          label: 'Preferences',
          route: APP_ROUTES.PREFERENCES,
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

  readonly LucidePanelLeftClose = LucidePanelLeftClose;

  readonly LucidePanelLeftOpen = LucidePanelLeftOpen;

  readonly LucideLogOut = LucideLogOut;

  readonly LucideX = LucideX;

  /*
   * ============================================================
   * ACTIVE WORKSPACE
   * ============================================================
   */

  get activeWorkspaceLabel(): string {
    return (
      this.workspaces.find((workspace) => workspace.value === this.workspaceId)?.label ??
      'My workspace'
    );
  }

  /*
   * ============================================================
   * SIDEBAR COLLAPSE
   * ============================================================
   */

  toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed);
  }

  /*
   * ============================================================
   * MOBILE CLOSE
   * ============================================================
   */

  closeMobileNavigation(): void {
    if (!this.mobileOpen) {
      return;
    }

    this.mobileClosed.emit();
  }

  /*
   * ============================================================
   * WORKSPACE CHANGE
   * ============================================================
   */

  onWorkspaceChange(value: SelectValue | SelectValue[] | null): void {
    if (typeof value !== 'string' || value === this.workspaceId) {
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
