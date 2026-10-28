import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { idOf } from '../../../shared/functions/common.function';
import { extractErrorMessage } from '../../../shared/functions/api.functions';
import type { PaginationMeta as Pagination } from '../../../shared/interfaces/api.interface';
import type { WorkspaceFolder } from '../interfaces/workspace-folder.interface';
import { WorkspaceFolderService } from './workspace-folder.service';
import { WorkspaceDropdownStore } from '../../workspace/services/workspace-dropdown.store';

@Injectable({ providedIn: 'root' })
export class WorkspaceFolderStore {
  private loadSubscription?: Subscription;
  private readonly workspaceFolderService = inject(WorkspaceFolderService);
  private readonly workspaceDropdownStore = inject(WorkspaceDropdownStore);

  private readonly _folders = signal<readonly WorkspaceFolder[]>([]);
  private readonly _workspaceId = signal<string | null>(null);
  private readonly _selectedId = signal<string | null>(null);
  private readonly _pagination = signal<Pagination | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _loaded = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly folders = this._folders.asReadonly();
  readonly workspaceId = this._workspaceId.asReadonly();
  readonly selectedId = this._selectedId.asReadonly();
  readonly selectedFolderId = computed(() => this._selectedId() ?? '');
  readonly pagination = this._pagination.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly initialized = this._loaded.asReadonly();
  readonly error = this._error.asReadonly();

  readonly selectedFolder = computed(() => {
    const selectedId = this._selectedId();
    return selectedId ? (this._folders().find((folder) => folder.id === selectedId) ?? null) : null;
  });

  readonly defaultFolder = computed(
    () => this._folders().find((folder) => folder.isDefault) ?? null,
  );

  readonly activeFolders = computed(() =>
    this._folders().filter((folder) => folder.status === 'ACTIVE'),
  );

  readonly hasFolders = computed(() => this._folders().length > 0);
  readonly hasActiveFolders = computed(() => this.activeFolders().length > 0);
  readonly folderCount = computed(() => this._folders().length);

  load(workspaceId: string, force = false): void {
    const id = (workspaceId || this._workspaceId() || '').trim();
    if (!id) {
      return;
    }

    if (this._loaded() && this._workspaceId() === id && !force) {
      return;
    }

    if (this._loading() && this._workspaceId() === id && !force) return;
    this.loadSubscription?.unsubscribe();
    this.resetForWorkspace(id);
    this._loading.set(true);
    this._error.set(null);

    this.loadSubscription = this.workspaceFolderService
      .getFolderOptions(id, force)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (folders) => {
          if (this._workspaceId() === id) this.setFolders(id, folders);
        },
        error: (error) => {
          if (this._workspaceId() !== id) return;
          this._folders.set([]);
          this._selectedId.set(null);
          this._error.set(extractErrorMessage(error, 'Failed to load workspace folders'));
        },
      });
  }
  select(id: string | null): void {
    if (!id) {
      this._selectedId.set(null);
      return;
    }

    const exists = this._folders().some((folder) => folder.id === id && folder.status === 'ACTIVE');

    if (!exists) {
      return;
    }

    this._selectedId.set(id);
  }

  selectFirst(): void {
    const folder = this._folders().find((folder) => folder.status === 'ACTIVE');
    this._selectedId.set(folder?.id ?? null);
  }

  selectDefault(): void {
    const defaultFolder = this.defaultFolder();
    if (defaultFolder) {
      this._selectedId.set(defaultFolder.id);
    } else {
      this.selectFirst();
    }
  }

  upsert(folder: WorkspaceFolder): void {
    this.workspaceDropdownStore.updateFolder(idOf(folder.workspaceId), folder);
    if (idOf(folder.workspaceId) !== this._workspaceId()) {
      this.workspaceDropdownStore.refresh().subscribe();
      return;
    }
    if (folder.status === 'DELETED') {
      this.remove(folder.id);
      return;
    }
    this._folders.update((current) => {
      const index = current.findIndex((item) => item.id === folder.id);

      if (index < 0) {
        return [folder, ...current];
      }

      const next = [...current];
      next[index] = folder;
      return next;
    });

    this.ensureSelectedFolder();

    // Refresh dropdown store so all workspace+folder selects pick up the change
    this.workspaceDropdownStore.refresh().subscribe();
  }

  updateFolder(id: string, values: Partial<WorkspaceFolder>): void {
    const folder = this._folders().find((item) => item.id === id);
    if (folder) this.workspaceDropdownStore.updateFolder(idOf(folder.workspaceId), { ...folder, ...values });
    this._folders.update((current) =>
      current.map((folder) =>
        folder.id === id
          ? {
              ...folder,
              ...values,
            }
          : folder,
      ),
    );

    this.ensureSelectedFolder();
    // Re-fetch dropdown so folder name/status changes appear in all selects
    this.workspaceDropdownStore.refresh().subscribe();
  }

  remove(id: string): void {
    this.workspaceDropdownStore.removeFolder(id);
    this._folders.update((current) => current.filter((item) => item.id !== id));

    if (this._selectedId() === id) {
      this.ensureSelectedFolder();
    }

    // Re-fetch dropdown so removed folder disappears from all selects
    this.workspaceDropdownStore.refresh().subscribe();
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
    if (loading) {
      this._error.set(null);
    }
  }

  setFolders(
    workspaceId: string,
    folders: readonly WorkspaceFolder[],
    pagination: Pagination | null = null,
  ): void {
    this._workspaceId.set(workspaceId);
    this._folders.set([...folders]);
    this._pagination.set(pagination);
    this._loaded.set(true);
    this._loading.set(false);
    this._error.set(null);

    this.ensureSelectedFolder();
  }

  setPagination(pagination: Pagination | null): void {
    this._pagination.set(pagination);
  }

  setSaving(saving: boolean): void {
    this._saving.set(saving);
  }

  setError(message: string): void {
    this._error.set(message);
    this._loading.set(false);
    this._loaded.set(true);
  }

  clearError(): void {
    this._error.set(null);
  }

  resetForWorkspace(workspaceId: string): void {
    if (this._workspaceId() === workspaceId) {
      return;
    }

    this.loadSubscription?.unsubscribe();
    this._workspaceId.set(workspaceId);
    this._folders.set([]);
    this._selectedId.set(null);
    this._loading.set(false);
    this._saving.set(false);
    this._loaded.set(false);
    this._error.set(null);
    this._pagination.set(null);
  }

  refresh(workspaceId?: string): void {
    this.load(workspaceId || this._workspaceId() || '', true);
  }

  clear(): void {
    this.reset();
  }

  reset(): void {
    this.loadSubscription?.unsubscribe();
    this._folders.set([]);
    this._workspaceId.set(null);
    this._selectedId.set(null);
    this._loading.set(false);
    this._saving.set(false);
    this._loaded.set(false);
    this._error.set(null);
    this._pagination.set(null);
  }

  private ensureSelectedFolder(): void {
    const folders = this._folders();
    const selectedId = this._selectedId();

    if (!folders.length) {
      this._selectedId.set(null);
      return;
    }

    if (
      selectedId &&
      folders.some((folder) => folder.id === selectedId && folder.status === 'ACTIVE')
    ) {
      return;
    }

    const preferred =
      folders.find((folder) => folder.status === 'ACTIVE' && folder.isDefault) ??
      folders.find((folder) => folder.status === 'ACTIVE') ??
      null;

    this._selectedId.set(preferred?.id ?? null);
  }
}
