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
import { WorkspaceFolderStore } from '../workspacefolders/services/workspace-folder.store';
import { AppSessionStore } from '../../shared/functions/app-session.store';
import { STORAGE_KEYS } from '../../shared/constants/app.constants';
import {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem
} from '../../shared/functions/storage.functions';

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
  private readonly workspaceFolderStore = inject(WorkspaceFolderStore);

  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly sidebarCollapsed = signal(false);
  readonly mobileSidebarOpen = signal(false);

  readonly initializing = this.appSessionStore.initializing;
  readonly initializationError = this.appSessionStore.error;

  readonly activeWorkspaceId = computed(
    () => this.workspaceStore.selectedId() ?? ''
  );
  readonly selectedWorkspaceId = this.activeWorkspaceId;
  readonly selectedFolderId = computed(
    () => this.workspaceFolderStore.selectedId() ?? ''
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
        getLocalStorageItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true'
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
      setLocalStorageItem(
        STORAGE_KEYS.SIDEBAR_COLLAPSED,
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
    this.workspaceFolderStore.resetForWorkspace(workspaceId);

    if (this.isBrowser) {
      setLocalStorageItem(
        STORAGE_KEYS.WORKSPACE_ID,
        workspaceId
      );
    }

    this.closeMobileSidebar();
  }

  logout(): void {
    this.appSessionStore.reset();
    this.workspaceFolderStore.clear();

    if (this.isBrowser) {
        removeLocalStorageItem(STORAGE_KEYS.WORKSPACE_ID);
    }
  }

  private ensureWorkspaceSelected(
    workspaces: readonly any[]
  ): void {

    if (!workspaces.length) {

      this.workspaceStore.select(null);

      if (this.isBrowser) {
        removeLocalStorageItem(
          STORAGE_KEYS.WORKSPACE_ID
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
      ? getLocalStorageItem(STORAGE_KEYS.WORKSPACE_ID)
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
      setLocalStorageItem(
        STORAGE_KEYS.WORKSPACE_ID,
        selectedWorkspace.id
      );
    }
  }

}
