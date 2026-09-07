import { Injectable, computed, signal } from '@angular/core';
import { Pagination, WorkspaceFolder } from '../models/workspace-folder.models';

@Injectable({ providedIn: 'root' })
export class WorkspaceFolderStore {
    private readonly entitiesState = signal<readonly WorkspaceFolder[]>([]);
    private readonly workspaceIdState = signal<string | null>(null);
    private readonly selectedIdState = signal<string | null>(null);
    private readonly loadingState = signal(false);
    private readonly initializedState = signal(false);
    private readonly errorState = signal<string | null>(null);
    private readonly paginationState = signal<Pagination | null>(null);

    readonly folders = this.entitiesState.asReadonly();
    readonly workspaceId = this.workspaceIdState.asReadonly();
    readonly selectedId = this.selectedIdState.asReadonly();
    readonly loading = this.loadingState.asReadonly();
    readonly initialized = this.initializedState.asReadonly();
    readonly error = this.errorState.asReadonly();
    readonly pagination = this.paginationState.asReadonly();

    readonly selectedFolder = computed(() => {
        const selectedId = this.selectedIdState();
        return selectedId
            ? this.entitiesState().find(folder => folder.id === selectedId) ?? null
            : null;
    });

    readonly defaultFolder = computed(
        () => this.entitiesState().find(folder => folder.isDefault) ?? null
    );

    readonly activeFolders = computed(() =>
        this.entitiesState().filter(folder => folder.status === 'ACTIVE')
    );

    readonly hasFolders = computed(() => this.entitiesState().length > 0);
    readonly hasActiveFolders = computed(() => this.activeFolders().length > 0);

    setLoading(loading: boolean): void {
        this.loadingState.set(loading);

        if (loading) {
            this.errorState.set(null);
        }
    }

    setFolders(
        workspaceId: string,
        folders: readonly WorkspaceFolder[],
        pagination: Pagination | null
    ): void {
        this.workspaceIdState.set(workspaceId);
        this.entitiesState.set([...folders]);
        this.paginationState.set(pagination);
        this.initializedState.set(true);
        this.loadingState.set(false);
        this.errorState.set(null);

        const selectedId = this.selectedIdState();

        if (selectedId && !folders.some(folder => folder.id === selectedId)) {
            this.selectedIdState.set(null);
        }
    }

    select(id: string | null): void {
        this.selectedIdState.set(id);
    }

    selectDefault(): void {
        const defaultFolder = this.defaultFolder();

        if (defaultFolder) {
            this.selectedIdState.set(defaultFolder.id);
        }
    }

    upsert(folder: WorkspaceFolder): void {
        this.entitiesState.update(current => {
            const index = current.findIndex(item => item.id === folder.id);

            if (index < 0) {
                return [folder, ...current];
            }

            const next = [...current];
            next[index] = folder;
            return next;
        });
    }

    remove(id: string): void {
        this.entitiesState.update(current => current.filter(item => item.id !== id));

        if (this.selectedIdState() === id) {
            this.selectedIdState.set(null);
        }
    }

    setError(message: string): void {
        this.errorState.set(message);
        this.loadingState.set(false);
        this.initializedState.set(true);
    }

    resetForWorkspace(workspaceId: string): void {
        if (this.workspaceIdState() === workspaceId) {
            return;
        }

        this.workspaceIdState.set(workspaceId);
        this.entitiesState.set([]);
        this.selectedIdState.set(null);
        this.loadingState.set(false);
        this.initializedState.set(false);
        this.errorState.set(null);
        this.paginationState.set(null);
    }

    clear(): void {
        this.entitiesState.set([]);
        this.workspaceIdState.set(null);
        this.selectedIdState.set(null);
        this.loadingState.set(false);
        this.initializedState.set(false);
        this.errorState.set(null);
        this.paginationState.set(null);
    }
}