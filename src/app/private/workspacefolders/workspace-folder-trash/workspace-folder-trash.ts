import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  expand,
  finalize,
  reduce,
  switchMap,
  takeUntil,
  throwError,
} from 'rxjs';
import {
  LucideArchiveRestore,
  LucideArrowLeft,
  LucideClock3,
  LucideFolder,
  LucideGrid2X2,
  LucideList,
  LucideRefreshCw,
  LucideSearch,
  LucideTrash2,
  LucideX,
  LucidePanelsTopLeft,
  LucideArrowDownAZ,
} from '@lucide/angular';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { DeleteConfirmModal } from '../../../shared/components/delete-confirm-modal/delete-confirm-modal';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';
import { Loader } from '../../../shared/components/loader/loader';
import {
  Select,
  type SelectOption,
  type SelectValue,
} from '../../../shared/components/select/select';
import { Tabs, type TabItem, type TabValue } from '../../../shared/components/tabs/tabs';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { Tooltip } from '../../../shared/components/tooltip/tooltip';
import { UserDatePipe } from '../../../shared/pipes/user-date.pipe';
import { APP_ROUTES, routeCommands } from '../../../shared/constants/route.constants';
import { extractErrorMessage, idOf } from '../../../shared/functions/common.function';
import { canWorkspaceAction } from '../../../shared/functions/workspace-access.function';
import {
  canFolderAction,
  type FolderAction,
  type FolderWorkspaceAccess,
} from '../../../shared/functions/workspace-folder-access.function';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { WorkspaceFolderService } from '../services/workspace-folder.service';
import { WorkspaceFolderStore } from '../services/workspace-folder.store';
import type {
  WorkspaceFolder,
  WorkspaceFolderQuery,
} from '../interfaces/workspace-folder.interface';

