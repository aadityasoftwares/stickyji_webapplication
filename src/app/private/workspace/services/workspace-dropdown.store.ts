import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, finalize, map, of, shareReplay, takeUntil } from 'rxjs';
import { SessionLifecycleService } from '../../../shared/services/session-lifecycle.service';
import { WorkspaceService } from './workspace.service';
import type {
  WorkspaceDropdownFolder,
  WorkspaceDropdownItem,
  WorkspaceDropdownResponse,
} from '../interfaces/workspace-dropdown.interface';
import { extractErrorMessage } from '../../../shared/functions/api.functions';
import { entityNameOf, idOf } from '../../../shared/functions/common.function';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceDropdownStore {
  private readonly reset$ = new Subject<void>();

  constructor() {
    inject(SessionLifecycleService).registerReset(() => this.reset());
  }
  private readonly requests = new Map<
    string,
    Observable<readonly WorkspaceDropdownItem[] | null>
  >();
  private refreshPending = false;
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
    return this._items().find((workspace) => idOf(workspace) === selectedId) ?? null;
  });

  readonly folders = computed<readonly WorkspaceDropdownFolder[]>(() => {
    return this.selectedWorkspace()?.folders ?? [];
  });

  readonly hasFolders = computed(() => this.folders().length > 0);

  readonly selectedFolder = computed<WorkspaceDropdownFolder | null>(() => {
    const folderId = this._selectedFolderId();
    if (!folderId) return null;
    return this.folders().find((folder) => idOf(folder) === folderId) ?? null;
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

    const pending = this.requests.get(normalizedSearch);
    if (pending) return pending;

    this._loading.set(true);
    this._error.set(null);

    const request$ = this.workspaceService.getWorkspaceDropdown(normalizedSearch).pipe(
      takeUntil(this.reset$),
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
      finalize(() => {
        this.requests.delete(normalizedSearch);
        this._loading.set(this.requests.size > 0);
        if (this.refreshPending && this.requests.size === 0) {
          this.refreshPending = false;
          this.refresh().subscribe();
        }
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.requests.set(normalizedSearch, request$);
    return request$;
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
      if (selectedFolderId !== undefined && selectedFolderId !== null) {
        this._selectedFolderId.set(selectedFolderId);
      } else {
        const ws = items.find((w) => idOf(w) === selectedWorkspaceId);
        this._selectedFolderId.set(ws?.folders?.[0] ? idOf(ws.folders[0]) : null);
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

    const workspace = this._items().find((w) => idOf(w) === workspaceId);
    if (!workspace) {
      this._selectedWorkspaceId.set(null);
      this._selectedFolderId.set(null);
      return;
    }

    this._selectedWorkspaceId.set(workspaceId);

    const folders = workspace.folders ?? [];
    if (preferredFolderId && folders.some((f) => idOf(f) === preferredFolderId)) {
      this._selectedFolderId.set(preferredFolderId);
    } else {
      this._selectedFolderId.set(folders[0] ? idOf(folders[0]) : null);
    }
  }

  selectFolder(folderId: string | null): void {
    if (!folderId) {
      this._selectedFolderId.set(null);
      return;
    }

    const currentFolders = this.folders();
    if (currentFolders.some((f) => idOf(f) === folderId)) {
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
    if (this.requests.size > 0) this.refreshPending = true;
    return this.load(search, true);
  }

  updateWorkspace(id: string, values: any): void {
    this._items.update((items) => {
      if (values.status && values.status !== 'ACTIVE')
        return items.filter((item) => item.id !== id);
      const existing = items.find((item) => item.id === id);
      if (!existing && !values.name) return items;
      const updated = {
        ...existing,
        ...values,
        id,
        folders: values.folders ?? existing?.folders ?? [],
      };
      return existing
        ? items.map((item) => (item.id === id ? updated : item))
        : [...items, updated];
    });
    this.ensureSelection();
  }

  updateFolder(workspaceId: string, folder: any): void {
    this._items.update((items) =>
      items.map((workspace) => {
        if (workspace.id !== workspaceId) return workspace;
        const folders = workspace.folders ?? [];
        const exists = folders.some((item) => item.id === folder.id);
        return {
          ...workspace,
          folders:
            folder.status && folder.status !== 'ACTIVE'
              ? folders.filter((item) => item.id !== folder.id)
              : exists
                ? folders.map((item) => (item.id === folder.id ? { ...item, ...folder } : item))
                : [...folders, folder],
        };
      }),
    );
    this.ensureSelection();
  }

  removeFolder(id: string): void {
    this._items.update((items) =>
      items.map((workspace) => ({
        ...workspace,
        folders: (workspace.folders ?? []).filter((folder) => folder.id !== id),
      })),
    );
    this.ensureSelection();
  }

  reset(): void {
    this.refreshPending = false;
    this.reset$.next();
    this.requests.clear();
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
    const currentWs = items.find((w) => idOf(w) === currentWsId);

    if (currentWs) {
      const currentFolderId = this._selectedFolderId();
      if (!currentWs.folders.some((f) => idOf(f) === currentFolderId)) {
        this._selectedFolderId.set(currentWs.folders[0] ? idOf(currentWs.folders[0]) : null);
      }
      return;
    }

    const firstWs = items[0];
    this._selectedWorkspaceId.set(idOf(firstWs));
    this._selectedFolderId.set(firstWs.folders?.[0] ? idOf(firstWs.folders[0]) : null);
  }
}
