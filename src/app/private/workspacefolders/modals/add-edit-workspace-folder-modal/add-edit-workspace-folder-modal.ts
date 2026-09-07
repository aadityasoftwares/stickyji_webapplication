import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
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
  LucideFolderOpen,
  LucidePencil,
  LucidePlus,
  LucideX
} from '@lucide/angular';

import { Button } from '../../../../shared/components/button/button';
import { Divider } from '../../../../shared/components/divider/divider';
import { AppIcon } from '../../../../shared/components/icon/icon';
import { Input as AppInput } from '../../../../shared/components/input/input';
import { ToastService } from '../../../../shared/components/toast/services/toast.service';

import type {
  WorkspaceFolder,
  WorkspaceFolderCreateRequest,
  WorkspaceFolderUpdateRequest
} from '../../models/workspace-folder.models';
import { WorkspaceFolderApiService } from '../../services/workspace-folder.service';

@Component({
  selector: 'app-add-edit-workspace-folder-modal',
  standalone: true,
  imports: [AppIcon, AppInput, Button, Divider],
  templateUrl: './add-edit-workspace-folder-modal.html',
  styleUrl: './add-edit-workspace-folder-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditWorkspaceFolderModal implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private readonly folderApi = inject(WorkspaceFolderApiService);
  private readonly toastService = inject(ToastService);

  @ViewChild('folderNameInput', { read: ElementRef })
  private folderNameInput?: ElementRef<HTMLElement>;

  @Input() open = false;
  @Input() workspaceId = '';
  @Input() id = '';
  @Input() folder: WorkspaceFolder | null = null;
  @Input() position = 0;

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<string>();

  readonly LucideCheck = LucideCheck;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideX = LucideX;

  readonly nameMinLength = 2;
  readonly nameMaxLength = 80;
  readonly descriptionMaxLength = 240;

  readonly loading = signal(false);
  readonly name = signal('');
  readonly folderDescription = signal('');
  readonly error = signal<string | null>(null);

  get isEdit(): boolean {
    return !!String(this.id ?? '').trim();
  }

  get title(): string {
    return this.isEdit ? 'Edit folder' : 'Create folder';
  }

  get eyebrow(): string {
    return this.isEdit ? 'Quick folder update' : 'A fresh sticky folder';
  }

  get description(): string {
    return this.isEdit
      ? 'Update the folder details without affecting the notes inside it.'
      : 'Create a focused place for related notes inside this workspace.';
  }

  get headerIcon() {
    return this.isEdit ? this.LucidePencil : this.LucideFolderOpen;
  }

  get submitIcon() {
    return this.isEdit ? this.LucideCheck : this.LucidePlus;
  }

  get submitLabel(): string {
    return this.isEdit ? 'Save changes' : 'Create folder';
  }

  get canSubmit(): boolean {
    const nameLength = this.name().trim().length;
    const descriptionLength = this.folderDescription().trim().length;

    return !this.loading() &&
      nameLength >= this.nameMinLength &&
      nameLength <= this.nameMaxLength &&
      descriptionLength <= this.descriptionMaxLength &&
      (this.isEdit || !!this.workspaceId.trim());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.open) return;

    if (
      changes['open']?.currentValue === true ||
      changes['id'] ||
      changes['folder'] ||
      changes['workspaceId']
    ) {
      this.initialize();
    }
  }

  updateName(value: unknown): void {
    this.name.set(String(value ?? ''));
    this.error.set(null);
  }

  updateDescription(value: unknown): void {
    this.folderDescription.set(String(value ?? ''));
    this.error.set(null);
  }

  submit(): void {
    if (this.loading()) return;

    const name = this.name().trim();
    const description = this.folderDescription().trim();

    if (name.length < this.nameMinLength) {
      this.showError(`Folder name must contain at least ${this.nameMinLength} characters.`);
      this.focusName();
      return;
    }

    if (name.length > this.nameMaxLength) {
      this.showError(`Folder name cannot be longer than ${this.nameMaxLength} characters.`);
      this.focusName();
      return;
    }

    if (description.length > this.descriptionMaxLength) {
      this.showError(`Description cannot be longer than ${this.descriptionMaxLength} characters.`);
      return;
    }

    if (!this.isEdit && !this.workspaceId.trim()) {
      this.showError('Select a workspace before creating a folder.');
      return;
    }

    if (this.isEdit && !this.id.trim()) {
      this.showError('Folder id is required to update this folder.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const request = this.isEdit
      ? this.folderApi.update(this.id.trim(), {
        name,
        description: description || null
      } as WorkspaceFolderUpdateRequest)
      : this.folderApi.create({
        workspaceId: this.workspaceId.trim(),
        name,
        description: description || null,
        position: Math.max(0, Number.isFinite(this.position) ? this.position : 0)
      } as WorkspaceFolderCreateRequest);

    request
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          const folderId = String(
            response?.data?.id ??
            (response?.data as unknown as Record<string, unknown>)?.['_id'] ??
            this.id ??
            ''
          );

          this.toastService.success(
            this.isEdit ? 'Folder changes were saved.' : 'Folder created successfully.',
            {
              title: this.isEdit ? 'Folder updated' : 'Folder created',
              dedupeKey: `workspace-folder-saved-${folderId || 'new'}`
            }
          );

          this.saved.emit(folderId);
        },
        error: error => {
          this.showError(
            this.errorMessage(
              error,
              this.isEdit ? 'Unable to update folder.' : 'Unable to create folder.'
            )
          );
        }
      });
  }

  close(): void {
    if (this.loading()) return;
    this.closed.emit();
  }

  onBackdropMouseDown(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open && !this.loading()) this.close();
  }

  private initialize(): void {
    this.loading.set(false);
    this.error.set(null);

    if (this.isEdit) {
      this.name.set(String(this.folder?.name ?? ''));
      this.folderDescription.set(String(this.folder?.description ?? ''));
    } else {
      this.name.set('');
      this.folderDescription.set('');
    }

    this.focusName();
  }

  private focusName(): void {
    setTimeout(() => {
      if (!this.open) return;

      const input = this.folderNameInput?.nativeElement.querySelector(
        'input:not([disabled])'
      ) as HTMLInputElement | null;

      if (!input) return;

      input.focus({ preventScroll: true });

      if (this.isEdit && input.value) {
        input.setSelectionRange(0, input.value.length);
      }
    });
  }

  private showError(message: string): void {
    this.error.set(message);

    this.toastService.error(message, {
      title: this.isEdit ? 'Could not update folder' : 'Could not create folder',
      dedupeKey: `workspace-folder-modal-error-${this.id || 'new'}-${message}`
    });
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') return fallback;

    const record = error as Record<string, unknown>;
    const nestedError = record['error'];

    if (nestedError && typeof nestedError === 'object') {
      const message = (nestedError as Record<string, unknown>)['message'];
      if (typeof message === 'string' && message.trim()) return message;
    }

    const message = record['message'];
    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}