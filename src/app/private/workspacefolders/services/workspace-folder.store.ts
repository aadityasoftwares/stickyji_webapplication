import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { Pagination, WorkspaceFolder } from '../models/workspace-folder.models';
import { WorkspaceFolderService } from './workspace-folder.service';

@Injectable({ providedIn: 'root' })
export class WorkspaceFolderStore {
    private readonly workspaceFolderService = inject(WorkspaceFolderService);

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
        return selectedId
            ? this._folders().find(folder => folder.id === selectedId) ?? null
            : null;
    });

    readonly defaultFolder = computed(
        () => this._folders().find(folder => folder.isDefault) ?? null
    );

    readonly activeFolders = computed(() =>
        this._folders().filter(folder => folder.status === 'ACTIVE')
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

        if (this._loading()) {
            return;
        }

        this._loading.set(true);
        this._error.set(null);

        this.workspaceFolderService.getAllWorkspaceFolders({ workspaceId: id, page: 1, limit: 100 })
            .pipe(finalize(() => this._loading.set(false)))
            .subscribe({
                next: (response: any) => {
                    const folders =
                        response?.data?.folders ??
                        response?.data?.workspaceFolders ??
                        response?.data?.items ??
                        response?.data ??
                        [];

                    const pagination =
                        response?.meta ??
                        response?.data?.meta ??
                        response?.data?.pagination ??
                        response?.pagination ??
                        null;

                    this.setFolders(
                        id,
                        Array.isArray(folders) ? folders : [],
                        pagination
                    );
                },
                error: (error: any) => {
                    this._error.set(
                        error?.error?.message ||
                        error?.message ||
                        'Failed to load workspace folders'
                    );
                }
            });
    }

    select(id: string | null): void {
        if (!id) {
            this._selectedId.set(null);
            return;
        }

        const exists = this._folders()
            .some(folder => folder.id === id);

        if (!exists) {
            return;
        }

        this._selectedId.set(id);
    }

    selectFirst(): void {
        const folder = this._folders()[0];
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
        this._folders.update(current => {
            const index = current.findIndex(item => item.id === folder.id);

            if (index < 0) {
                return [folder, ...current];
            }

            const next = [...current];
            next[index] = folder;
            return next;
        });

        if (!this._selectedId()) {
            this._selectedId.set(folder.id);
        }
    }

    updateFolder(id: string, values: Partial<WorkspaceFolder>): void {
        this._folders.update(current =>
            current.map(folder =>
                folder.id === id
                    ? {
                        ...folder,
                        ...values,
                    }
                    : folder
            )
        );
    }

    remove(id: string): void {
        this._folders.update(current =>
            current.filter(item => item.id !== id)
        );

        if (this._selectedId() === id) {
            this.ensureSelectedFolder();
        }
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
        pagination: Pagination | null = null
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

        if (selectedId && folders.some(folder => folder.id === selectedId)) {
            return;
        }

        const preferred =
            folders.find(folder => folder.status === 'ACTIVE' && folder.isDefault) ??
            folders.find(folder => folder.status === 'ACTIVE') ??
            folders[0] ??
            null;

        this._selectedId.set(preferred?.id ?? null);
    }
}