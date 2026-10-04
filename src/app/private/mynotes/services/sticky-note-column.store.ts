import {
    Injectable,
    computed,
    signal,
} from '@angular/core';

export type StickyNoteColumnStoreItem = any;

@Injectable({
    providedIn: 'root',
})
export class StickyNoteColumnStore {
    private readonly entitiesState =
        signal<readonly StickyNoteColumnStoreItem[]>([]);

    private readonly workspaceIdState =
        signal<string | null>(null);

    private readonly workspaceFolderIdState =
        signal<string | null>(null);

    private readonly loadingState =
        signal(false);

    private readonly initializedState =
        signal(false);

    private readonly errorState =
        signal<string | null>(null);

    readonly columns =
        this.entitiesState.asReadonly();

    readonly workspaceId =
        this.workspaceIdState.asReadonly();

    readonly workspaceFolderId =
        this.workspaceFolderIdState.asReadonly();

    readonly loading =
        this.loadingState.asReadonly();

    readonly initialized =
        this.initializedState.asReadonly();

    readonly error =
        this.errorState.asReadonly();

    readonly hasColumns =
        computed(
            () =>
                this.entitiesState().length >
                0,
        );

    readonly orderedColumns =
        computed(() =>
            [...this.entitiesState()]
                .sort(
                    (first, second) =>
                        (first.position ?? 0) -
                        (second.position ?? 0),
                ),
        );

    setLoading(
        loading: boolean,
    ): void {
        this.loadingState.set(
            loading,
        );

        if (loading) {
            this.errorState.set(
                null,
            );
        }
    }

    setColumns(
        workspaceId: string,
        workspaceFolderId: string,
        columns:
            readonly StickyNoteColumnStoreItem[],
    ): void {
        this.workspaceIdState.set(
            workspaceId,
        );

        this.workspaceFolderIdState.set(
            workspaceFolderId,
        );

        this.entitiesState.set(
            [...columns].sort(
                (first, second) =>
                    (first.position ?? 0) -
                    (second.position ?? 0),
            ),
        );

        this.initializedState.set(
            true,
        );

        this.loadingState.set(
            false,
        );

        this.errorState.set(
            null,
        );
    }

    contextMatches(
        workspaceId: string,
        workspaceFolderId: string,
    ): boolean {
        return (
            this.workspaceIdState() ===
            workspaceId &&
            this.workspaceFolderIdState() ===
            workspaceFolderId
        );
    }

    findById(
        id: string,
    ): StickyNoteColumnStoreItem | null {
        if (!id) {
            return null;
        }

        return (
            this.entitiesState()
                .find(
                    column =>
                        this.columnId(
                            column,
                        ) === id,
                ) ??
            null
        );
    }

    upsert(
        column:
            StickyNoteColumnStoreItem,
    ): void {
        const id =
            this.columnId(
                column,
            );

        if (!id) {
            return;
        }

        this.entitiesState.update(
            current => {
                const index =
                    current.findIndex(
                        item =>
                            this.columnId(
                                item,
                            ) === id,
                    );

                if (index < 0) {
                    return [
                        ...current,
                        column,
                    ].sort(
                        (
                            first,
                            second,
                        ) =>
                            (first.position ??
                                0) -
                            (second.position ??
                                0),
                    );
                }

                const next =
                    [...current];

                next[index] =
                    column;

                return next.sort(
                    (
                        first,
                        second,
                    ) =>
                        (first.position ??
                            0) -
                        (second.position ??
                            0),
                );
            },
        );
    }

    remove(
        id: string,
    ): void {
        this.entitiesState.update(
            current =>
                current.filter(
                    column =>
                        this.columnId(
                            column,
                        ) !== id,
                ),
        );
    }

    setError(
        message: string,
    ): void {
        this.errorState.set(
            message,
        );

        this.loadingState.set(
            false,
        );

        this.initializedState.set(
            true,
        );
    }

    resetForContext(
        workspaceId: string,
        workspaceFolderId: string,
    ): void {
        if (
            this.contextMatches(
                workspaceId,
                workspaceFolderId,
            )
        ) {
            return;
        }

        this.workspaceIdState.set(
            workspaceId,
        );

        this.workspaceFolderIdState.set(
            workspaceFolderId,
        );

        this.entitiesState.set(
            [],
        );

        this.loadingState.set(
            false,
        );

        this.initializedState.set(
            false,
        );

        this.errorState.set(
            null,
        );
    }

    clear(): void {
        this.entitiesState.set(
            [],
        );

        this.workspaceIdState.set(
            null,
        );

        this.workspaceFolderIdState.set(
            null,
        );

        this.loadingState.set(
            false,
        );

        this.initializedState.set(
            false,
        );

        this.errorState.set(
            null,
        );
    }

    private columnId(
        column:
            StickyNoteColumnStoreItem,
    ): string {
        const value =
            column as unknown as
            Record<
                string,
                unknown
            >;

        return String(
            value['id'] ??
            value['_id'] ??
            '',
        );
    }
}
