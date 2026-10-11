import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AuthStore } from '../../public/auth/state/auth.store';
import { canWorkspaceAction } from '../../shared/functions/workspace-access.function';
export type WorkspaceCombinedFilter = 'all' | 'owned' | 'shared' | 'active' | 'archived';
export type WorkspaceAccessFilter = 'ALL' | 'OWNED' | 'SHARED';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, debounceTime, distinctUntilChanged, finalize, timer } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import {
  LucideArchive,
  LucideArrowRight,
  LucideCheck,
  LucideChevronDown,
  LucideChevronRight,
  LucideClock3,
  LucideFolder,
  LucideFolderOpen,
  LucideGlobe,
  LucideLightbulb,
  LucideLock,
  LucideMegaphone,
  LucideMoreHorizontal,
  LucidePanelsTopLeft,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideSearch,
  LucideShield,
  LucideTrash2,
  LucideUsers,
  LucideX,
} from '@lucide/angular';

import { AppIcon } from '../../shared/components/icon/icon';
import { Input as AppInput } from '../../shared/components/input/input';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Checkbox } from '../../shared/components/checkbox/checkbox';
import { BulkActionPanel } from '../../shared/components/bulk-action-panel/bulk-action-panel';
import { Loader } from '../../shared/components/loader/loader';
import { Select } from '../../shared/components/select/select';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';
import { TabItem, Tabs } from '../../shared/components/tabs/tabs';
import { Tooltip } from '../../shared/components/tooltip/tooltip';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { WORKSPACE_MESSAGES } from './messages/workspace.messages';
import { APP_ROUTES, routeCommands } from '../../shared/constants/route.constants';
import { MembersStack } from '../workspace-members/members-stack/members-stack';
import { WorkspaceFolderWrapper } from './workspace-folder-wrapper/workspace-folder-wrapper';
import { AddEditWorkspaceSidePanel } from './add-edit-workspace-side-panel/add-edit-workspace-side-panel';
import { WorkspaceService } from './services/workspace.service';
import { WorkspaceStore } from './services/workspace.store';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { UserDatePipe } from '../../shared/pipes/user-date.pipe';
import {
  SORT_OPTIONS,
  WORKSPACE_ACCESS_FILTERS,
  USER_PREFERENCE_KEYS,
  VIEW_TABS,
  WORKSPACE_SORT_PREFERENCES,
  buildStatusTabs,
} from '../../shared/constants/common.constants';
import {
  entityNameOf,
  extractErrorMessage,
  extractList,
  idOf,
} from '../../shared/functions/common.function';
import {
  getWorkspaceMemberAvatar,
  getWorkspaceMemberId,
  getWorkspaceMemberName,
  getWorkspaceMemberRole,
} from '../../shared/functions/workspace-member.function';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    FormsModule,
    NgTemplateOutlet,
    MatMenuModule,
    MatDividerModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Checkbox,
    BulkActionPanel,
    Loader,
    MembersStack,
    AddEditWorkspaceSidePanel,
    Select,
    StickyCard,
    Tabs,
    Tooltip,
    UserDatePipe,
    WorkspaceFolderWrapper,
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Workspace implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly workspaceApi = inject(WorkspaceService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly toastService = inject(ToastService);

  readonly LucideArchive = LucideArchive;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideChevronRight = LucideChevronRight;
  readonly LucideClock3 = LucideClock3;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucideGlobe = LucideGlobe;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideRotateCcw = LucideRotateCcw;
  readonly LucideSearch = LucideSearch;
  readonly LucideShield = LucideShield;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideUsers = LucideUsers;
  readonly LucideX = LucideX;

  private readonly renameInput = viewChild<ElementRef<HTMLInputElement>>('renameInput');

  private readonly authStore = inject(AuthStore);
  readonly activeFilter = signal<WorkspaceCombinedFilter>(
    (() => {
      const pref = String(this.userPreferenceStore.workspaceStatusFilter() ?? '').toLowerCase();
      return ['owned', 'shared', 'active', 'archived'].includes(pref) ? (pref as WorkspaceCombinedFilter) : 'all';
    })()
  );
  readonly accessFilter = signal<WorkspaceAccessFilter>(
    (() => {
      const pref = String(this.userPreferenceStore.workspaceStatusFilter() ?? '').toUpperCase();
      return pref === 'OWNED' ? 'OWNED' : pref === 'SHARED' ? 'SHARED' : 'ALL';
    })()
  );
  readonly accessFilters = signal<any[]>([...WORKSPACE_ACCESS_FILTERS]);

  constructor() {
    effect(() => {
      const pref = String(this.userPreferenceStore.workspaceStatusFilter() ?? '').toLowerCase();
      if (['all', 'owned', 'shared', 'active', 'archived'].includes(pref)) {
        untracked(() => {
          if (this.activeFilter() !== pref) {
            this.activeFilter.set(pref as WorkspaceCombinedFilter);
            if (pref === 'owned') {
              this.accessFilter.set('OWNED');
            } else if (pref === 'shared') {
              this.accessFilter.set('SHARED');
            } else if (this.accessFilter() !== 'ALL') {
              this.accessFilter.set('ALL');
            }
          }
        });
      }
    });
  }
  readonly emptyMessage = computed(() => {
    if (this.searchTerm().trim()) return 'No matching workspaces found.';
    if (this.activeFilter() === 'shared' || this.accessFilter() === 'SHARED') return 'No shared workspaces yet.';
    if (this.activeFilter() === 'owned' || this.accessFilter() === 'OWNED') return 'No workspaces created yet.';
    if (this.activeFilter() === 'archived' || this.activeTab() === 'archived') return 'No archived workspaces.';
    if (this.activeFilter() === 'active') return 'No active workspaces yet.';
    return 'No workspaces yet.';
  });
  readonly bulkBusy = signal(false);

  can(workspace: any, action: any): boolean {
    const current = this.workspaces().find(item => idOf(item) === idOf(workspace)) ?? workspace;
    return canWorkspaceAction(current, action);
  }

  canBulk(action: 'canArchive' | 'canTrash'): boolean {
    const selected = this.workspaces().filter(item => this.selectedWorkspaceIds().has(idOf(item)));
    return !this.bulkBusy() && selected.length > 0 && selected.length === this.selectedCount() &&
      selected.every(item => this.can(item, action) && !this.isBusy(item) && (action !== 'canArchive' || this.isActive(item)));
  }

  setWorkspaceFilter(value: unknown): void {
    const filter = String(value ?? '').toLowerCase() as WorkspaceCombinedFilter;
    if (!['all', 'owned', 'shared', 'active', 'archived'].includes(filter)) return;
    if (filter === this.activeFilter()) return;

    this.activeFilter.set(filter);

    if (filter === 'owned') {
      this.accessFilter.set('OWNED');
    } else if (filter === 'shared') {
      this.accessFilter.set('SHARED');
    } else {
      this.accessFilter.set('ALL');
    }

    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.WORKSPACE_STATUS_FILTER, filter.toUpperCase());

    this.page.set(1);
    this.loadWorkspaces('', true);
  }

  onAccessChange(value: unknown): void {
    if ((value !== 'ALL' && value !== 'OWNED' && value !== 'SHARED') || value === this.accessFilter()) return;
    this.accessFilter.set(value);
    if (value === 'OWNED') {
      this.activeFilter.set('owned');
    } else if (value === 'SHARED') {
      this.activeFilter.set('shared');
    } else {
      this.activeFilter.set('all');
    }
    this.page.set(1);
    this.loadWorkspaces('', true);
  }

  readonly workspaces = signal<any[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly collapsedGroups = signal<Set<string>>(new Set());
  readonly selectedWorkspaceIds = signal<Set<string>>(new Set());
  readonly selectedCount = computed(() => this.selectedWorkspaceIds().size);

  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly pagination = signal<any>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  readonly counts = signal<any>({ all: 0, active: 0, archived: 0 });

  private readonly searchSubject = new Subject<string>();
  private requestedQuery = '';
  private loadSubscription: Subscription | null = null;

  readonly activeTab = computed<'all' | 'active' | 'archived'>(() => {
    const value = String(this.userPreferenceStore.workspaceStatusFilter() ?? '').toLowerCase();
    return value === 'active' || value === 'archived' ? value : 'all';
  });

  readonly sortBy = computed<keyof typeof WORKSPACE_SORT_PREFERENCES>(() => {
    const value = this.userPreferenceStore.workspaceSortOrder();
    return (
      (Object.keys(WORKSPACE_SORT_PREFERENCES) as (keyof typeof WORKSPACE_SORT_PREFERENCES)[]).find(
        (key) => WORKSPACE_SORT_PREFERENCES[key] === value
      ) ?? 'recent'
    );
  });

  readonly view = computed<'grid' | 'list'>(() =>
    String(this.userPreferenceStore.workspaceView() ?? '').toUpperCase() === 'LIST' ? 'list' : 'grid'
  );

  readonly workspaceEditorOpen = signal(false);
  readonly workspaceEditorId = signal<string>('');
  readonly editorWorkspace = computed(() => {
    const id = this.workspaceEditorId();
    return id ? this.workspaces().find((item) => idOf(item) === id) ?? null : null;
  });

  readonly inlineRenameId = signal<string | null>(null);
  readonly inlineRenameName = signal('');
  readonly inlineRenameError = signal<string | null>(null);
  readonly inlineRenameSubmitting = signal(false);

  readonly deleteTarget = signal<any | null>(null);
  readonly deleting = signal(false);
  readonly busyIds = signal<ReadonlySet<string>>(new Set());

  readonly sortOptions = [
    SORT_OPTIONS[0],
    { label: 'Recently created', value: 'created' },
    ...SORT_OPTIONS.slice(1),
  ];
  readonly viewTabs = VIEW_TABS;

  readonly totalCount = computed(() => this.pagination()?.total ?? 0);

  readonly workspaceTabs = computed<TabItem[]>(() => {
    const c = this.counts();
    return buildStatusTabs(c).map(tab => ({ ...tab, count: c?.[String(tab.value)] }));
  });

  readonly filterTabs = computed<TabItem[]>(() => {
    const c = this.counts();
    const ac = this.accessFilters();
    const ownedCount = ac.find((item) => item.value === 'OWNED')?.count;
    const sharedCount = ac.find((item) => item.value === 'SHARED')?.count;

    return [
      { value: 'all', label: 'All spaces', count: c?.all ?? this.pagination()?.total },
      { value: 'owned', label: 'My spaces', count: ownedCount },
      { value: 'shared', label: 'Shared with me', count: sharedCount },
      { value: 'active', label: 'Active', count: c?.active },
      { value: 'archived', label: 'Archived', count: c?.archived },
    ];
  });

  readonly visibleWorkspaces = computed<any[]>(() => {
    const list = this.workspaces();
    const filter = this.activeFilter();
    const tab = this.activeTab();
    const sort = this.sortBy();
    const statusPref = String(this.userPreferenceStore.workspaceStatusFilter() ?? '').toLowerCase();

    const filtered = list.filter((item) => {
      const isOwner = item.isOwner === true || item.access?.isOwner === true;
      if (!isOwner && item.access?.membership?.status && item.access.membership.status !== 'ACTIVE') return false;
      const status = String(item?.status ?? 'ACTIVE');
      if (status === 'DELETED' || status === 'TRASHED') return false;
      if ((filter === 'active' || (filter === 'all' && tab === 'active')) && status !== 'ACTIVE') return false;
      if ((filter === 'archived' || (filter === 'all' && tab === 'archived')) && status !== 'ARCHIVED') return false;
      if ((filter === 'owned' || (filter === 'all' && statusPref === 'owned')) && !isOwner) return false;
      if ((filter === 'shared' || (filter === 'all' && statusPref === 'shared')) && isOwner) return false;
      return true;
    });

    return [...filtered].sort((first, second) => {
      if (sort === 'name-asc') {
        return this.workspaceName(first).localeCompare(this.workspaceName(second));
      }
      if (sort === 'name-desc') {
        return this.workspaceName(second).localeCompare(this.workspaceName(first));
      }
      const firstDate = this.workspaceTimestamp(first, sort === 'created');
      const secondDate = this.workspaceTimestamp(second, sort === 'created');
      return sort === 'oldest' ? firstDate - secondDate : secondDate - firstDate;
    });
  });

  readonly workspaceGroups = computed<any[]>(() => {
    const list = this.visibleWorkspaces();
    const filter = this.activeFilter();
    const tab = this.activeTab();
    const isSearchActive = !!this.searchTerm().trim();

    const groups: any[] = [];

    const showActive = filter !== 'archived' && (filter !== 'all' || tab !== 'archived');
    const showArchived = filter !== 'active' && (filter !== 'all' || tab !== 'active');

    if (showActive) {
      const activeItems = list.filter((w) => (w?.status ?? 'ACTIVE') === 'ACTIVE');
      groups.push({
        id: 'active',
        label: 'Active Spaces',
        status: 'ACTIVE',
        accent: '#10b981',
        items: activeItems,
        count: activeItems.length,
      });
    }

    if (showArchived) {
      const archivedItems = list.filter((w) => w?.status === 'ARCHIVED');
      groups.push({
        id: 'archived',
        label: 'Archived Spaces',
        status: 'ARCHIVED',
        accent: '#64748b',
        items: archivedItems,
        count: archivedItems.length,
      });
    }

    return groups.filter((g) => g.count > 0 || !isSearchActive);
  });

  ngOnInit(): void {
    this.authStore.loadGlobalPermissions();
    this.userPreferenceStore.load();
    this.initSearchPipeline();
    this.loadWorkspaces();
  }

  toggleGroup(groupId: string): void {
    this.collapsedGroups.update((set) => {
      const next = new Set(set);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  isGroupCollapsed(groupId: string): boolean {
    return this.collapsedGroups().has(groupId);
  }

  isWorkspaceSelected(workspace: any): boolean {
    const id = idOf(workspace);
    return !!id && this.selectedWorkspaceIds().has(id);
  }

  toggleWorkspaceSelection(workspace: any, checked: boolean): void {
    const id = idOf(workspace);
    if (!id) return;

    this.selectedWorkspaceIds.update((set) => {
      const next = new Set(set);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  isAllSelected(workspaces?: any[]): boolean {
    const target = workspaces ?? this.visibleWorkspaces();
    if (!target.length) return false;
    const set = this.selectedWorkspaceIds();
    return target.every((w) => set.has(idOf(w)));
  }

  isSomeSelected(workspaces?: any[]): boolean {
    const target = workspaces ?? this.visibleWorkspaces();
    if (!target.length) return false;
    const set = this.selectedWorkspaceIds();
    const selected = target.filter((w) => set.has(idOf(w)));
    return selected.length > 0 && selected.length < target.length;
  }

  toggleSelectAll(checked: boolean, workspaces?: any[]): void {
    const target = workspaces ?? this.visibleWorkspaces();
    if (!target.length) return;

    this.selectedWorkspaceIds.update((set) => {
      const next = new Set(set);
      target.forEach((w) => {
        const id = idOf(w);
        if (id) {
          if (checked) {
            next.add(id);
          } else {
            next.delete(id);
          }
        }
      });
      return next;
    });
  }

  clearSelection(): void {
    this.selectedWorkspaceIds.set(new Set());
  }

  bulkArchiveSelected(): void {
    if (!this.canBulk('canArchive')) return;
    this.bulkBusy.set(true);
    const ids = Array.from(this.selectedWorkspaceIds());
    if (!ids.length) return;

    let completed = 0;
    let updatedCount = 0;
    const finish = () => {
      completed++;
      if (completed !== ids.length) return;

      if (updatedCount > 0) {
        this.toastService.success(
          `Archived ${updatedCount} ${updatedCount === 1 ? 'workspace' : 'workspaces'}`
        );
      }
      this.clearSelection();
      this.bulkBusy.set(false);
      this.loadWorkspaces('', true);
    };

    ids.forEach((id) => {
      const workspace = this.workspaces().find((w) => idOf(w) === id);
      if (!workspace || !this.isActive(workspace)) {
        finish();
        return;
      }

      this.workspaceApi
        .updateStatus(id, 'ARCHIVED')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.updateLocalWorkspace(id, { status: 'ARCHIVED' });
            this.syncCountsAfterStatusChange('ARCHIVED');
            updatedCount++;
            finish();
          },
          error: error => {
            this.toastService.error(extractErrorMessage(error, 'Workspace action failed. Refresh and try again.'));
            finish();
          },
        });
    });
  }

  bulkDeleteSelected(): void {
    if (!this.canBulk('canTrash')) return;
    this.bulkBusy.set(true);
    const ids = Array.from(this.selectedWorkspaceIds());
    if (!ids.length) return;

    let completed = 0;
    let deletedCount = 0;
    const finish = () => {
      completed++;
      if (completed !== ids.length) return;

      if (deletedCount > 0) {
        this.toastService.success(
          `Moved ${deletedCount} ${deletedCount === 1 ? 'workspace' : 'workspaces'} to trash`
        );
      }
      this.clearSelection();
      this.bulkBusy.set(false);
      this.loadWorkspaces('', true);
    };

    ids.forEach((id) => {
      const workspace = this.workspaces().find((w) => idOf(w) === id);
      this.workspaceApi
        .delete(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.removeLocalWorkspace(id);
            if (workspace) {
              this.syncCountsAfterDelete(workspace);
            }
            deletedCount++;
            finish();
          },
          error: error => {
            this.toastService.error(extractErrorMessage(error, 'Workspace action failed. Refresh and try again.'));
            finish();
          },
        });
    });
  }

  loadWorkspaces(savedId = '', force = false): void {
    if (this.loading() && !force) return;

    this.loadSubscription?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.clearSelection();

    const query = this.buildListQuery();
    this.requestedQuery = JSON.stringify(query);

    this.loadSubscription = this.workspaceApi
      .getAllWorkspaces(query)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.loadSubscription = null;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          const list = extractList<any>(response)
            .filter(item => item.access?.isOwner === true || !item.access?.membership?.status || item.access.membership.status === 'ACTIVE')
            .map((item) =>
            this.prepareWorkspace(item)
          );
          this.workspaces.set(list);
          const deleteTarget = this.deleteTarget();
          if (deleteTarget && !this.can(deleteTarget, 'canTrash')) this.deleteTarget.set(null);
          const renameTarget = list.find(item => idOf(item) === this.inlineRenameId());
          if (this.inlineRenameId() && !this.can(renameTarget ?? null, 'canEdit')) this.cancelInlineRename();
          this.workspaceStore.setWorkspaces(list as any);

          this.updatePaginationAndCounts(response, list);

          if (savedId) {
            this.workspaceStore.select(savedId);
          }
        },
        error: (error: any) => {
          if (error?.status === 401 || error?.status === 403) this.workspaces.set([]);
          const message = extractErrorMessage(error, WORKSPACE_MESSAGES.ERROR.LOAD_FAILED);
          this.error.set(message);
          this.toastService.error(message, {
            title: 'Failed to load workspaces',
            dedupeKey: 'workspace-load-error',
          });
        },
      });
  }

  onSearch(value: any): void {
    const val = String(value ?? '');
    this.searchTerm.set(val);
    this.searchSubject.next(val.trim());
  }

  onClearSearch(): void {
    this.onSearch('');
  }

  onStatusChange(value: any): void {
    const val = String(value ?? '').toLowerCase() as WorkspaceCombinedFilter;
    if (['all', 'owned', 'shared', 'active', 'archived'].includes(val)) {
      this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.WORKSPACE_STATUS_FILTER, val.toUpperCase());
      this.activeFilter.set(val);
      if (val === 'owned') {
        this.accessFilter.set('OWNED');
      } else if (val === 'shared') {
        this.accessFilter.set('SHARED');
      } else {
        this.accessFilter.set('ALL');
      }
      this.page.set(1);
      this.loadWorkspaces('', true);
    }
  }

  onSortChange(value: any): void {
    if (value !== this.sortBy() && Object.prototype.hasOwnProperty.call(WORKSPACE_SORT_PREFERENCES, value)) {
      this.userPreferenceStore.setAndSave(
        USER_PREFERENCE_KEYS.WORKSPACE_SORT_ORDER,
        WORKSPACE_SORT_PREFERENCES[value as keyof typeof WORKSPACE_SORT_PREFERENCES],
      );
      this.page.set(1);
      this.loadWorkspaces('', true);
    }
  }

  onViewChange(value: any): void {
    if (value === 'grid' || value === 'list') {
      this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.WORKSPACE_VIEW, value.toUpperCase());
    }
  }

  setWorkspaceTab(value: any): void {
    this.setWorkspaceFilter(value);
  }

  setWorkspaceView(value: any): void {
    this.onViewChange(value);
  }

  updateSearch(value: any): void {
    this.onSearch(value);
  }

  clearSearch(): void {
    this.onClearSearch();
  }

  setSort(value: any): void {
    this.onSortChange(value);
  }

  goToPage(page: number): void {
    if (page < 1 || page === this.page()) return;
    this.page.set(page);
    this.loadWorkspaces('', true);
  }

  nextPage(): void {
    const max = this.pagination()?.totalPages ?? 1;
    if (this.page() < max) {
      this.goToPage(this.page() + 1);
    }
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.goToPage(this.page() - 1);
    }
  }

  openWorkspaceTrash(): void {
    this.router.navigate(routeCommands(APP_ROUTES.WORKSPACE_TRASH));
  }

  openStickyNoteTrash(): void {
    const workspaceId = this.workspaceStore.selectedId();
    this.router.navigate(routeCommands(APP_ROUTES.TRASH), {
      queryParams: workspaceId ? { workspaceId } : undefined,
    });
  }

  openTrash(): void {
    this.openWorkspaceTrash();
  }

  openCreateEditor(): void {
    this.workspaceEditorId.set('');
    this.workspaceEditorOpen.set(true);
  }

  openEditEditor(workspace: any, event?: Event): void {
    if (!this.can(workspace, 'canEdit')) return;
    event?.stopPropagation();
    const id = idOf(workspace);
    if (!id || this.isBusy(workspace)) return;

    this.workspaceEditorId.set(id);
    this.workspaceEditorOpen.set(true);
  }

  closeWorkspaceEditor(): void {
    this.workspaceEditorOpen.set(false);
    this.workspaceEditorId.set('');
  }

  onWorkspaceSaved(savedWorkspace: any): void {
    if (!savedWorkspace) {
      this.closeWorkspaceEditor();
      return;
    }

    const savedId = idOf(savedWorkspace);
    if (!this.workspaceEditorId()) {
      this.activeFilter.set('owned');
      this.accessFilter.set('OWNED');
      this.page.set(1);
    }
    this.closeWorkspaceEditor();
    this.loadWorkspaces(savedId, true);
  }

  handleWorkspaceClick(workspace: any, event?: MouseEvent): void {
    if (!this.can(workspace, 'canView')) return;
    const target = event?.target as HTMLElement | null;
    if (target?.closest('button, input, a, .mat-mdc-menu-panel, .mat-mdc-menu-item')) return;
    if (this.isInlineRenaming(workspace) || this.isBusy(workspace)) return;

    const id = idOf(workspace);
    if (!id) return;

    this.workspaceStore.select(id);
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID, id);
  }

  handleWorkspaceDoubleClick(workspace: any, event?: MouseEvent): void {
    const target = event?.target as HTMLElement | null;
    if (target?.closest('button, input, a, .mat-mdc-menu-panel, .mat-mdc-menu-item')) return;

    this.beginInlineRename(workspace, event);
  }

  openWorkspace(workspace: any): void {
    if (!this.can(workspace, 'canView')) return;
    const id = idOf(workspace);
    if (!id || this.isBusy(workspace)) return;

    this.workspaceStore.select(id);
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID, id);
    this.router.navigate(routeCommands(APP_ROUTES.WORKSPACE_FOLDERS));
  }

  beginInlineRename(workspace: any, event?: Event): void {
    if (!this.can(workspace, 'canEdit')) return;
    event?.stopPropagation();
    if (this.isBusy(workspace)) return;

    this.inlineRenameId.set(idOf(workspace));
    this.inlineRenameName.set(this.workspaceName(workspace));
    this.inlineRenameError.set(null);

    timer(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const input = this.renameInput()?.nativeElement;
        if (input) {
          input.focus();
          const len = input.value.length;
          input.setSelectionRange(len, len);
        }
      });
  }

  updateInlineRename(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.inlineRenameName.set(input.value);
    if (this.inlineRenameError()) {
      this.inlineRenameError.set(null);
    }
  }

  cancelInlineRename(event?: Event): void {
    event?.stopPropagation();
    this.inlineRenameId.set(null);
    this.inlineRenameName.set('');
    this.inlineRenameError.set(null);
    this.inlineRenameSubmitting.set(false);
  }

  onInlineRenameBlur(workspace: any): void {
    const trimmed = this.inlineRenameName().trim();
    const original = this.workspaceName(workspace);
    if (!trimmed || trimmed === original) {
      this.cancelInlineRename();
      return;
    }
    this.saveInlineRename(workspace, undefined, true);
  }

  saveInlineRename(workspace: any, event?: Event, isBlur = false): void {
    if (!this.can(workspace, 'canEdit')) return;
    event?.stopPropagation();
    const id = idOf(workspace);
    if (!id || this.inlineRenameId() !== id) return;
    if (this.inlineRenameSubmitting()) return;

    const trimmed = this.inlineRenameName().trim();
    const original = this.workspaceName(workspace);

    if (!trimmed) {
      if (isBlur) {
        this.cancelInlineRename();
      } else {
        this.inlineRenameError.set('Workspace name cannot be empty');
      }
      return;
    }

    if (trimmed === original) {
      this.cancelInlineRename();
      return;
    }

    this.inlineRenameSubmitting.set(true);
    this.inlineRenameError.set(null);

    this.workspaceApi
      .update(id, { name: trimmed })
      .pipe(
        finalize(() => this.inlineRenameSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          const updated = response?.data || { ...workspace, name: trimmed };
          this.cancelInlineRename();

          this.updateLocalWorkspace(id, {
            ...updated,
            name: trimmed,
            updatedAt: updated?.updatedAt ?? new Date().toISOString(),
          });
          this.workspaceStore.updateWorkspace(id, { name: trimmed });

          this.toastService.success(WORKSPACE_MESSAGES.SUCCESS.RENAMED, {
            title: 'Workspace updated',
            dedupeKey: `workspace-rename-${id}`,
          });
        },
        error: (error: any) => {
          if (isBlur) {
            this.cancelInlineRename();
          }
          if (error?.status === 401 || error?.status === 403) {
            this.updateLocalWorkspace(id, { allowedActions: {} });
            this.loadWorkspaces('', true);
          }
          const message = extractErrorMessage(error, WORKSPACE_MESSAGES.ERROR.RENAME_FAILED);
          if (!isBlur) {
            this.inlineRenameError.set(message);
          }
          this.toastService.error(message, {
            title: 'Rename failed',
            dedupeKey: 'workspace-rename-error',
          });
        },
      });
  }

  archiveWorkspace(workspace: any): void {
    this.updateWorkspaceStatus(workspace, 'ARCHIVED');
  }

  activateWorkspace(workspace: any): void {
    this.updateWorkspaceStatus(workspace, 'ACTIVE');
  }

  moveToTrash(workspace: any): void {
    const id = idOf(workspace);
    if (!id || this.isBusy(workspace) || !this.can(workspace, 'canTrash')) return;

    this.setBusy(id, true);
    this.workspaceApi
      .delete(id)
      .pipe(
        finalize(() => this.setBusy(id, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.removeLocalWorkspace(id);
          this.syncCountsAfterDelete(workspace);

          this.toastService.success(WORKSPACE_MESSAGES.SUCCESS.MOVED_TO_TRASH(this.workspaceName(workspace)), {
            title: 'Workspace moved to trash',
            dedupeKey: `workspace-delete-${id}`,
          });

          if (this.workspaces().length === 0 && this.page() > 1) this.page.update(p => p - 1);
          this.loadWorkspaces('', true);
        },
        error: (error: any) => {
          if (error?.status === 401 || error?.status === 403) {
            this.updateLocalWorkspace(id, { allowedActions: {} });
            this.loadWorkspaces('', true);
          }
          const message = extractErrorMessage(error, WORKSPACE_MESSAGES.ERROR.MOVE_TO_TRASH_FAILED);
          this.toastService.error(message, {
            title: 'Could not move workspace',
            dedupeKey: 'workspace-delete-error',
          });
        },
      });
  }

  requestDelete(workspace: any): void {
    if (!this.can(workspace, 'canTrash')) return;
    if (this.isBusy(workspace)) return;
    this.deleteTarget.set(workspace);
  }

  closeDeleteDialog(): void {
    if (this.deleting()) return;
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const workspace = this.deleteTarget();
    const id = idOf(workspace);
    if (!id || this.deleting() || !this.can(workspace, 'canTrash')) return;

    this.deleting.set(true);
    this.setBusy(id, true);

    this.workspaceApi
      .delete(id)
      .pipe(
        finalize(() => {
          this.deleting.set(false);
          this.setBusy(id, false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.removeLocalWorkspace(id);
          this.syncCountsAfterDelete(workspace);

          this.toastService.success(WORKSPACE_MESSAGES.SUCCESS.MOVED_TO_TRASH(this.workspaceName(workspace)), {
            title: 'Workspace moved to trash',
            dedupeKey: `workspace-delete-${id}`,
          });

          if (this.workspaces().length === 0 && this.page() > 1) this.page.update(p => p - 1);
          this.loadWorkspaces('', true);
        },
        error: (error: any) => {
          if (error?.status === 401 || error?.status === 403) {
            this.updateLocalWorkspace(id, { allowedActions: {} });
            this.loadWorkspaces('', true);
          }
          const message = extractErrorMessage(error, WORKSPACE_MESSAGES.ERROR.MOVE_TO_TRASH_FAILED);
          this.toastService.error(message, {
            title: 'Could not move workspace',
            dedupeKey: 'workspace-delete-error',
          });
        },
      });
  }

  workspaceId(workspace: any): string {
    return idOf(workspace);
  }

  workspaceName(workspace: any): string {
    return entityNameOf(workspace, 'Untitled workspace');
  }

  workspaceDescription(workspace: any): string {
    const description = String(workspace?.description ?? '').trim();
    if (description) return description;
    return workspace?.isPersonal ? 'Your personal workspace' : 'Shared team workspace';
  }

  workspaceVisibility(workspace: any): string {
    const value = String(workspace?.visibility ?? 'PRIVATE').toLowerCase().replaceAll('_', ' ');
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  isPersonalWorkspace(workspace: any): boolean {
    return workspace?.workspaceType ? workspace.workspaceType === 'PERSONAL' : workspace?.isPersonal === true;
  }

  workspaceTypeLabel(workspace: any): string {
    return workspace?.workspaceTypeLabel || (this.isPersonalWorkspace(workspace) ? 'Personal' : 'Team');
  }

  workspaceRoleLabel(workspace: any): string {
    if (workspace?.role) return workspace.role;
    const access = workspace?.access;
    if (access?.label) return access.label;
    let role = 'MEMBER';

    if (access && typeof access === 'object') {
      role = access?.isOwner ? 'OWNER' : String(access?.type ?? access?.role ?? 'MEMBER');
    } else if (workspace?.isOwner) {
      role = 'OWNER';
    } else if (workspace?.accessRole) {
      role = String(workspace.accessRole);
    }

    const normalized = role.toLowerCase().replaceAll('_', ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  workspaceFolderCount(workspace: any): number {
    if (typeof workspace?._folderCount === 'number') return workspace._folderCount;
    const value =
      workspace?.summary?.folderCount ??
      workspace?.folderCount ??
      workspace?.foldersCount ??
      (Array.isArray(workspace?.folders) ? workspace.folders.length : 0);
    const count = Number(value);
    return Number.isFinite(count) && count > 0 ? count : 0;
  }

  folderCountLabel(workspace: any): string {
    if (workspace?._folderCountLabel) return workspace._folderCountLabel;
    const count = this.workspaceFolderCount(workspace);
    return `${count} ${count === 1 ? 'folder' : 'folders'}`;
  }

  workspaceMemberCount(workspace: any, membersList?: any[]): number {
    if (typeof workspace?._memberCount === 'number') return workspace._memberCount;
    const raw = workspace?.summary?.memberCount ?? workspace?.memberCount;
    if (raw !== undefined && raw !== null && Number.isFinite(Number(raw))) {
      return Math.max(0, Number(raw));
    }
    const members = membersList ?? this.workspaceMembers(workspace);
    return members.length;
  }

  workspaceMembers(workspace: any): any[] {
    if (workspace?._members) return workspace._members;

    const source = Array.isArray(workspace?.summary?.members)
      ? workspace.summary.members
      : Array.isArray(workspace?.members)
        ? workspace.members
        : [];

    const mapped = source
      .map((member: any) => {
        const id = member?.id || getWorkspaceMemberId(member);
        const name = String(member?.displayName ?? getWorkspaceMemberName(member));
        const role = member?.role ? String(member.role) : getWorkspaceMemberRole(member);
        const src = member?.avatar ?? member?.avatarUrl ?? getWorkspaceMemberAvatar(member);

        return {
          id,
          name,
          src,
          alt: name,
          tooltip: role ? `${name} · ${role}` : name,
        };
      })
      .filter((member: any) => !!member.id);

    if (mapped.length > 0) return mapped;

    if (workspace?.ownerId && typeof workspace.ownerId === 'object') {
      const owner = workspace.ownerId;
      const name = getWorkspaceMemberName({ user: owner }, 'Owner');
      const src = getWorkspaceMemberAvatar({ user: owner });
      const id = idOf(owner) || `${idOf(workspace)}-owner`;

      return [
        {
          id,
          name,
          src,
          alt: name,
          tooltip: `${name} · Owner`,
        },
      ];
    }

    return [];
  }

  workspaceStatusLabel(workspace: any): string {
    if (workspace?._statusLabel) return workspace._statusLabel;
    const status = String(workspace?.status ?? 'ACTIVE');
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  visibilityIcon(workspace: any) {
    return this.workspaceVisibility(workspace) === 'Public' ? LucideGlobe : LucideLock;
  }

  prepareWorkspace(workspace: any): any {
    const members = this.workspaceMembers(workspace);
    const folderCount = this.workspaceFolderCount(workspace);
    const memberCount = this.workspaceMemberCount(workspace, members);

    return {
      ...workspace,
      _members: members,
      _folderCount: folderCount,
      _folderCountLabel: `${folderCount} ${folderCount === 1 ? 'folder' : 'folders'}`,
      _memberCount: memberCount,
      _memberCountLabel: `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`,
      _roleLabel: this.workspaceRoleLabel(workspace),
      _visibility: this.workspaceVisibility(workspace),
      _statusLabel: this.workspaceStatusLabel(workspace),
    };
  }

  workspaceTheme(workspace: any): any {
    const themes: any[] = [
      { variant: 'noteYellow', icon: LucideLightbulb },
      { variant: 'noteBlue', icon: LucideFolder },
      { variant: 'notePink', icon: LucideMegaphone },
      { variant: 'noteGreen', icon: LucideUsers },
      { variant: 'notePurple', icon: LucideFolder },
      { variant: 'noteOrange', icon: LucideLightbulb },
    ];

    const name = this.workspaceName(workspace);
    const score = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
    return themes[score % themes.length];
  }

  isActive(workspace: any): boolean {
    return workspace?.status === 'ACTIVE';
  }

  isArchived(workspace: any): boolean {
    return workspace?.status === 'ARCHIVED';
  }

  isBusy(workspace: any): boolean {
    const id = idOf(workspace);
    return this.bulkBusy() || (!!id && this.busyIds().has(id));
  }

  isInlineRenaming(workspace: any): boolean {
    return this.inlineRenameId() === idOf(workspace);
  }

  private initSearchPipeline(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (this.requestedQuery === JSON.stringify({ ...this.buildListQuery(), page: 1 })) return;
        this.page.set(1);
        this.loadWorkspaces('', true);
      });
  }

  private buildListQuery(): any {
    const filter = this.activeFilter();
    let access: WorkspaceAccessFilter = this.accessFilter();
    let status: 'ALL' | 'ACTIVE' | 'ARCHIVED' = 'ALL';

    if (filter === 'active') {
      status = 'ACTIVE';
      access = 'ALL';
    } else if (filter === 'archived') {
      status = 'ARCHIVED';
      access = 'ALL';
    } else if (filter === 'owned') {
      access = 'OWNED';
      status = this.activeTab() === 'archived' ? 'ARCHIVED' : this.activeTab() === 'active' ? 'ACTIVE' : 'ALL';
    } else if (filter === 'shared') {
      access = 'SHARED';
      status = this.activeTab() === 'archived' ? 'ARCHIVED' : this.activeTab() === 'active' ? 'ACTIVE' : 'ALL';
    } else {
      access = this.accessFilter();
      const tab = this.activeTab();
      status = tab === 'active' ? 'ACTIVE' : tab === 'archived' ? 'ARCHIVED' : 'ALL';
    }

    const query: any = {
      access,
      page: this.page(),
      limit: this.limit(),
      status,
      sortBy: WORKSPACE_SORT_PREFERENCES[this.sortBy()] ?? 'RECENTLY_UPDATED',
    };

    const trimmed = this.searchTerm().trim();
    if (trimmed) {
      query.search = trimmed;
    }

    return query;
  }

  private updatePaginationAndCounts(response: any, list: any[]): void {
    const meta = response?.meta ?? response?.pagination ?? response?.data?.pagination;
    const total = Number(meta?.total ?? list.length);
    const page = Number(meta?.page ?? this.page());
    const limit = Number(meta?.limit ?? this.limit());
    const totalPages = Number(meta?.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 0));

    this.pagination.set({ page, limit, total, totalPages });

    const metadata: any = meta;
    this.counts.set(metadata?.counts ?? {});
    this.accessFilters.set(WORKSPACE_ACCESS_FILTERS.map(fallback => {
      const option = metadata?.accessFilters?.find((item: any) => item.value === fallback.value);
      return { ...fallback, ...option };
    }));
  }

  private updateWorkspaceStatus(workspace: any, status: 'ACTIVE' | 'ARCHIVED'): void {
    if (!this.can(workspace, 'canArchive') || workspace.status === status) return;
    const id = idOf(workspace);
    if (!id || this.isBusy(workspace)) return;

    this.setBusy(id, true);

    this.workspaceApi
      .updateStatus(id, status)
      .pipe(
        finalize(() => this.setBusy(id, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          const updated = response?.data || { ...workspace, status };
          this.updateLocalWorkspace(id, { ...updated, status });
          this.workspaceStore.updateWorkspace(id, { status });
          this.syncCountsAfterStatusChange(status);
          this.loadWorkspaces('', true);

          const isArchived = status === 'ARCHIVED';
          this.toastService.success(
            isArchived
              ? WORKSPACE_MESSAGES.SUCCESS.ARCHIVED(this.workspaceName(workspace))
              : WORKSPACE_MESSAGES.SUCCESS.ACTIVATED(this.workspaceName(workspace)),
            {
              title: isArchived ? 'Workspace archived' : 'Workspace restored',
              dedupeKey: `workspace-status-${id}`,
            }
          );
        },
        error: (error: any) => {
          if (error?.status === 401 || error?.status === 403) {
            this.updateLocalWorkspace(id, { allowedActions: {} });
            this.loadWorkspaces('', true);
          }
          const message = extractErrorMessage(error, WORKSPACE_MESSAGES.ERROR.STATUS_UPDATE_FAILED);
          this.toastService.error(message, {
            title: 'Status update failed',
            dedupeKey: 'workspace-status-error',
          });
        },
      });
  }

  private syncCountsAfterStatusChange(nextStatus: 'ACTIVE' | 'ARCHIVED'): void {
    this.counts.update((c: any) => {
      if (nextStatus === 'ARCHIVED') {
        return { ...c, active: Math.max(0, (c?.active ?? 0) - 1), archived: (c?.archived ?? 0) + 1 };
      }
      return { ...c, active: (c?.active ?? 0) + 1, archived: Math.max(0, (c?.archived ?? 0) - 1) };
    });
  }

  private syncCountsAfterDelete(workspace: any): void {
    const isAct = this.isActive(workspace);
    this.counts.update((c: any) => ({
      all: Math.max(0, (c?.all ?? 0) - 1),
      active: isAct ? Math.max(0, (c?.active ?? 0) - 1) : (c?.active ?? 0),
      archived: !isAct ? Math.max(0, (c?.archived ?? 0) - 1) : (c?.archived ?? 0),
    }));
    this.pagination.update((p: any) => ({
      ...p,
      total: Math.max(0, (p?.total ?? 0) - 1),
      totalPages: (p?.limit ?? 0) > 0 ? Math.ceil(Math.max(0, (p?.total ?? 0) - 1) / p.limit) : 0,
    }));
  }

  private updateLocalWorkspace(id: string, changes: Record<string, unknown>): void {
    this.workspaces.update((items) =>
      items.map((item) => (idOf(item) === id ? this.prepareWorkspace({ ...item, ...changes }) : item))
    );
  }

  private removeLocalWorkspace(id: string): void {
    this.workspaces.update((items) => items.filter((item) => idOf(item) !== id));
    this.workspaceStore.remove(id);
  }

  private setBusy(id: string, busy: boolean): void {
    const next = new Set(this.busyIds());
    busy ? next.add(id) : next.delete(id);
    this.busyIds.set(next);
  }

  private workspaceTimestamp(workspace: any, created = false): number {
    const value = created ? workspace?.createdAt : workspace?.updatedAt ?? workspace?.createdAt;
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
}
