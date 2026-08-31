import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, PLATFORM_ID, computed, inject, signal, } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet, } from '@angular/router';
import { LucideUserRound, LucideUsersRound } from '@lucide/angular';
import { filter } from 'rxjs';
import { Sidebar, type SidebarItem, type SidebarWorkspace, } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { WorkspaceApiService } from '../workspace/services/workspace.service';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { WorkspaceFolderApiService } from '../workspacefolders/services/workspace-folder.service';
import { WorkspaceFolderStore } from '../workspacefolders/services/workspace-folder.store';

@Component({
  standalone: true,
  selector: 'app-private',
  imports: [
    RouterOutlet,
    Sidebar
  ],
  templateUrl: './private.html',
  styleUrl: './private.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Private {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly workspaceApiService = inject(WorkspaceApiService);
  private readonly workspaceFolderApiService = inject(WorkspaceFolderApiService);

  readonly workspaceStore = inject(WorkspaceStore);
  readonly workspaceFolderStore = inject(WorkspaceFolderStore);

  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly sidebarCollapsed = signal(false);
  readonly mobileSidebarOpen = signal(false);
  readonly pageTitle = signal('Today');

  readonly sidebarWorkspaces = computed<readonly SidebarWorkspace[]>(() =>
    this.workspaceStore.workspaces().map(workspace => {
      const isPersonal = workspace.isPersonal;

      return {
        label: workspace.name,
        value: workspace._id,
        description:
          workspace.description?.trim() ||
          (isPersonal ? 'Private workspace' : 'Shared workspace'),
        group: isPersonal ? 'Personal' : 'Shared workspaces',
        icon: isPersonal ? LucideUserRound : LucideUsersRound,
      };
    }),
  );

  readonly activeWorkspaceId = computed(() => this.workspaceStore.selectedId() ?? '',);
  readonly activeWorkspaceName = computed(() => this.workspaceStore.selectedWorkspace()?.name ?? 'My workspace',);
  readonly loadingWorkspaces = computed(() => this.workspaceStore.loading(),);
  readonly loadingWorkspaceFolders = computed(() => this.workspaceFolderStore.loading(),);

  constructor() {
    if (this.isBrowser) {
      this.sidebarCollapsed.set(
        localStorage.getItem('mystickynotes.sidebar-collapsed') === 'true',
      );
    }

    this.loadMyWorkspaces();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd,),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        this.pageTitle.set(this.readRouteTitle());
        this.closeMobileSidebar();
      });

    this.destroyRef.onDestroy(() => this.unlockBodyScroll());
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
        'mystickynotes.sidebar-collapsed',
        String(collapsed),
      );
    }
  }

  openMobileSidebar(): void {
    this.mobileSidebarOpen.set(true);
    this.document.body.classList.add('app-menu-open');
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
    this.unlockBodyScroll();
  }

  onItemSelected(item: SidebarItem): void {
    this.pageTitle.set(item.label);
    this.closeMobileSidebar();
  }

  onWorkspaceChange(workspaceId: string): void {
    const workspace = this.workspaceStore
      .workspaces()
      .find(item => item._id === workspaceId);

    if (!workspace) {
      return;
    }

    if (this.workspaceStore.selectedId() === workspaceId) {
      return;
    }

    this.workspaceStore.select(workspaceId);

    if (this.isBrowser) {
      localStorage.setItem('mystickynotes.workspace-id', workspaceId);
    }

    this.loadWorkspaceFolders(workspaceId);
    this.closeMobileSidebar();
  }

  refreshWorkspaces(): void {
    this.loadMyWorkspaces(true);
  }

  refreshWorkspaceFolders(): void {
    const workspaceId = this.workspaceStore.selectedId();

    if (!workspaceId) {
      return;
    }

    this.loadWorkspaceFolders(workspaceId, true);
  }

  createNote(): void {
    this.closeMobileSidebar();
    void this.router.navigate(['/app/notes/new']);
  }

  createSpace(): void {
    this.closeMobileSidebar();
    void this.router.navigate(['/app/spaces/new']);
  }

  openWorkspaces(): void {
    this.closeMobileSidebar();
    void this.router.navigate(['/app/workspaces']);
  }

  openNotifications(): void {
    void this.router.navigate(['/app/notifications']);
  }

  openProfile(): void {
    this.closeMobileSidebar();
    void this.router.navigate(['/app/settings/profile']);
  }

  searchNotes(query: string): void {
    void this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        q: query || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private loadMyWorkspaces(force = false): void {
    if (!force && this.workspaceStore.initialized()) {
      const workspaceId = this.workspaceStore.selectedId();

      if (workspaceId) {
        this.loadWorkspaceFolders(workspaceId);
      }

      return;
    }

    if (this.workspaceStore.loading()) {
      return;
    }

    this.workspaceStore.setLoading(true);

    this.workspaceApiService
      .getMyWorkspaces({
        page: 1,
        limit: 100,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const workspaces = response.data ?? [];
          const pagination = response.pagination ?? null;

          this.workspaceStore.setWorkspaces(
            workspaces,
            pagination,
          );

          this.setInitialWorkspace(workspaces);

          const workspaceId = this.workspaceStore.selectedId();

          if (!workspaceId) {
            this.workspaceFolderStore.clear();
            return;
          }

          this.loadWorkspaceFolders(workspaceId, force);
        },

        error: error => {
          const message =
            error?.error?.message ||
            error?.message ||
            'Unable to load workspaces.';

          this.workspaceStore.setError(message);
          this.workspaceFolderStore.clear();
        },
      });
  }

  private loadWorkspaceFolders(
    workspaceId: string,
    force = false,
  ): void {
    const currentFolderWorkspaceId =
      this.workspaceFolderStore.workspaceId();

    if (
      !force &&
      currentFolderWorkspaceId === workspaceId &&
      this.workspaceFolderStore.initialized()
    ) {
      return;
    }

    this.workspaceFolderStore.resetForWorkspace(workspaceId);
    this.workspaceFolderStore.setLoading(true);

    this.workspaceFolderApiService
      .getByWorkspace(workspaceId, {
        page: 1,
        limit: 100,
        status: 'ACTIVE',
        sortBy: 'position',
        sortOrder: 'asc',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          /*
           * The user may switch workspaces before
           * the previous folder request finishes.
           */
          if (this.workspaceStore.selectedId() !== workspaceId) {
            return;
          }

          const folders = response.data ?? [];
          const pagination = response.pagination ?? null;

          this.workspaceFolderStore.setFolders(
            workspaceId,
            folders,
            pagination,
          );

          this.setInitialWorkspaceFolder(workspaceId);
        },

        error: error => {
          /*
           * Ignore errors from an old request
           * after the user switches workspaces.
           */
          if (this.workspaceStore.selectedId() !== workspaceId) {
            return;
          }

          const message =
            error?.error?.message ||
            error?.message ||
            'Unable to load workspace folders.';

          this.workspaceFolderStore.setError(message);
        },
      });
  }

  private setInitialWorkspace(
    workspaces: readonly {
      _id: string;
      isPersonal?: boolean;
    }[],
  ): void {
    if (!workspaces.length) {
      this.workspaceStore.select(null);
      this.workspaceFolderStore.clear();

      if (this.isBrowser) {
        localStorage.removeItem('mystickynotes.workspace-id');
      }

      return;
    }

    const currentId = this.workspaceStore.selectedId();

    const currentExists =
      currentId &&
      workspaces.some(workspace => workspace._id === currentId);

    if (currentExists) {
      return;
    }

    let storedWorkspaceId: string | null = null;

    if (this.isBrowser) {
      storedWorkspaceId = localStorage.getItem(
        'mystickynotes.workspace-id',
      );
    }

    const storedExists =
      storedWorkspaceId &&
      workspaces.some(
        workspace => workspace._id === storedWorkspaceId,
      );

    if (storedExists && storedWorkspaceId) {
      this.workspaceStore.select(storedWorkspaceId);
      return;
    }

    const personalWorkspace = workspaces.find(
      workspace => workspace.isPersonal,
    );

    const workspaceId =
      personalWorkspace?._id ?? workspaces[0]._id;

    this.workspaceStore.select(workspaceId);

    if (this.isBrowser) {
      localStorage.setItem(
        'mystickynotes.workspace-id',
        workspaceId,
      );
    }
  }

  private setInitialWorkspaceFolder(
    workspaceId: string,
  ): void {
    const folders = this.workspaceFolderStore.folders();

    if (!folders.length) {
      this.workspaceFolderStore.select(null);

      if (this.isBrowser) {
        localStorage.removeItem(
          this.getWorkspaceFolderStorageKey(workspaceId),
        );
      }

      return;
    }

    const currentId = this.workspaceFolderStore.selectedId();

    const currentExists =
      currentId &&
      folders.some(folder => folder._id === currentId);

    if (currentExists) {
      return;
    }

    let storedFolderId: string | null = null;

    if (this.isBrowser) {
      storedFolderId = localStorage.getItem(
        this.getWorkspaceFolderStorageKey(workspaceId),
      );
    }

    const storedExists =
      storedFolderId &&
      folders.some(folder => folder._id === storedFolderId);

    if (storedExists && storedFolderId) {
      this.workspaceFolderStore.select(storedFolderId);
      return;
    }

    const defaultFolder = folders.find(
      folder => folder.isDefault,
    );

    const folderId =
      defaultFolder?._id ?? folders[0]._id;

    this.workspaceFolderStore.select(folderId);

    if (this.isBrowser) {
      localStorage.setItem(
        this.getWorkspaceFolderStorageKey(workspaceId),
        folderId,
      );
    }
  }

  private getWorkspaceFolderStorageKey(
    workspaceId: string,
  ): string {
    return `mystickynotes.workspace.${workspaceId}.folder-id`;
  }

  private readRouteTitle(): string {
    let current = this.activatedRoute.snapshot;

    while (current.firstChild) {
      current = current.firstChild;
    }

    const configuredTitle = current.data['title'];

    if (typeof configuredTitle === 'string' && configuredTitle.trim()) {
      return configuredTitle;
    }

    const finalSegment = current.url.at(-1)?.path;

    if (!finalSegment) {
      return 'Today';
    }

    return finalSegment
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  private unlockBodyScroll(): void {
    this.document.body.classList.remove('app-menu-open');
  }
}
