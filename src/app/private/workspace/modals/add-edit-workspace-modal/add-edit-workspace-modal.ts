import { AuthStore } from '../../../../public/auth/state/auth.store';
import { canWorkspaceAction } from '../../../../shared/functions/workspace-access.function';
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
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, finalize, takeUntil } from 'rxjs';
import { LucideCheck, LucideFolder, LucidePencil, LucidePlus, LucideX } from '@lucide/angular';

import { Button } from '../../../../shared/components/button/button';
import { Divider } from '../../../../shared/components/divider/divider';
import { AppIcon, type AppIconDefinition } from '../../../../shared/components/icon/icon';
import { Input as AppInput, type InputValue } from '../../../../shared/components/input/input';
import { Label } from '../../../../shared/components/label/label';
import { Loader } from '../../../../shared/components/loader/loader';
import { Select, type SelectOption, type SelectValue } from '../../../../shared/components/select/select';
import { ToastService } from '../../../../shared/components/toast/services/toast.service';
import { extractErrorMessage } from '../../../../shared/functions/api.functions';

import { WorkspaceService } from '../../services/workspace.service';

@Component({
  selector: 'app-add-edit-workspace-modal',
  standalone: true,
  imports: [FormsModule, AppIcon, AppInput, Button, Divider, Label, Loader, Select],
  templateUrl: './add-edit-workspace-modal.html',
  styleUrl: './add-edit-workspace-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditWorkspaceModal implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private readonly sessionEnd$ = new Subject<void>();
  private readonly authStore = inject(AuthStore);
  readonly authorization = signal<any | null>(null);
  get canEdit(): boolean { return this.isEdit ? canWorkspaceAction(this.authorization(), 'canEdit') : this.authStore.canCreateWorkspace(); }
  get canManageSettings(): boolean { return !this.isEdit || canWorkspaceAction(this.authorization(), 'canManageSettings'); }
  private readonly workspaceApi = inject(WorkspaceService);
  private readonly toastService = inject(ToastService);

  @ViewChild('workspaceNameInput', { read: ElementRef })
  private workspaceNameInput?: ElementRef<HTMLElement>;

  @Input() open = false;
  @Input() id = '';

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<string>();

  readonly LucideCheck = LucideCheck;
  readonly LucideFolder = LucideFolder;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideX = LucideX;

  readonly nameMinLength = 2;
  readonly nameMaxLength = 80;

  readonly loading = signal(false);
  readonly loadingData = signal(false);
  readonly name = signal('');
  readonly workspaceDescription = signal('');
  readonly visibility = signal<string>('PRIVATE');
  readonly isPersonal = signal(false);

  readonly visibilityOptions: readonly SelectOption[] = [
    { label: 'Private', value: 'PRIVATE' },
    { label: 'Invite only', value: 'INVITE_ONLY' },
    { label: 'Public', value: 'PUBLIC' }
  ];

  get isEdit(): boolean {
    return !!this.workspaceId;
  }

  get title(): string {
    return this.isEdit ? 'Edit workspace' : 'Create workspace';
  }

  get eyebrow(): string {
    return this.isEdit ? 'Quick workspace update' : 'A fresh sticky space';
  }

  get description(): string {
    return this.isEdit
      ? 'Update the workspace details without affecting anything inside it.'
      : 'Create a simple space for your notes, folders and ideas.';
  }

  get headerIcon(): AppIconDefinition {
    return this.isEdit ? this.LucidePencil : this.LucideFolder;
  }

  get submitIcon(): AppIconDefinition {
    return this.isEdit ? this.LucideCheck : this.LucidePlus;
  }

  get submitLabel(): string {
    return this.isEdit ? 'Save changes' : 'Create workspace';
  }

  get isBusy(): boolean {
    return this.loading() || this.loadingData();
  }

  get canSubmit(): boolean {
    const length = this.name().trim().length;

    return this.canEdit && !this.isBusy &&
      length >= this.nameMinLength &&
      length <= this.nameMaxLength;
  }

  private get workspaceId(): string {
    return String(this.id ?? '').trim();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.open) this.sessionEnd$.next();
    const opened = changes['open']?.currentValue === true;
    const workspaceChangedWhileOpen = this.open && !!changes['id'];

    if (opened || workspaceChangedWhileOpen) {
      this.initialize();
    }
  }

  updateName(value: InputValue): void {
    this.name.set(String(value ?? ''));
  }

  updateDescription(value: InputValue): void {
    this.workspaceDescription.set(String(value ?? ''));
  }

  updateVisibility(value: SelectValue): void {
    if (!this.canManageSettings) return;
    const visibility = this.asWorkspaceVisibility(value);

    if (visibility) {
      this.visibility.set(visibility);
    }
  }

  submit(): void {
    if (this.isBusy) return;
    if (!this.canEdit) { this.showError('You do not have permission to save this workspace.'); return; }

    const name = this.name().trim();
    const description = this.workspaceDescription().trim();

    if (name.length < this.nameMinLength) {
      this.showError(`Workspace name must contain at least ${this.nameMinLength} characters.`);
      this.focusName();
      return;
    }

    if (name.length > this.nameMaxLength) {
      this.showError(`Workspace name cannot be longer than ${this.nameMaxLength} characters.`);
      this.focusName();
      return;
    }

    const visibility = this.isPersonal()
      ? 'PRIVATE'
      : this.visibility();

    const updatePayload: any = {
      name,
      description: description || null,
      ...(this.canManageSettings ? { visibility } : {})
    };

    const createPayload: any = {
      name,
      description: description || null,
      visibility,
      isPersonal: false
    };

    this.loading.set(true);

    const request = this.isEdit
      ? this.workspaceApi.update(this.workspaceId, updatePayload)
      : this.workspaceApi.create(createPayload);

    request
      .pipe(
        takeUntil(this.sessionEnd$),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          const workspace = response.data;

          this.toastService.success(
            this.isEdit
              ? 'Workspace changes were saved.'
              : 'Workspace created successfully.',
            {
              title: this.isEdit ? 'Workspace updated' : 'Workspace created',
              dedupeKey: `workspace-saved-${workspace.id}`
            }
          );

          this.saved.emit(workspace.id);
        },
        error: error => {
          if (error?.status === 401 || error?.status === 403) this.authorization.set(null);
          this.showError(
            extractErrorMessage(
              error,
              this.isEdit
                ? 'Unable to update workspace.'
                : 'Unable to create workspace.'
            )
          );
        }
      });
  }

  close(): void {
    if (this.isBusy) {
      return;
    }

    this.closed.emit();
  }

  onBackdropMouseDown(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open && !this.isBusy) {
      this.close();
    }
  }

  private initialize(): void {
    this.sessionEnd$.next();
    this.authStore.loadGlobalPermissions();
    this.authorization.set(null);
    this.resetForm();

    if (!this.isEdit) {
      this.focusName();
      return;
    }

    this.loadWorkspace();
  }

  private loadWorkspace(): void {
    this.loadingData.set(true);

    this.workspaceApi
      .getById(this.workspaceId)
      .pipe(
        takeUntil(this.sessionEnd$),
        finalize(() => this.loadingData.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          const workspace = response.data;
          this.authorization.set(workspace);
          if (!this.canEdit) this.showError('You do not have permission to edit this workspace.');

          this.name.set(workspace.name ?? '');
          this.workspaceDescription.set(workspace.description ?? '');
          this.visibility.set(workspace.visibility);
          this.isPersonal.set(workspace.isPersonal === true);

          this.focusName();
        },
        error: error => {
          if (error?.status === 401 || error?.status === 403) this.authorization.set(null);
          this.showError(
            extractErrorMessage(
              error,
              'Unable to load this workspace.'
            )
          );
        }
      });
  }

  private resetForm(): void {
    this.loading.set(false);
    this.loadingData.set(false);
    this.name.set('');
    this.workspaceDescription.set('');
    this.visibility.set('PRIVATE');
    this.isPersonal.set(false);
  }

  private asWorkspaceVisibility(value: SelectValue): string | null {
    if (
      value === 'PRIVATE' ||
      value === 'INVITE_ONLY' ||
      value === 'PUBLIC'
    ) {
      return value;
    }

    return null;
  }

  private focusName(): void {
    setTimeout(() => {
      if (!this.open) {
        return;
      }

      const input = this.workspaceNameInput?.nativeElement.querySelector(
        'input:not([disabled])'
      ) as HTMLInputElement | null;

      if (!input) {
        return;
      }

      input.focus({ preventScroll: true });

      if (this.isEdit && input.value) {
        input.select();
      }
    });
  }

  private showError(message: string): void {
    this.toastService.error(message, {
      title: this.isEdit
        ? 'Could not update workspace'
        : 'Could not create workspace',
      dedupeKey: `workspace-error-${this.workspaceId || 'new'}-${message}`
    });
  }

}
