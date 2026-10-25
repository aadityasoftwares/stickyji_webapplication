import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Injector,
  ViewChild,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LucideMenu, LucideUserRound, LucideUsersRound } from '@lucide/angular';
import { finalize } from 'rxjs';

import { Sidebar, type SidebarWorkspace } from '../sidebar/sidebar';
import { Button } from '../../shared/components/button/button';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { WorkspaceFolderStore } from '../workspacefolders/services/workspace-folder.store';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { AppSessionStore } from '../../shared/functions/app-session.store';
import { AuthService } from '../../public/auth/services/auth-service';
import { AuthStore } from '../../public/auth/state/auth.store';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { APP_ROUTES, routeCommands } from '../../shared/constants/route.constants';
import { USER_PREFERENCE_KEYS } from '../../shared/constants/common.constants';

@Component({
  selector: 'app-private',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Button],
  templateUrl: './private.html',
  styleUrl: './private.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Private {
  private readonly injector = inject(Injector);
  @ViewChild('mobileMenuButton', { read: ElementRef })
  private mobileMenuButton?: ElementRef<HTMLElement>;
  @ViewChild(Sidebar, { read: ElementRef }) private sidebarElement?: ElementRef<HTMLElement>;
  readonly LucideMenu = LucideMenu;
  private readonly appSessionStore = inject(AppSessionStore);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly workspaceFolderStore = inject(WorkspaceFolderStore);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly sidebarCollapsed = signal(false);
  readonly mobileSidebarOpen = signal(false);
  readonly loggingOut = signal(false);

  readonly initializing = this.appSessionStore.initializing;
  readonly initializationError = this.appSessionStore.error;

  readonly activeWorkspaceId = computed(() => this.workspaceStore.selectedId() ?? '');
  readonly selectedWorkspaceId = this.activeWorkspaceId;
  readonly selectedFolderId = computed(() => this.workspaceFolderStore.selectedId() ?? '');

  readonly loadingWorkspaces = this.workspaceStore.loading;

  readonly sidebarWorkspaces = computed<readonly SidebarWorkspace[]>(() =>
    this.workspaceStore.workspaces().map((workspace) => ({
      label: workspace.name,
      value: workspace.id,
      description:
        workspace.description?.trim() ||
        (workspace.isPersonal ? 'Private workspace' : 'Shared workspace'),
      group: workspace.isPersonal ? 'Personal' : 'Shared workspaces',
      icon: workspace.isPersonal ? LucideUserRound : LucideUsersRound,
    })),
  );

  constructor() {
    effect(() => {
      this.sidebarCollapsed.set(this.userPreferenceStore.sidebarCollapsed());
    });

    effect(() => {
      const loaded = this.workspaceStore.loaded();
      const workspaces = this.workspaceStore.workspaces();

      if (!loaded) {
        return;
      }

      this.ensureWorkspaceSelected(workspaces);
    });

    this.appSessionStore.initialize();
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.mobileSidebarOpen()) {
      this.closeMobileSidebar();
    }
  }

  @HostListener('window:resize', ['$event'])
  closeOnDesktop(event: Event): void {
    const width = (event.target as Window | null)?.innerWidth ?? 0;

    if (width >= 1024 && this.mobileSidebarOpen()) {
      this.closeMobileSidebar();
    }
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SIDEBAR_COLLAPSED, collapsed);
  }

  openMobileSidebar(): void {
    this.mobileSidebarOpen.set(true);
    afterNextRender(
      () => {
        if (this.mobileSidebarOpen()) {
          this.sidebarElement?.nativeElement
            .querySelector<HTMLButtonElement>('.mobile-close button')
            ?.focus();
        }
      },
      { injector: this.injector },
    );
  }

  closeMobileSidebar(): void {
    const wasOpen = this.mobileSidebarOpen();
    this.mobileSidebarOpen.set(false);
    if (wasOpen) {
      afterNextRender(
        () => {
          this.mobileMenuButton?.nativeElement.querySelector<HTMLButtonElement>('button')?.focus();
        },
        { injector: this.injector },
      );
    }
  }

  onWorkspaceChange(workspaceId: string): void {
    if (!workspaceId || workspaceId === this.workspaceStore.selectedId()) {
      return;
    }

    const exists = this.workspaceStore
      .workspaces()
      .some((workspace) => workspace.id === workspaceId);

    if (!exists) {
      return;
    }

    this.workspaceStore.select(workspaceId);
    this.workspaceFolderStore.resetForWorkspace(workspaceId);
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID, workspaceId);

    this.closeMobileSidebar();
  }

  logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.closeMobileSidebar();
    this.loggingOut.set(true);

    this.authService
      .logout()
      .pipe(
        finalize(() => {
          this.authStore.clearSession();
          this.appSessionStore.reset();
          this.workspaceFolderStore.clear();
          this.workspaceStore.reset();
          this.userPreferenceStore.reset();

          this.loggingOut.set(false);
          void this.router.navigate(routeCommands(APP_ROUTES.LOGIN));
        }),
      )
      .subscribe({
        next: (response) => {
          this.toastService.success(response?.message || 'Logged out successfully', {
            title: 'See you soon!',
          });
        },
        error: () => {
          this.toastService.info('You have been logged out.');
        },
      });
  }

  private ensureWorkspaceSelected(workspaces: readonly any[]): void {
    if (!workspaces.length) {
      this.workspaceStore.select(null);
      return;
    }

    const currentId = this.workspaceStore.selectedId();

    if (currentId && workspaces.some((workspace) => workspace.id === currentId)) {
      return;
    }

    const preferredId = this.userPreferenceStore.selectedWorkspaceId();

    const selectedWorkspace =
      workspaces.find((workspace) => workspace.id === preferredId) ??
      workspaces.find((workspace) => workspace.isPersonal) ??
      workspaces[0];

    this.workspaceStore.select(selectedWorkspace.id);
  }
}
