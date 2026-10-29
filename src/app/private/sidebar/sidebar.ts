import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, type IsActiveMatchOptions } from '@angular/router';
import {
  LucideCalendarDays,
  LucideChevronDown,
  LucideChevronRight,
  LucideCircleUserRound,
  LucideFolderOpen,
  LucideLoaderCircle,
  LucideLogOut,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucidePanelsTopLeft,
  LucideShieldCheck,
  LucideStar,
  LucideStickyNote,
  LucideUsersRound,
  LucideX
} from '@lucide/angular';
import { Button } from '../../shared/components/button/button';
import { AppIcon, type AppIconDefinition } from '../../shared/components/icon/icon';
import { type SelectOption, type SelectValue } from '../../shared/components/select/select';
import { Tooltip } from '../../shared/components/tooltip/tooltip';
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
  imports: [RouterLink, RouterLinkActive, AppIcon, Button, Tooltip],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Input() workspaceId = '';
  @Input() loadingWorkspaces = false;
  @Input() workspaces: readonly SidebarWorkspace[] = [];
  @Input() loggingOut = false;

  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() mobileClosed = new EventEmitter<void>();
  @Output() workspaceChange = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  readonly closedGroups = signal<ReadonlySet<string>>(new Set());
  readonly routes = APP_ROUTES;
  readonly activeMatchOptions: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };
  private readonly workspaceColors = ['#f6c747', '#83bbe6', '#91bc73', '#df8589', '#8c9cdb'];

  readonly navigationGroups: readonly SidebarGroup[] = [
    {
      label: 'Home',
      items: [{ label: 'Today', route: APP_ROUTES.TODAY, icon: LucideCalendarDays }],
    },
    {
      label: 'Notes',
      items: [
        { label: 'Notes', route: APP_ROUTES.MY_NOTES, icon: LucideStickyNote },
        { label: 'Favourites', route: APP_ROUTES.FAVORITE_NOTES, icon: LucideStar },
      ],
    },
    {
      label: 'Workspace',
      items: [
        { label: 'Workspaces', route: APP_ROUTES.WORKSPACES, icon: LucidePanelsTopLeft },
        { label: 'Folders', route: APP_ROUTES.WORKSPACE_FOLDERS, icon: LucideFolderOpen },
        { label: 'Members', route: APP_ROUTES.WORKSPACE_MEMBERS, icon: LucideUsersRound },
        {
          label: 'Roles & permissions',
          route: APP_ROUTES.ROLES_PERMISSIONS,
          icon: LucideShieldCheck,
        },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'Profile', route: APP_ROUTES.PROFILE, icon: LucideCircleUserRound },
        // { label: 'Preferences', route: APP_ROUTES.PREFERENCES, icon: LucideSlidersHorizontal },
      ],
    },
  ];
  readonly mainGroups = this.navigationGroups.filter((group) => group.label !== 'Account');
  readonly accountItems = this.navigationGroups.find((group) => group.label === 'Account')!.items;

  readonly LucidePanelLeftClose = LucidePanelLeftClose;
  readonly LucidePanelLeftOpen = LucidePanelLeftOpen;
  readonly LucideLogOut = LucideLogOut;
  readonly LucideLoaderCircle = LucideLoaderCircle;
  readonly LucideX = LucideX;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideChevronRight = LucideChevronRight;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;

  get compact(): boolean {
    return this.collapsed && !this.mobileOpen;
  }

  get activeWorkspaceLabel(): string {
    return (
      this.workspaces.find((workspace) => workspace.value === this.workspaceId)?.label ??
      'My workspace'
    );
  }

  isGroupExpanded(label: string): boolean {
    // Keep every destination accessible in the icon rail; restore section choices on expansion.
    return this.compact || !this.closedGroups().has(label);
  }

  toggleGroup(label: string): void {
    this.closedGroups.update((closed) => {
      const next = new Set(closed);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  workspaceColor(workspace: SidebarWorkspace): string {
    const hash = Array.from(workspace.value).reduce((value, char) => value + char.charCodeAt(0), 0);
    return workspace.color || this.workspaceColors[hash % this.workspaceColors.length];
  }

  toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed);
  }

  closeMobileNavigation(): void {
    if (this.mobileOpen) this.mobileClosed.emit();
  }

  onWorkspaceChange(value: SelectValue | SelectValue[] | null): void {
    if (
      typeof value !== 'string' ||
      value === this.workspaceId ||
      this.loadingWorkspaces ||
      !this.workspaces.some((workspace) => workspace.value === value && !workspace.disabled)
    )
      return;
    this.workspaceChange.emit(value);
    this.closeMobileNavigation();
  }

  requestLogout(): void {
    if (this.loggingOut) return;
    this.closeMobileNavigation();
    this.logout.emit();
  }
}
