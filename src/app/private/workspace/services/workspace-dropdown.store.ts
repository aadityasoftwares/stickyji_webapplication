import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of } from 'rxjs';
import { WorkspaceService } from './workspace.service';
import {
  WorkspaceDropdownFolder,
  WorkspaceDropdownItem,
  WorkspaceDropdownResponse,
} from '../models/workspace-dropdown.models';
import { extractErrorMessage } from '../../../shared/functions/api.functions';
import { entityNameOf, idOf } from '../../../shared/functions/common.function';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceDropdownStore {
  private readonly workspaceService = inject(WorkspaceService);

  private readonly _items = signal<readonly WorkspaceDropdownItem[]>([]);
  private readonly _selectedWorkspaceId = signal<string | null>(null);
  private readonly _selectedFolderId = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _loaded = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastSearch = signal<string>('');

  readonly items = this._items.asReadonly();
  readonly workspaces = this._items.asReadonly();
  readonly selectedWorkspaceId = this._selectedWorkspaceId.asReadonly();
  readonly selectedFolderId = this._selectedFolderId.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastSearch = this._lastSearch.asReadonly();

  readonly hasWorkspaces = computed(() => this._items().length > 0);

  readonly selectedWorkspace = computed<WorkspaceDropdownItem | null>(() => {
    const selectedId = this._selectedWorkspaceId();
    if (!selectedId) return null;
    return this._items().find((workspace) => workspace.id === selectedId) ?? null;
  });

  readonly folders = computed<readonly WorkspaceDropdownFolder[]>(() => {
    return this.selectedWorkspace()?.folders ?? [];
  });

  readonly hasFolders = computed(() => this.folders().length > 0);

  readonly selectedFolder = computed<WorkspaceDropdownFolder | null>(() => {
    const folderId = this._selectedFolderId();
    if (!folderId) return null;
    return this.folders().find((folder) => folder.id === folderId) ?? null;
  });

  readonly workspaceOptions = computed(() =>
    this._items().map((workspace) => ({
      label: entityNameOf(workspace, 'Untitled workspace'),
      value: idOf(workspace),
    })),
  );

  readonly folderOptions = computed(() =>
    this.folders().map((folder) => ({
      label: entityNameOf(folder, 'Untitled folder'),
      value: idOf(folder),
    })),
  );

  load(search?: string, force = false): Observable<readonly WorkspaceDropdownItem[] | null> {
    const normalizedSearch = search?.trim() ?? '';

    if (this._loaded() && !force && this._lastSearch() === normalizedSearch) {
      return of(this._items());
    }

    if (this._loading()) {
      return of(this._items());
    }

    this._loading.set(true);
    this._error.set(null);

    return this.workspaceService.getWorkspaceDropdown(normalizedSearch).pipe(
      map((response) => {
        const items = Array.isArray(response?.data) ? response.data : [];
        this._items.set(items);
        this._lastSearch.set(normalizedSearch);
        this._loaded.set(true);
        this.ensureSelection();
        return items;
      }),
      catchError((error) => {
        this._error.set(extractErrorMessage(error, 'Unable to load workspace dropdown data.'));
        return of(null);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  setItems(
    items: readonly WorkspaceDropdownItem[],
    selectedWorkspaceId?: string | null,
    selectedFolderId?: string | null,
  ): void {
    this._items.set([...items]);
    this._loaded.set(true);
    this._loading.set(false);
    this._error.set(null);

    if (selectedWorkspaceId !== undefined) {
      this._selectedWorkspaceId.set(selectedWorkspaceId);
      if (selectedFolderId !== undefined) {
        this._selectedFolderId.set(selectedFolderId);
      } else {
        const ws = items.find((w) => w.id === selectedWorkspaceId);
        this._selectedFolderId.set(ws?.folders?.[0]?.id ?? null);
      }
    } else {
      this.ensureSelection();
    }
  }

  selectWorkspace(workspaceId: string | null, preferredFolderId?: string | null): void {
    if (!workspaceId) {
      this._selectedWorkspaceId.set(null);
      this._selectedFolderId.set(null);
      return;
    }

    const workspace = this._items().find((w) => w.id === workspaceId);
    if (!workspace) {
      this._selectedWorkspaceId.set(null);
      this._selectedFolderId.set(null);
      return;
    }

    this._selectedWorkspaceId.set(workspaceId);

    const folders = workspace.folders ?? [];
    if (preferredFolderId && folders.some((f) => f.id === preferredFolderId)) {
      this._selectedFolderId.set(preferredFolderId);
    } else {
      this._selectedFolderId.set(folders[0]?.id ?? null);
    }
  }

  selectFolder(folderId: string | null): void {
    if (!folderId) {
      this._selectedFolderId.set(null);
      return;
    }

    const currentFolders = this.folders();
    if (currentFolders.some((f) => f.id === folderId)) {
      this._selectedFolderId.set(folderId);
    }
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  clearError(): void {
    this._error.set(null);
  }

  refresh(search?: string): Observable<readonly WorkspaceDropdownItem[] | null> {
    return this.load(search, true);
  }

  reset(): void {
    this._items.set([]);
    this._selectedWorkspaceId.set(null);
    this._selectedFolderId.set(null);
    this._loading.set(false);
    this._loaded.set(false);
    this._error.set(null);
    this._lastSearch.set('');
  }

  clear(): void {
    this.reset();
  }

  private ensureSelection(): void {
    const items = this._items();
    if (items.length === 0) {
      this._selectedWorkspaceId.set(null);
      this._selectedFolderId.set(null);
      return;
    }

    const currentWsId = this._selectedWorkspaceId();
    const currentWs = items.find((w) => w.id === currentWsId);

    if (currentWs) {
      const currentFolderId = this._selectedFolderId();
      if (!currentWs.folders.some((f) => f.id === currentFolderId)) {
        this._selectedFolderId.set(currentWs.folders[0]?.id ?? null);
      }
      return;
    }

    const firstWs = items[0];
    this._selectedWorkspaceId.set(firstWs.id);
    this._selectedFolderId.set(firstWs.folders?.[0]?.id ?? null);
  }
}
