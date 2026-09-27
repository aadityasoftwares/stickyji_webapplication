import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  LucideCheck,
  LucideColumns3,
  LucidePencil,
  LucidePlus
} from '@lucide/angular';

import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput } from '../../../shared/components/input/input';
import { Label } from '../../../shared/components/label/label';
import { Loader } from '../../../shared/components/loader/loader';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { StickyNoteColumnApiService } from '../../mynotes/services/sticky-note-column.service';

@Component({
  selector: 'app-add-edit-sticky-note-column-side-panel',
  standalone: true,
  imports: [
    Badge,
    Button,
    AppIcon,
    AppInput,
    Label,
    Loader,
    SidePanel
  ],
  templateUrl: './add-edit-sticky-note-column-side-panel.html',
  styleUrl: './add-edit-sticky-note-column-side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditStickyNoteColumnSidePanel implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private readonly columnApi = inject(StickyNoteColumnApiService);
  private readonly toastService = inject(ToastService);
  private editorId = '';

  @ViewChild('columnNameInput', { read: ElementRef })
  private columnNameInput?: ElementRef<HTMLElement>;

  @Input() open = false;
  @Input() id = '';
  @Input() workspaceId = '';
  @Input() workspaceFolderId = '';
  @Input() column: any = null;

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<string>();

  readonly LucideColumns3 = LucideColumns3;
  readonly nameMinLength = 1;
  readonly nameMaxLength = 50;

  readonly loading = signal(false);
  readonly loadingData = signal(false);
  readonly loadFailed = signal(false);
  readonly error = signal('');
  readonly dirty = signal(false);
  readonly name = signal('');
  readonly color = signal('YELLOW');
  readonly previewSource = signal<any>(null);

  readonly colorOptions = [
    { label: 'Yellow', value: 'YELLOW' },
    { label: 'Blue', value: 'BLUE' },
    { label: 'Green', value: 'GREEN' },
    { label: 'Pink', value: 'PINK' },
    { label: 'Purple', value: 'PURPLE' },
    { label: 'Orange', value: 'ORANGE' }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.open) return;

    if (
      changes['open'] ||
      changes['id'] ||
      changes['workspaceId'] ||
      changes['workspaceFolderId'] ||
      changes['column']
    ) {
      this.initialize();
    }
  }

  get isEdit(): boolean {
    return !!this.editorId;
  }

  get panelTitle(): string {
    return this.isEdit ? 'Edit column' : 'Create column';
  }

  get eyebrow(): string {
    return this.isEdit ? 'Update board stage' : 'Add board stage';
  }

  get description(): string {
    return 'Give the column a clear name and color.';
  }

  get headerIcon() {
    return this.isEdit ? LucidePencil : LucideColumns3;
  }

  get submitIcon() {
    return this.isEdit ? LucideCheck : LucidePlus;
  }

  get submitLabel(): string {
    return this.isEdit ? 'Save changes' : 'Create column';
  }

  get statusText(): string {
    if (this.dirty()) return 'Not saved';
    return this.isEdit ? 'Saved' : 'New column';
  }

  get isBusy(): boolean {
    return this.loading() || this.loadingData();
  }

  get canSubmit(): boolean {
    const name = this.name().trim();

    return (
      !this.isBusy &&
      !this.loadFailed() &&
      !!this.workspaceId &&
      !!this.workspaceFolderId &&
      name.length >= this.nameMinLength &&
      name.length <= this.nameMaxLength
    );
  }

  get isSystemColumn(): boolean {
    return this.previewSource()?.isSystem === true;
  }

  get columnTypeLabel(): string {
    const type = String(this.previewSource()?.type || 'CUSTOM');

    if (type === 'TODO') return 'To do';
    if (type === 'IN_PROGRESS') return 'In progress';
    if (type === 'COMPLETED') return 'Completed';

    return 'Custom';
  }

  updateName(value: any): void {
    this.name.set(String(value ?? ''));
    this.markDirty();
  }

  selectColor(value: string): void {
    if (this.isBusy || this.loadFailed()) return;
    if (this.color() === value) return;

    this.color.set(value);
    this.markDirty();
  }

  colorLabel(value: string): string {
    return this.colorOptions.find(option => option.value === value)?.label || value;
  }

  submit(): void {
    if (!this.canSubmit) return;

    const name = this.name().trim().replace(/\s+/g, ' ');
    const id = this.editorId;

    this.loading.set(true);
    this.error.set('');

    const request$ = id
      ? this.columnApi.update(id, {
        name,
        color: this.color()
      } as any)
      : this.columnApi.create({
        workspaceId: this.workspaceId,
        workspaceFolderId: this.workspaceFolderId,
        name,
        color: this.color()
      } as any);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response: any) => {
          const savedId = response?.data?.id || id;

          this.dirty.set(false);

          this.toastService.success(
            id
              ? 'Column updated successfully.'
              : 'Column created successfully.',
            {
              title: id ? 'Column updated' : 'Column created',
              dedupeKey: `column-${savedId || 'new'}`
            }
          );

          this.saved.emit(savedId);
        },
        error: error => {
          this.showError(
            error,
            id
              ? 'Unable to update column.'
              : 'Unable to create column.'
          );
        }
      });
  }

  close(): void {
    if (this.isBusy) return;

    this.error.set('');
    this.closed.emit();
  }

  private initialize(): void {
    this.error.set('');
    this.loadFailed.set(false);
    this.loading.set(false);
    this.dirty.set(false);

    this.editorId = String(this.id || this.column?.id || '').trim();

    if (!this.editorId) {
      this.name.set('');
      this.color.set('YELLOW');
      this.previewSource.set({
        type: 'CUSTOM',
        position: 0,
        isSystem: false
      });
      this.focusName();
      return;
    }

    if (this.column) {
      this.setColumn(this.column);
      this.focusName();
      return;
    }

    this.loadColumn();
  }

  private loadColumn(): void {
    this.loadingData.set(true);

    this.columnApi
      .getById(this.editorId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingData.set(false))
      )
      .subscribe({
        next: response => {
          this.setColumn(response.data);
          this.focusName();
        },
        error: error => {
          this.loadFailed.set(true);
          this.showError(error, 'Unable to load column.');
        }
      });
  }

  private setColumn(column: any): void {
    this.previewSource.set(column);
    this.name.set(column?.name || column?.label || '');
    this.color.set(this.validColor(column?.color) ? column.color : 'YELLOW');
    this.dirty.set(false);
  }

  private validColor(value: any): boolean {
    return this.colorOptions.some(option => option.value === value);
  }

  private markDirty(): void {
    this.error.set('');
    this.dirty.set(true);
  }

  private showError(error: any, fallback: string): void {
    const message =
      error?.error?.message ||
      error?.message ||
      fallback;

    this.error.set(message);

    this.toastService.error(message, {
      title: 'Board column',
      dedupeKey: `column-error-${this.editorId || 'new'}`
    });
  }

  private focusName(): void {
    setTimeout(() => {
      const input =
        this.columnNameInput?.nativeElement.querySelector<HTMLInputElement>('input');

      input?.focus();
    });
  }
}
