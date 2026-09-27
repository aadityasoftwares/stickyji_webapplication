import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LucideUserRound, LucideUsersRound } from '@lucide/angular';

import { Sidebar } from '../sidebar/sidebar';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { AppSessionStore } from '../../shared/functions/app-session.store';

@Component({
  selector: 'app-private',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './private.html',
  styleUrl: './private.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Private {

  private readonly platformId = inject(PLATFORM_ID);
  private readonly appSessionStore = inject(AppSessionStore);
  private readonly workspaceStore = inject(WorkspaceStore);

  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly sidebarStorageKey = 'mystickynotes.sidebar-collapsed';
  private readonly workspaceStorageKey = 'mystickynotes.workspace-id';

  readonly sidebarCollapsed = signal(false);
  readonly mobileSidebarOpen = signal(false);

  readonly initializing = this.appSessionStore.initializing;
  readonly initializationError = this.appSessionStore.error;

  readonly activeWorkspaceId = computed(
    () => this.workspaceStore.selectedId() ?? ''
  );

  readonly loadingWorkspaces = this.workspaceStore.loading;

  readonly sidebarWorkspaces = computed<readonly any[]>(() =>
    this.workspaceStore.workspaces().map(workspace => ({
      label: workspace.name,
      value: workspace.id,
      description:
        workspace.description?.trim() ||
        (workspace.isPersonal ? 'Private workspace' : 'Shared workspace'),
      group: workspace.isPersonal ? 'Personal' : 'Shared workspaces',
      icon: workspace.isPersonal ? LucideUserRound : LucideUsersRound
    }))
  );

  constructor() {

    if (this.isBrowser) {
      this.sidebarCollapsed.set(
        localStorage.getItem(this.sidebarStorageKey) === 'true'
      );
    }

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

    if (this.isBrowser) {
      localStorage.setItem(
        this.sidebarStorageKey,
        String(collapsed)
      );
    }
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  onWorkspaceChange(workspaceId: string): void {

    if (
      !workspaceId ||
      workspaceId === this.workspaceStore.selectedId()
    ) {
      return;
    }

    const exists = this.workspaceStore
      .workspaces()
      .some(workspace => workspace.id === workspaceId);

    if (!exists) {
      return;
    }

    this.workspaceStore.select(workspaceId);

    if (this.isBrowser) {
      localStorage.setItem(
        this.workspaceStorageKey,
        workspaceId
      );
    }

    this.closeMobileSidebar();
  }

  logout(): void {
    this.appSessionStore.reset();

    if (this.isBrowser) {
      localStorage.removeItem(this.workspaceStorageKey);
    }
  }

  private ensureWorkspaceSelected(
    workspaces: readonly any[]
  ): void {

    if (!workspaces.length) {

      this.workspaceStore.select(null);

      if (this.isBrowser) {
        localStorage.removeItem(
          this.workspaceStorageKey
        );
      }

      return;
    }

    const currentId =
      this.workspaceStore.selectedId();

    if (
      currentId &&
      workspaces.some(
        workspace => workspace.id === currentId
      )
    ) {
      return;
    }

    const storedId = this.isBrowser
      ? localStorage.getItem(this.workspaceStorageKey)
      : null;

    const selectedWorkspace =
      workspaces.find(
        workspace => workspace.id === storedId
      ) ??
      workspaces.find(
        workspace => workspace.isPersonal
      ) ??
      workspaces[0];

    this.workspaceStore.select(
      selectedWorkspace.id
    );

    if (this.isBrowser) {
      localStorage.setItem(
        this.workspaceStorageKey,
        selectedWorkspace.id
      );
    }
  }

}