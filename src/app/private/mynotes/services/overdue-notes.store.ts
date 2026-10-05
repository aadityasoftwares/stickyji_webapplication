import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, finalize } from 'rxjs';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { PAGINATION } from '../../../shared/constants/app.constants';
import { DATE_SORT_ORDER, NOTE_LIMITS } from '../../../shared/constants/common.constants';
import { extractErrorMessage } from '../../../shared/functions/common.function';
import { StickyNoteApiService } from './sticky-notes.service';

// Each notes screen provides its own instance; the parent controls when to refresh.
@Injectable()
export class OverdueNotesStore {
  private readonly api = inject(StickyNoteApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  private requestVersion = 0;
  private contextVersion = 0;
  private workspaceId = '';
  private folderId = '';

  readonly data = signal<any>(null);
  readonly pagination = signal<any>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly open = signal(false);
  readonly dismissed = signal(false);
  readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  readonly columnFilter = signal('');
  readonly bannerVisible = computed(() => !this.dismissed() && !this.error() && (this.data()?.total ?? 0) > 0);

  refresh(workspaceId = this.workspaceId, folderId = this.folderId): void {
    if (workspaceId !== this.workspaceId || folderId !== this.folderId) {
      this.reset();
      this.workspaceId = workspaceId;
      this.folderId = folderId;
    }
    if (!workspaceId || !folderId) return;
    this.loadPage(PAGINATION.DEFAULT_PAGE);
  }

  reset(): void {
    ++this.contextVersion;
    ++this.requestVersion;
    this.request?.unsubscribe();
    this.workspaceId = '';
    this.folderId = '';
    this.data.set(null);
    this.pagination.set(null);
    this.loading.set(false);
    this.busy.set(false);
    this.error.set(null);
    this.open.set(false);
    this.dismissed.set(false);
    this.selectedIds.set(new Set());
    this.columnFilter.set('');
  }

  changePage(page: number): void {
    if (this.loading() || this.busy() || page < 1 || page > (this.pagination()?.totalPages ?? 1)) return;
    this.selectedIds.set(new Set());
    this.loadPage(page);
  }

  private loadPage(page: number): void {
    const version = ++this.requestVersion;
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.request = this.api.getOverdueNotes({
      workspaceId: this.workspaceId,
      workspaceFolderId: this.folderId,
      page,
      limit: PAGINATION.DEFAULT_LIMIT,
      sort: DATE_SORT_ORDER.NEWEST_FIRST
    }).pipe(
      finalize(() => {
        if (version === this.requestVersion) this.loading.set(false);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => {
        if (version !== this.requestVersion) return;
        if (!response.success) {
          this.handleLoadError(response.message);
          return;
        }
        if (response.data.total > 0 && page > (response.meta.totalPages ?? 1)) {
          this.loadPage(Math.max(1, response.meta.totalPages ?? 1));
          return;
        }
        this.data.set(response.data);
        this.pagination.set(response.meta);
        const available = new Set(response.data.notes.map((note: any) => note.id));
        this.selectedIds.update(ids => new Set([...ids].filter(id => available.has(id))));
        if (!response.data.byColumn.some((column: any) => column.columnId === this.columnFilter())) {
          this.columnFilter.set('');
        }
        if (!response.data.total) this.open.set(false);
      },
      error: error => {
        if (version === this.requestVersion) this.handleLoadError(error);
      }
    });
  }

  bringToToday(ids: readonly string[], refreshNotes: () => void): void {
    if (!ids.length || ids.length > NOTE_LIMITS.BULK_UPDATE_MAX || this.busy() || this.loading() || this.error()) return;
    const version = this.contextVersion;
    this.busy.set(true);
    this.api.bringOverdueNotesToToday([...new Set(ids)]).pipe(
      finalize(() => {
        if (version === this.contextVersion) this.busy.set(false);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => {
        if (version !== this.contextVersion) return;
        if (!response.success || !response.data) {
          this.handleUpdateError(response.message);
          return;
        }
        const result = response.data;
        if (result.updated) {
          this.toast.success(`${result.updated} ${result.updated === 1 ? 'note brought' : 'notes brought'} to Today.`, {
            title: 'Planned for today', dedupeKey: 'overdue-bring-today'
          });
        }
        if (result.skipped) {
          this.toast.warning(`${result.skipped} ${result.skipped === 1 ? 'note was' : 'notes were'} skipped because they are no longer overdue or available.`, {
            title: 'Some notes were skipped', dedupeKey: 'overdue-bring-today-skipped'
          });
        }
        const skippedIds = new Set(result.skippedNotes.map((note: any) => note.id));
        this.selectedIds.update(selected => new Set([...selected].filter(id => skippedIds.has(id))));
        // The screen's refresh reloads both its notes and the overdue summary once.
        refreshNotes();
      },
      error: error => {
        if (version === this.contextVersion) this.handleUpdateError(error);
      }
    });
  }

  private handleLoadError(error: unknown): void {
    const message = extractErrorMessage(error, 'Could not load overdue notes. Please try again.');
    this.error.set(message);
    this.data.set(null);
    this.toast.error(message, { title: 'Overdue notes unavailable', dedupeKey: 'overdue-load-error' });
  }

  private handleUpdateError(error: unknown): void {
    this.toast.error(extractErrorMessage(error, 'Could not bring notes to Today. Please try again.'), {
      title: 'Notes not rescheduled', dedupeKey: 'overdue-update-error'
    });
  }
}
