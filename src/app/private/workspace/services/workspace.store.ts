import { Injectable, computed, signal } from '@angular/core';
import { Pagination, Workspace } from '../models/workspace.models';

@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
    private readonly entitiesState = signal<readonly Workspace[]>([]);
    private readonly selectedIdState = signal<string | null>(null);
    private readonly loadingState = signal(false);
    private readonly initializedState = signal(false);
    private readonly errorState = signal<string | null>(null);
    private readonly paginationState = signal<Pagination | null>(null);

    readonly workspaces = this.entitiesState.asReadonly();
    readonly selectedId = this.selectedIdState.asReadonly();
    readonly loading = this.loadingState.asReadonly();
    readonly initialized = this.initializedState.asReadonly();
    readonly error = this.errorState.asReadonly();
    readonly pagination = this.paginationState.asReadonly();

    readonly selectedWorkspace = computed(() => {
        const selectedId = this.selectedIdState();
        return this.entitiesState().find(workspace => workspace._id === selectedId) ?? null;
    });

    readonly hasWorkspaces = computed(() => this.entitiesState().length > 0);

    setLoading(loading: boolean): void {
        this.loadingState.set(loading);
        if (loading) this.errorState.set(null);
    }

    setWorkspaces(workspaces: readonly Workspace[], pagination: Pagination | null): void {
        this.entitiesState.set([...workspaces]);
        this.paginationState.set(pagination);
        this.initializedState.set(true);
        this.loadingState.set(false);
        this.errorState.set(null);
    }

    select(id: string | null): void {
        this.selectedIdState.set(id);
    }

    upsert(workspace: Workspace): void {
        this.entitiesState.update(current => {
            const index = current.findIndex(item => item._id === workspace._id);
            if (index < 0) return [workspace, ...current];

            const next = [...current];
            next[index] = workspace;
            return next;
        });
    }

    remove(id: string): void {
        this.entitiesState.update(current => current.filter(item => item._id !== id));
        if (this.selectedIdState() === id) this.selectedIdState.set(null);
    }

    setError(message: string): void {
        this.errorState.set(message);
        this.loadingState.set(false);
        this.initializedState.set(true);
    }

    clear(): void {
        this.entitiesState.set([]);
        this.selectedIdState.set(null);
        this.loadingState.set(false);
        this.initializedState.set(false);
        this.errorState.set(null);
        this.paginationState.set(null);
    }
}
