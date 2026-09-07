import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  PLATFORM_ID,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { LucideUserRound, LucideUsersRound } from '@lucide/angular';

import { Sidebar } from '../sidebar/sidebar';
import { WorkspaceApiService } from '../workspace/services/workspace.service';
import { WorkspaceStore } from '../workspace/services/workspace.store';

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly workspaceApiService = inject(WorkspaceApiService);
  private readonly workspaceStore = inject(WorkspaceStore);

  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly sidebarStorageKey = 'mystickynotes.sidebar-collapsed';
  private readonly workspaceStorageKey = 'mystickynotes.workspace-id';

  readonly sidebarCollapsed = signal(false);
  readonly mobileSidebarOpen = signal(false);

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

    this.loadWorkspaces();
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
      localStorage.setItem(this.sidebarStorageKey, String(collapsed));
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
      localStorage.setItem(this.workspaceStorageKey, workspaceId);
    }

    this.closeMobileSidebar();
  }

  logout(): void { }

  private loadWorkspaces(): void {
    if (this.workspaceStore.initialized()) {
      this.ensureWorkspaceSelected();
      return;
    }

    if (this.workspaceStore.loading()) {
      return;
    }

    this.workspaceStore.setLoading(true);

    this.workspaceApiService
      .getMyWorkspaces({
        page: 1,
        limit: 100
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const workspaces = response.data ?? [];

          this.workspaceStore.setWorkspaces(
            workspaces,
            response.pagination ?? null
          );

          this.ensureWorkspaceSelected();
        },
        error: error => {
          console.error(error);

          this.workspaceStore.setError(
            error?.error?.message ||
            error?.message ||
            'Unable to load workspaces.'
          );
        }
      });
  }

  private ensureWorkspaceSelected(): void {
    const workspaces = this.workspaceStore.workspaces();

    if (!workspaces.length) {
      this.workspaceStore.select(null);

      if (this.isBrowser) {
        localStorage.removeItem(this.workspaceStorageKey);
      }

      return;
    }

    const currentId = this.workspaceStore.selectedId();

    if (
      currentId &&
      workspaces.some(workspace => workspace.id === currentId)
    ) {
      return;
    }

    const storedId = this.isBrowser
      ? localStorage.getItem(this.workspaceStorageKey)
      : null;

    const selectedWorkspace =
      workspaces.find(workspace => workspace.id === storedId) ??
      workspaces.find(workspace => workspace.isPersonal) ??
      workspaces[0];

    this.workspaceStore.select(selectedWorkspace.id);

    if (this.isBrowser) {
      localStorage.setItem(
        this.workspaceStorageKey,
        selectedWorkspace.id
      );
    }
  }
}