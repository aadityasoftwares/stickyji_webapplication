import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { Pagination, Workspace } from '../models/workspace.models';
import { WorkspaceService } from './workspace.service';
import { WORKSPACE_MESSAGES } from '../messages/workspace.messages';

@Injectable({
    providedIn: 'root',
})

export class WorkspaceStore {

    private readonly workspaceService = inject(WorkspaceService);

    private readonly _workspaces = signal<readonly Workspace[]>([]);
    private readonly _selectedId = signal<string | null>(null);
    private readonly _pagination = signal<Pagination | null>(null);
    private readonly _loading = signal(false);
    private readonly _saving = signal(false);
    private readonly _loaded = signal(false);
    private readonly _error = signal<string | null>(null);

    readonly workspaces = this._workspaces.asReadonly();
    readonly selectedId = this._selectedId.asReadonly();
    readonly pagination = this._pagination.asReadonly();
    readonly loading = this._loading.asReadonly();
    readonly saving = this._saving.asReadonly();
    readonly loaded = this._loaded.asReadonly();
    readonly error = this._error.asReadonly();

    readonly selectedWorkspace = computed(() => {
        const selectedId = this._selectedId();
        return this._workspaces().find(workspace => workspace.id === selectedId) ?? null;
    });

    readonly hasWorkspaces = computed(() =>
        this._workspaces().length > 0
    );

    readonly workspaceCount = computed(() =>
        this._workspaces().length
    );

    load(force = false): void {

        if (this._loaded() && !force) {
            return;
        }

        if (this._loading()) {
            return;
        }

        this._loading.set(true);
        this._error.set(null);

        this.workspaceService.getMyWorkspaces()
            .pipe(finalize(() => this._loading.set(false)))
            .subscribe({
                next: (response: any) => {

                    const workspaces =
                        response?.data?.workspaces ??
                        response?.data?.items ??
                        response?.data ??
                        [];

                    const pagination =
                        response?.data?.pagination ??
                        response?.pagination ??
                        null;

                    this._workspaces.set(
                        Array.isArray(workspaces)
                            ? [...workspaces]
                            : []
                    );

                    this._pagination.set(pagination);
                    this._loaded.set(true);

                    this.ensureSelectedWorkspace();
                },

                error: (error: any) => {

                    this._error.set(
                        error?.error?.message ||
                        error?.message ||
                        WORKSPACE_MESSAGES.FAIL_TO_LOAD
                    );
                },
            });
    }

    select(id: string | null): void {

        if (!id) {
            this._selectedId.set(null);
            return;
        }

        const exists = this._workspaces()
            .some(workspace => workspace.id === id);

        if (!exists) {
            return;
        }

        this._selectedId.set(id);
    }

    selectFirst(): void {

        const workspace = this._workspaces()[0];

        this._selectedId.set(
            workspace?.id ?? null
        );
    }

    upsert(workspace: Workspace): void {

        this._workspaces.update(current => {

            const index = current.findIndex(
                item => item.id === workspace.id
            );

            if (index < 0) {
                return [workspace, ...current];
            }

            const next = [...current];
            next[index] = workspace;

            return next;
        });

        if (!this._selectedId()) {
            this._selectedId.set(workspace.id);
        }
    }

    updateWorkspace(id: string, values: Partial<Workspace>): void {

        this._workspaces.update(current =>
            current.map(workspace =>
                workspace.id === id
                    ? {
                        ...workspace,
                        ...values,
                    }
                    : workspace
            )
        );
    }

    remove(id: string): void {

        this._workspaces.update(current =>
            current.filter(workspace => workspace.id !== id)
        );

        if (this._selectedId() === id) {
            this.selectFirst();
        }
    }

    setLoading(loading: boolean): void {
        this._loading.set(loading);
    }

    setWorkspaces(
        workspaces: readonly Workspace[],
        pagination: Pagination | null = null
    ): void {

        this._workspaces.set([...workspaces]);
        this._pagination.set(pagination);
        this._loaded.set(true);
        this._error.set(null);

        this.ensureSelectedWorkspace();
    }

    setPagination(pagination: Pagination | null): void {
        this._pagination.set(pagination);
    }

    setSaving(saving: boolean): void {
        this._saving.set(saving);
    }

    setError(message: string): void {
        this._error.set(message);
    }

    clearError(): void {
        this._error.set(null);
    }

    refresh(): void {
        this.load(true);
    }

    reset(): void {
        this._workspaces.set([]);
        this._selectedId.set(null);
        this._pagination.set(null);
        this._loading.set(false);
        this._saving.set(false);
        this._loaded.set(false);
        this._error.set(null);
    }

    private ensureSelectedWorkspace(): void {

        const workspaces = this._workspaces();
        const selectedId = this._selectedId();

        if (!workspaces.length) {
            this._selectedId.set(null);
            return;
        }

        if (
            selectedId &&
            workspaces.some(workspace => workspace.id === selectedId)
        ) {
            return;
        }

        this._selectedId.set(
            workspaces[0]?.id ?? null
        );
    }

}