@Component({
  selector: 'app-workspace-folder-trash',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    DeleteConfirmModal,
    Loader,
    Select,
    Tabs,
    Tooltip,
    UserDatePipe,
  ],
  templateUrl: './workspace-folder-trash.html',
  styleUrl: './workspace-folder-trash.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceFolderTrash implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly workspaceApi = inject(WorkspaceService);
  private readonly folderApi = inject(WorkspaceFolderService);
  readonly workspaceStore = inject(WorkspaceStore);
  private readonly folderStore = inject(WorkspaceFolderStore);
  private readonly toast = inject(ToastService);
  private loadSubscription?: Subscription;
  private readonly workspaceEnd = new Subject<void>();
  private readonly access = signal<FolderWorkspaceAccess | null>(null);

  readonly LucideArchiveRestore = LucideArchiveRestore;
  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideClock3 = LucideClock3;
  readonly LucideFolder = LucideFolder;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideSearch = LucideSearch;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideX = LucideX;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly folders = signal<WorkspaceFolder[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly view = signal<'grid' | 'list'>('grid');
  readonly sortBy = signal<'deletedAt' | 'purgeAfter' | 'name'>('deletedAt');
  readonly actionId = signal<string | null>(null);
  readonly permanentTarget = signal<WorkspaceFolder | null>(null);
  readonly selectedWorkspaceId = this.workspaceStore.selectedId;
  readonly workspaceOptions = computed<readonly SelectOption[]>(() =>
    this.workspaceStore.workspaces().map((workspace) => ({
      label: workspace.name || 'Untitled workspace',
      value: idOf(workspace),
      icon: LucidePanelsTopLeft,
    })),
  );
  readonly totalCount = computed(() => this.folders().length);
  readonly sortOptions: readonly SelectOption[] = [
    { label: 'Recently deleted', value: 'deletedAt', icon: LucideTrash2 },
    { label: 'Deletes soonest', value: 'purgeAfter', icon: LucideClock3 },
    { label: 'Name A–Z', value: 'name', icon: LucideArrowDownAZ },
  ];
  readonly viewTabs: readonly TabItem[] = [
    { value: 'grid', label: 'Grid', icon: LucideGrid2X2 },
    { value: 'list', label: 'List', icon: LucideList },
  ];
  readonly visibleFolders = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();
    return this.folders()
      .filter((folder) =>
        `${folder.name} ${folder.description ?? ''} ${folder.slug ?? ''}`
          .toLowerCase()
          .includes(term),
      )
      .sort((a, b) =>
        sort === 'name'
          ? a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          : sort === 'purgeAfter'
            ? (this.timestamp(a.purgeAfter) || Infinity) -
              (this.timestamp(b.purgeAfter) || Infinity)
            : this.timestamp(b.deletedAt || b.updatedAt) -
              this.timestamp(a.deletedAt || a.updatedAt),
      );
  });

  constructor() {
    effect(() => {
      const workspaceId = this.selectedWorkspaceId();
      untracked(() => {
        this.workspaceEnd.next();
        this.permanentTarget.set(null);
        this.searchTerm.set('');
        this.loadTrash(workspaceId);
      });
    });
    this.destroyRef.onDestroy(() => {
      this.workspaceEnd.next();
      this.workspaceEnd.complete();
    });
  }

  ngOnInit(): void {
    this.workspaceStore.load();
  }

  changeWorkspace(value: SelectValue | SelectValue[] | null): void {
    if (typeof value === 'string') this.workspaceStore.select(value);
  }

  refresh(): void {
    if (this.actionId()) return;
    if (this.workspaceStore.error()) this.workspaceStore.load(true);
    else this.loadTrash();
  }

  loadTrash(workspaceId = this.selectedWorkspaceId()): void {
    this.loadSubscription?.unsubscribe();
    this.folders.set([]);
    this.access.set(null);
    this.error.set(null);
    this.loading.set(false);
    if (!workspaceId) return;
    this.loading.set(true);
    const query: WorkspaceFolderQuery = { workspaceId, status: 'DELETED', page: 1, limit: 100 };
    this.loadSubscription = this.workspaceApi
      .getById(workspaceId)
      .pipe(
        switchMap((response) => {
          const workspace = response.data;
          if (
            !canWorkspaceAction(workspace, 'canView') ||
            !['ACTIVE', 'ARCHIVED'].includes(workspace?.status)
          ) {
            return throwError(
              () => new Error('You no longer have permission to view this workspace.'),
            );
          }
          this.access.set(workspace);
          return this.folderApi.getAllWorkspaceFolders(query).pipe(
            expand((page) => {
              const meta = page.meta ?? page.pagination;
              const lastPage = meta?.totalPages ?? (meta ? Math.ceil(meta.total / meta.limit) : 1);
              return meta && meta.page < lastPage
                ? this.folderApi.getAllWorkspaceFolders({ ...query, page: meta.page + 1 })
                : EMPTY;
            }),
            reduce((folders, page) => [...folders, ...page.data], [] as WorkspaceFolder[]),
          );
        }),
        takeUntil(this.workspaceEnd),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (folders) =>
          this.folders.set(folders.filter((folder) => folder.status === 'DELETED')),
        error: (error) => {
          this.access.set(null);
          this.error.set(extractErrorMessage(error, 'Could not load folder trash.'));
        },
      });
  }

  can(folder: WorkspaceFolder | null, action: FolderAction): boolean {
    const current = this.folders().find((item) => item.id === folder?.id);
    return !!current && !this.loading() && canFolderAction(this.access(), current, action);
  }

  restore(folder: WorkspaceFolder): void {
    if (this.actionId() || !this.can(folder, 'canRestore')) return;
    this.runAction(folder, false);
  }

  requestPermanentDelete(folder: WorkspaceFolder): void {
    if (!this.actionId() && this.can(folder, 'canPermanentlyDelete'))
      this.permanentTarget.set(folder);
  }

  closePermanentDelete(): void {
    if (!this.actionId()) this.permanentTarget.set(null);
  }

  confirmPermanentDelete(): void {
    const folder = this.permanentTarget();
    if (!folder || this.actionId() || !this.can(folder, 'canPermanentlyDelete')) return;
    this.runAction(folder, true);
  }

  private runAction(folder: WorkspaceFolder, permanent: boolean): void {
    const workspaceId = this.selectedWorkspaceId();
    this.actionId.set(folder.id);
    const request: Observable<unknown> = permanent
      ? this.folderApi.permanentlyDelete(folder.id)
      : this.folderApi.restore(folder.id);
    request
      .pipe(
        takeUntil(this.workspaceEnd),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.actionId.set(null)),
      )
      .subscribe({
        next: () => {
          this.folders.update((items) => items.filter((item) => item.id !== folder.id));
          this.permanentTarget.set(null);
          if (!permanent && workspaceId) this.folderStore.load(workspaceId, true);
          this.toast.success(permanent ? 'Folder permanently deleted.' : 'Folder restored.');
        },
        error: (error) => {
          if (error?.status === 401 || error?.status === 403) {
            this.permanentTarget.set(null);
            this.loadTrash();
          }
          this.toast.error(
            extractErrorMessage(
              error,
              permanent ? 'Could not permanently delete folder.' : 'Could not restore folder.',
            ),
          );
        },
      });
  }

  goBackToFolders(): void {
    this.router.navigate(routeCommands(APP_ROUTES.WORKSPACE_FOLDERS));
  }
  updateSearch(value: InputValue): void {
    this.searchTerm.set(String(value ?? ''));
  }
  clearSearch(): void {
    this.searchTerm.set('');
  }
  setSort(value: SelectValue | SelectValue[] | null): void {
    if (value === 'deletedAt' || value === 'purgeAfter' || value === 'name') this.sortBy.set(value);
  }
  setView(value: TabValue): void {
    if (value === 'grid' || value === 'list') this.view.set(value);
  }
  folderId(folder: WorkspaceFolder | null): string {
    return folder?.id ?? '';
  }
  folderName(folder: WorkspaceFolder | null): string {
    return folder?.name || 'Untitled folder';
  }
  folderDescription(folder: WorkspaceFolder): string {
    return folder.description ?? '';
  }
  daysRemaining(folder: WorkspaceFolder): number {
    const time = this.timestamp(folder.purgeAfter);
    return time ? Math.max(0, Math.ceil((time - Date.now()) / 86_400_000)) : Infinity;
  }
  purgeLabel(folder: WorkspaceFolder): string {
    const days = this.daysRemaining(folder);
    return !Number.isFinite(days)
      ? 'In trash'
      : days === 0
        ? 'Pending cleanup'
        : `${days} ${days === 1 ? 'day' : 'days'} left`;
  }
  isBusy(folder: WorkspaceFolder): boolean {
    return this.actionId() === folder.id;
  }
  private timestamp(value: string | null | undefined): number {
    const time = value ? Date.parse(value) : NaN;
    return Number.isFinite(time) ? time : 0;
  }
}
