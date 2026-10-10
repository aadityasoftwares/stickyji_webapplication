import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  LucideX
} from '@lucide/angular';

import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';
import { Loader } from '../../../shared/components/loader/loader';
import { Select, type SelectOption, type SelectValue } from '../../../shared/components/select/select';
import { Tabs, type TabItem, type TabValue } from '../../../shared/components/tabs/tabs';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { extractErrorMessage, idOf } from '../../../shared/functions/common.function';
import { APP_ROUTES, routeCommands } from '../../../shared/constants/route.constants';
import { WORKSPACE_MESSAGES } from '../messages/workspace.messages';
import { WorkspaceService } from '../services/workspace.service';
import { WorkspaceStore } from '../services/workspace.store';
import { UserDatePipe } from '../../../shared/pipes/user-date.pipe';

type TrashView = 'grid' | 'list';
type TrashSort = 'deletedAt' | 'name';

@Component({
  selector: 'app-workspace-trash',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Loader,
    Select,
    Tabs,
    UserDatePipe
  ],
  templateUrl: './workspace-trash.html',
  styleUrl: './workspace-trash.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceTrash implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly toastService = inject(ToastService);

  readonly LucideArchiveRestore = LucideArchiveRestore;
  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideClock3 = LucideClock3;
  readonly LucideFolder = LucideFolder;
  readonly LucideGrid2X2 = LucideGrid2X2;
  readonly LucideList = LucideList;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideSearch = LucideSearch;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideX = LucideX;

  readonly workspaces = signal<any[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly view = signal<TrashView>('grid');
  readonly sortBy = signal<TrashSort>('deletedAt');
  readonly actionId = signal<string | null>(null);

  readonly sortOptions: readonly SelectOption[] = [
    { label: 'Recently deleted', value: 'deletedAt' },
    { label: 'Name A–Z', value: 'name' }
  ];

  readonly viewTabs: readonly TabItem[] = [
    { value: 'grid', label: 'Grid', icon: LucideGrid2X2, ariaLabel: 'Show deleted workspaces in grid view' },
    { value: 'list', label: 'List', icon: LucideList, ariaLabel: 'Show deleted workspaces in list view' }
  ];

  readonly totalCount = computed(() => this.workspaces().length);

  readonly visibleWorkspaces = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();
    let list = this.workspaces();

    if (term) {
      list = list.filter((item: any) => {
        const name = this.workspaceName(item).toLowerCase();
        const desc = this.workspaceDescription(item).toLowerCase();
        return name.includes(term) || desc.includes(term);
      });
    }

    return [...list].sort((a: any, b: any) => {
      if (sort === 'name') {
        return this.workspaceName(a).localeCompare(this.workspaceName(b));
      }
      const timeA = this.timestamp(a?.deletedAt || a?.updatedAt || a?.createdAt);
      const timeB = this.timestamp(b?.deletedAt || b?.updatedAt || b?.createdAt);
      return timeB - timeA;
    });
  });

  ngOnInit(): void {
    this.loadTrash();
  }

  loadTrash(): void {
    this.loading.set(true);
    this.error.set(null);

    this.workspaceService
      .getMyWorkspaces({ status: 'DELETED' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const list = response?.data?.workspaces ?? response?.data?.items ?? response?.data ?? [];
          this.workspaces.set(Array.isArray(list) ? list : []);
          this.loading.set(false);
        },
        error: (error: any) => {
          this.workspaces.set([]);
          this.loading.set(false);
          this.error.set(extractErrorMessage(error, WORKSPACE_MESSAGES.ERROR.TRASH_LOAD_FAILED));
        }
      });
  }

  goBackToWorkspaces(): void {
    this.router.navigate(routeCommands(APP_ROUTES.WORKSPACES));
  }

  updateSearch(value: InputValue): void {
    this.searchTerm.set(String(value ?? ''));
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setSort(value: SelectValue | SelectValue[] | null): void {
    if (value === null || Array.isArray(value)) return;
    if (value === 'deletedAt' || value === 'name') {
      this.sortBy.set(value);
    }
  }

  setView(value: TabValue): void {
    if (value === 'grid' || value === 'list') {
      this.view.set(value);
    }
  }

  restore(workspace: any): void {
    const id = this.workspaceId(workspace);
    if (!id || this.actionId()) return;

    this.actionId.set(id);

    this.workspaceService
      .restore(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.workspaces.update((items: any[]) => items.filter((item: any) => this.workspaceId(item) !== id));
          this.actionId.set(null);
          this.workspaceStore.load(true);

          const name = this.workspaceName(workspace);
          this.toastService.success(WORKSPACE_MESSAGES.SUCCESS.RESTORED(name), {
            title: 'Workspace restored',
            dedupeKey: `restore-workspace-${id}`
          });
        },
        error: (error: any) => {
          this.actionId.set(null);
          this.toastService.error(extractErrorMessage(error, WORKSPACE_MESSAGES.ERROR.RESTORE_FAILED), {
            title: 'Restore failed',
            dedupeKey: `restore-workspace-${id}`
          });
        }
      });
  }

  workspaceId(workspace: any): string {
    return idOf(workspace) || String(workspace?._id ?? '');
  }

  workspaceName(workspace: any): string {
    return String(workspace?.name ?? '').trim() || 'Untitled workspace';
  }

  workspaceDescription(workspace: any): string {
    return String(workspace?.description ?? '').trim();
  }

  isBusy(workspace: any): boolean {
    return this.actionId() === this.workspaceId(workspace);
  }

  private timestamp(value: unknown): number {
    if (!value) return 0;
    const time = new Date(String(value)).getTime();
    return Number.isFinite(time) ? time : 0;
  }
}
