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
  computed,
  inject,
  signal
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideCheck, LucidePencil, LucidePlus, LucideStickyNote, LucideTrash2, LucideUserRound, LucideX } from '@lucide/angular';
import { concatMap, finalize, forkJoin, from, map, Observable, of, switchMap, tap, toArray } from 'rxjs';

import { Button } from '../../../../shared/components/button/button';
import { Divider } from '../../../../shared/components/divider/divider';
import { DatepickerInput } from '../../../../shared/components/datepicker-input/datepicker-input';
import { AppIcon } from '../../../../shared/components/icon/icon';
import { Input as AppInput } from '../../../../shared/components/input/input';
import { Label } from '../../../../shared/components/label/label';
import { Loader } from '../../../../shared/components/loader/loader';
import { Select, type SelectOption } from '../../../../shared/components/select/select';
import { Switch } from '../../../../shared/components/switch/switch';
import { ToastService } from '../../../../shared/components/toast/services/toast.service';

import { StickyNoteColumnApiService } from '../../services/sticky-note-column.service';
import { StickyNoteChecklistItemApiService } from '../../services/sticky-note-checklist-item.service';
import { StickyNoteChecklistApiService } from '../../services/sticky-note-checklist.service';
import { StickyNoteApiService } from '../../services/sticky-notes.service';

import type { WorkspaceMemberListItem } from '../../../workspace-members/models/workspace-member.models';
import { WorkspaceMemberApiService } from '../../../workspace-members/services/workspace-member.service';
import { extractList, idOf } from '../../../../shared/functions/common.function';

@Component({
  selector: 'app-add-edit-my-notes-modal',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AppIcon,
    AppInput,
    Button,
    Divider,
    DatepickerInput,
    Label,
    Loader,
    Select,
    Switch
  ],
  templateUrl: './add-edit-my-notes-modal.html',
  styleUrl: './add-edit-my-notes-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditMyNotesModal implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly stickyNoteApi = inject(StickyNoteApiService);
  private readonly columnApi = inject(StickyNoteColumnApiService);
  private readonly checklistApi = inject(StickyNoteChecklistApiService);
  private readonly checklistItemApi = inject(StickyNoteChecklistItemApiService);
  private readonly workspaceMemberApi = inject(WorkspaceMemberApiService);
  private readonly toastService = inject(ToastService);

  private workspaceId = '';
  private workspaceFolderId = '';
  private savedNoteId = '';
  private workspaceMemberRequestVersion = 0;
  private readonly originalChecklistIds = new Set<string>();
  private readonly originalItemIdsByChecklist = new Map<string, Set<string>>();

  @ViewChild('noteTitleInput', { read: ElementRef })
  private noteTitleInput?: ElementRef<HTMLElement>;

  @Input() open = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() id = '';

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<string>();

  readonly LucideCheck = LucideCheck;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideStickyNote = LucideStickyNote;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideUserRound = LucideUserRound;
  readonly LucideX = LucideX;

  readonly titleMaxLength = 120;
  readonly contentMaxLength = 2000;
  readonly checklistTitleMaxLength = 120;
  readonly checklistItemTitleMaxLength = 300;

  readonly loading = signal(false);
  readonly loadingData = signal(false);
  readonly loadingChecklist = signal(false);
  readonly loadingWorkspaceMembers = signal(false);
  readonly error = signal('');
  readonly columns = signal<any[]>([]);
  readonly workspaceMembers = signal<readonly WorkspaceMemberListItem[]>([]);
  readonly workspaceLabel = signal('');
  readonly folderLabel = signal('');

  readonly columnOptions = computed(() =>
    this.columns().map(column => ({
      label: column.name || 'Untitled column',
      value: this.idOf(column)
    }))
  );

  readonly workspaceMemberOptions = computed<readonly SelectOption[]>(() =>
    [...this.workspaceMembers()]
      .sort((first, second) => {
        if (first.isCurrentUser !== second.isCurrentUser) {
          return first.isCurrentUser ? -1 : 1;
        }

        return this.workspaceMemberName(first).localeCompare(
          this.workspaceMemberName(second),
          undefined,
          { sensitivity: 'base' }
        );
      })
      .map(member => {
        const name = this.workspaceMemberName(member);
        const role = this.workspaceMemberRole(member);
        const email = String(member.user?.email ?? '').trim();

        return {
          label: name,
          value: member.id,
          description: member.isCurrentUser
            ? `You · ${role}`
            : email
              ? `${role} · ${email}`
              : role,
          avatar: {
            src: this.workspaceMemberAvatar(member),
            name,
            initials: this.initials(name),
            shape: 'circle',
            bordered: true,
            elevated: false
          }
        } satisfies SelectOption;
      })
      .filter(option => Boolean(String(option.value ?? '').trim()))
  );

  readonly colorOptions = [
    { label: 'Yellow', value: 'YELLOW' },
    { label: 'Pink', value: 'PINK' },
    { label: 'Blue', value: 'BLUE' },
    { label: 'Green', value: 'GREEN' },
    { label: 'Orange', value: 'ORANGE' },
    { label: 'Purple', value: 'PURPLE' },
    { label: 'Red', value: 'RED' },
    { label: 'Brown', value: 'BROWN' },
    { label: 'Black', value: 'BLACK' }
  ];

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(this.titleMaxLength)]],
    content: ['', [Validators.maxLength(this.contentMaxLength)]],
    columnId: ['', Validators.required],
    color: ['YELLOW', Validators.required],
    noteDate: [''],
    workspaceMemberId: [''],
    withChecklist: [false],
    checklists: this.fb.array([])
  });

  get checklists(): FormArray {
    return this.form.get('checklists') as FormArray;
  }

  get modalTitle(): string {
    return this.mode === 'create' ? 'Create note' : 'Edit note';
  }

  get eyebrow(): string {
    return this.mode === 'create' ? 'A fresh sticky thought' : 'Tidy up this note';
  }

  get description(): string {
    const context = [this.workspaceLabel(), this.folderLabel()].filter(Boolean).join(' / ');
    return context || 'Keep this thought organised.';
  }

  get headerIcon() {
    return this.mode === 'create' ? this.LucideStickyNote : this.LucidePencil;
  }

  get submitIcon() {
    return this.mode === 'create' ? this.LucidePlus : this.LucideCheck;
  }

  get submitLabel(): string {
    return this.mode === 'create' ? 'Create note' : 'Save changes';
  }

  get isBusy(): boolean {
    return this.loading() || this.loadingData() || this.loadingChecklist();
  }

  get withChecklist(): boolean {
    return this.form.get('withChecklist')?.value === true;
  }

  get canSubmit(): boolean {
    return !this.isBusy && this.form.valid && (!this.withChecklist || this.hasValidChecklistStructure());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.open) return;

    if (
      changes['open']?.currentValue === true ||
      changes['id'] ||
      changes['mode']
    ) {
      this.initialize();
    }
  }

  updateText(controlName: 'title' | 'content', value: unknown): void {
    this.error.set('');
    this.form.get(controlName)?.setValue(String(value ?? ''));
  }

  updateSelect(
    controlName: 'columnId' | 'color' | 'workspaceMemberId',
    value: unknown
  ): void {
    this.error.set('');

    if (controlName === 'workspaceMemberId') {
      this.form.get(controlName)?.setValue(
        typeof value === 'string' ? value : ''
      );
      return;
    }

    if (typeof value !== 'string') return;

    if (controlName === 'color') {
      this.form.get(controlName)?.setValue(this.normalizeColor(value));
      return;
    }

    this.form.get(controlName)?.setValue(value);
  }

  setChecklistEnabled(enabled: boolean): void {
    if (this.isBusy || enabled === this.withChecklist) return;

    this.error.set('');
    this.form.get('withChecklist')?.setValue(enabled);

    if (enabled && this.checklists.length === 0) {
      this.addChecklist();
    }
  }

  addChecklist(): void {
    if (this.isBusy) return;

    this.form.get('withChecklist')?.setValue(true);
    this.checklists.push(this.createChecklistGroup());
  }

  removeChecklist(index: number): void {
    if (this.isBusy || index < 0 || index >= this.checklists.length) return;

    this.checklists.removeAt(index);

    if (this.checklists.length === 0) {
      this.form.get('withChecklist')?.setValue(false);
    }
  }

  updateChecklistTitle(checklistIndex: number, value: unknown): void {
    const checklist = this.checklistGroup(checklistIndex);
    if (!checklist) return;

    this.error.set('');
    checklist.get('title')?.setValue(String(value ?? ''));
  }

  addChecklistItem(checklistIndex: number): void {
    if (this.isBusy) return;

    this.checklistItems(checklistIndex)?.push(this.createChecklistItemGroup());
  }

  removeChecklistItem(checklistIndex: number, itemIndex: number): void {
    if (this.isBusy) return;

    const items = this.checklistItems(checklistIndex);
    if (!items || itemIndex < 0 || itemIndex >= items.length) return;

    items.removeAt(itemIndex);

    if (items.length === 0) {
      items.push(this.createChecklistItemGroup());
    }
  }

  updateChecklistItemTitle(checklistIndex: number, itemIndex: number, value: unknown): void {
    const item = this.checklistItemGroup(checklistIndex, itemIndex);
    if (!item) return;

    this.error.set('');
    item.get('title')?.setValue(String(value ?? ''));
  }

  toggleChecklistItem(checklistIndex: number, itemIndex: number): void {
    if (this.isBusy) return;

    const item = this.checklistItemGroup(checklistIndex, itemIndex);
    if (!item) return;

    item.get('isCompleted')?.setValue(item.get('isCompleted')?.value !== true);
  }

  checklistTitle(index: number): string {
    return String(this.checklistGroup(index)?.get('title')?.value ?? '');
  }

  checklistItemTitle(checklistIndex: number, itemIndex: number): string {
    return String(this.checklistItemGroup(checklistIndex, itemIndex)?.get('title')?.value ?? '');
  }

  checklistItemCompleted(checklistIndex: number, itemIndex: number): boolean {
    return this.checklistItemGroup(checklistIndex, itemIndex)?.get('isCompleted')?.value === true;
  }

  controlString(
    controlName:
      | 'title'
      | 'content'
      | 'columnId'
      | 'color'
      | 'noteDate'
      | 'workspaceMemberId'
  ): string {
    return String(this.form.get(controlName)?.value ?? '');
  }

  submit(): void {
    if (this.isBusy) return;

    this.error.set('');
    this.form.markAllAsTouched();

    const validationError = this.validateBeforeSave();

    if (validationError) {
      this.notifyError(validationError, 'Check note details');

      if (!this.controlString('title').trim()) {
        this.focusTitle();
      }

      return;
    }

    const title = this.controlString('title').trim();
    const content = this.controlString('content').trim();
    const columnId = this.controlString('columnId').trim();
    const color = this.normalizeColor(this.controlString('color'));
    const noteDate = this.toDateKey(this.controlString('noteDate'));

    /*
     * workspaceMemberId is intentionally kept as editor state only.
     * The supplied sticky-note API contract currently has no assignment/
     * workspaceMemberId field. Sending it now would make strict backend
     * validation reject an otherwise valid note save.
     */
    const workspaceMemberId = this.controlString('workspaceMemberId').trim();
    void workspaceMemberId;

    const createPayload = {
      workspaceId: this.workspaceId,
      workspaceFolderId: this.workspaceFolderId,
      columnId,
      title,
      content: content || title,
      color,
      noteDate
    };

    const updatePayload = {
      columnId,
      title,
      content: content || title,
      color,
      noteDate
    };

    this.loading.set(true);

    this.saveNote(createPayload, updatePayload)
      .pipe(
        tap(response => {
          this.savedNoteId = this.idOf(response.data);
        }),
        switchMap(response =>
          this.syncChecklists(this.idOf(response.data)).pipe(
            map(() => response.data)
          )
        ),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: note => {
          const noteId = this.idOf(note);

          this.toastService.success(
            this.mode === 'create' ? 'Your sticky note is ready.' : 'Your note changes were saved.',
            {
              title: this.mode === 'create' ? 'Note created' : 'Note updated',
              dedupeKey: `note-editor-saved-${noteId}`
            }
          );

          this.saved.emit(noteId);
        },
        error: error => {
          const message = this.errorMessage(error, 'Unable to save the note and its checklists.');
          this.notifyError(message, 'Could not save note');
        }
      });
  }

  close(): void {
    if (this.isBusy) return;

    this.error.set('');
    this.closed.emit();
  }

  onBackdropMouseDown(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open && !this.isBusy) this.close();
  }

  private initialize(): void {
    this.resetEditor();

    const id = String(this.id ?? '').trim();

    if (!id) {
      this.loadingData.set(false);
      this.notifyError(
        this.mode === 'create'
          ? 'A column id is required to create a note.'
          : 'A note id is required to edit a note.',
        'Could not open note editor'
      );
      return;
    }

    this.loadingData.set(true);

    if (this.mode === 'edit') {
      this.loadNote(id);
      return;
    }

    this.loadCreateContext(id);
  }

  private loadNote(noteId: string): void {
    this.stickyNoteApi
      .getById(noteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const note = response.data;

          this.workspaceId = this.referenceId(note?.workspaceId);
          this.workspaceFolderId = this.referenceId(note?.workspaceFolderId);
          this.workspaceLabel.set(this.referenceLabel(note?.workspaceId));
          this.folderLabel.set(this.referenceLabel(note?.workspaceFolderId));
          this.savedNoteId = this.idOf(note);

          this.form.patchValue({
            title: String(note?.title ?? ''),
            content: this.noteContent(note),
            columnId: this.referenceId(note?.columnId),
            color: this.normalizeColor(note?.color),
            noteDate: this.toDateKey(note?.noteDate) ?? '',
            workspaceMemberId: '',
            withChecklist: false
          });

          if (!this.workspaceId || !this.workspaceFolderId) {
            this.loadingData.set(false);
            this.notifyError('Unable to resolve this note workspace and folder.', 'Could not open note editor');
            return;
          }

          this.loadWorkspaceMembers(this.workspaceId);
          this.loadColumns(this.referenceId(note?.columnId));
          this.loadChecklists(note, noteId);
        },
        error: error => {
          this.loadingData.set(false);
          this.handleLoadError(error, 'Unable to load this note.');
        }
      });
  }

  private loadCreateContext(columnId: string): void {
    this.columnApi
      .getById(columnId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const column = response.data;

          this.workspaceId = this.referenceId(column?.workspaceId);
          this.workspaceFolderId = this.referenceId(column?.workspaceFolderId);
          this.workspaceLabel.set(this.referenceLabel(column?.workspaceId));
          this.folderLabel.set(this.referenceLabel(column?.workspaceFolderId));

          this.form.patchValue({
            columnId: this.idOf(column) || columnId,
            color: this.normalizeColor(column?.color)
          });

          if (!this.workspaceId || !this.workspaceFolderId) {
            this.loadingData.set(false);
            this.notifyError('Unable to resolve this column workspace and folder.', 'Could not open note editor');
            return;
          }

          this.loadWorkspaceMembers(this.workspaceId);
          this.loadColumns(this.idOf(column) || columnId);
        },
        error: error => {
          this.loadingData.set(false);
          this.handleLoadError(error, 'Unable to load the selected column.');
        }
      });
  }

  private loadWorkspaceMembers(workspaceId: string): void {
    const id = String(workspaceId ?? '').trim();
    const requestVersion = ++this.workspaceMemberRequestVersion;

    this.workspaceMembers.set([]);

    if (!id) {
      this.loadingWorkspaceMembers.set(false);
      return;
    }

    this.loadingWorkspaceMembers.set(true);

    this.workspaceMemberApi
      .getAll({
        workspaceId: id,
        status: 'ACTIVE',
        page: 1,
        limit: 100,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (
            requestVersion !== this.workspaceMemberRequestVersion ||
            this.workspaceId !== id
          ) {
            return;
          }

          this.workspaceMembers.set(response.data ?? []);
          this.loadingWorkspaceMembers.set(false);
        },
        error: error => {
          if (
            requestVersion !== this.workspaceMemberRequestVersion ||
            this.workspaceId !== id
          ) {
            return;
          }

          console.error(error);
          this.workspaceMembers.set([]);
          this.loadingWorkspaceMembers.set(false);
        }
      });
  }

  private loadColumns(selectedColumnId: string): void {
    this.columnApi
      .getByWorkspaceFolder(this.workspaceId, this.workspaceFolderId)
      .pipe(
        finalize(() => this.loadingData.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          const columns = [...(response.data ?? [])]
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

          this.columns.set(columns);

          const selectedExists = columns.some(column => this.idOf(column) === selectedColumnId);

          if (!selectedExists && columns.length) {
            const fallback = columns.find(column => column.type !== 'COMPLETED') ?? columns[0];

            this.form.patchValue({
              columnId: this.idOf(fallback),
              color: this.mode === 'create'
                ? this.normalizeColor(fallback.color)
                : this.controlString('color')
            });
          }

          this.focusTitle();
        },
        error: error => {
          this.columns.set([]);
          this.handleLoadError(error, 'Unable to load note columns.');
        }
      });
  }

  private loadChecklists(note: any, noteId: string): void {
    const nested = this.noteChecklists(note);

    if (nested !== null) {
      this.applyChecklists(nested);
      return;
    }

    this.loadingChecklist.set(true);

    this.checklistApi
      .getByStickyNote(noteId, {
        page: 1,
        limit: 100,
        sortBy: 'position',
        sortOrder: 'asc'
      })
      .pipe(
        switchMap(response => {
          const checklists = this.extractList(response)
            .filter(item => item.status !== 'DELETED')
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

          if (!checklists.length) return of([]);

          return forkJoin(
            checklists.map(checklist =>
              this.checklistItemApi
                .getByChecklist(this.idOf(checklist), {
                  page: 1,
                  limit: 250,
                  sortBy: 'position',
                  sortOrder: 'asc'
                })
                .pipe(
                  map(response => ({
                    ...checklist,
                    items: this.extractList(response)
                      .filter(item => item.status !== 'DELETED')
                      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                  }))
                )
            )
          );
        }),
        finalize(() => this.loadingChecklist.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: checklists => this.applyChecklists(checklists),
        error: error => this.handleLoadError(error, 'Unable to load this note checklists.')
      });
  }

  private applyChecklists(checklists: any[]): void {
    this.checklists.clear();
    this.originalChecklistIds.clear();
    this.originalItemIdsByChecklist.clear();

    [...checklists]
      .filter(checklist => checklist?.status !== 'DELETED')
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .forEach(checklist => {
        const checklistId = this.idOf(checklist);
        const items = Array.isArray(checklist.items)
          ? [...checklist.items]
            .filter(item => item?.status !== 'DELETED')
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          : [];

        if (checklistId) {
          this.originalChecklistIds.add(checklistId);
          this.originalItemIdsByChecklist.set(
            checklistId,
            new Set(items.map(item => this.idOf(item)).filter(Boolean))
          );
        }

        this.checklists.push(
          this.createChecklistGroup({
            id: checklistId,
            title: checklist.title ?? '',
            items
          })
        );
      });

    this.form.get('withChecklist')?.setValue(this.checklists.length > 0);
  }

  private saveNote(createPayload: any, updatePayload: any) {
    if (this.mode === 'create' && !this.savedNoteId) {
      return this.stickyNoteApi.create(createPayload);
    }

    const noteId = this.savedNoteId || this.id;

    if (!noteId) {
      throw new Error('Cannot update note because its id is missing.');
    }

    return this.stickyNoteApi.update(noteId, updatePayload);
  }

  private syncChecklists(noteId: string): Observable<void> {
    const groups = this.withChecklist
      ? this.checklists.controls.map(control => control as FormGroup)
      : [];

    const currentIds = new Set(
      groups.map(group => String(group.get('id')?.value ?? '')).filter(Boolean)
    );

    const removedChecklistIds = [...this.originalChecklistIds]
      .filter(id => !currentIds.has(id));

    const saveCurrent$ = groups.length
      ? from(groups).pipe(
        concatMap((group, position) =>
          this.saveChecklist(noteId, group, position)
        ),
        toArray(),
        map(() => void 0)
      )
      : of(void 0);

    return saveCurrent$.pipe(
      switchMap(() => this.deleteChecklistTrees(removedChecklistIds)),
      tap(() => {
        removedChecklistIds.forEach(id => {
          this.originalChecklistIds.delete(id);
          this.originalItemIdsByChecklist.delete(id);
        });
      })
    );
  }

  private saveChecklist(noteId: string, group: FormGroup, position: number): Observable<void> {
    const existingId = String(group.get('id')?.value ?? '');
    const title = String(group.get('title')?.value ?? '').trim();

    const request = existingId
      ? this.checklistApi.update(existingId, { title, position })
      : this.checklistApi.create({ stickyNoteId: noteId, title, position });

    return request.pipe(
      map(response => this.idOf(response.data)),
      tap(checklistId => {
        if (!checklistId) {
          throw new Error('Checklist id was not returned by the server.');
        }

        group.get('id')?.setValue(checklistId, { emitEvent: false });
        this.originalChecklistIds.add(checklistId);

        if (!this.originalItemIdsByChecklist.has(checklistId)) {
          this.originalItemIdsByChecklist.set(checklistId, new Set());
        }
      }),
      switchMap(checklistId => this.syncChecklistItems(group, checklistId))
    );
  }

  private syncChecklistItems(group: FormGroup, checklistId: string): Observable<void> {
    const items = group.get('items') as FormArray;
    const rows = items.controls.map((control, position) => {
      const item = control as FormGroup;

      return {
        group: item,
        position,
        id: String(item.get('id')?.value ?? ''),
        title: String(item.get('title')?.value ?? '').trim(),
        isCompleted: item.get('isCompleted')?.value === true,
        initialCompleted: item.get('initialCompleted')?.value === true
      };
    });

    const originalIds = this.originalItemIdsByChecklist.get(checklistId) ?? new Set<string>();
    const currentIds = new Set(rows.map(row => row.id).filter(Boolean));
    const removedIds = [...originalIds].filter(id => !currentIds.has(id));

    const saveRows$ = rows.length
      ? from(rows).pipe(
        concatMap(row => this.saveChecklistItem(checklistId, row)),
        toArray(),
        map(() => void 0)
      )
      : of(void 0);

    return saveRows$.pipe(
      switchMap(() => this.deleteChecklistItems(removedIds)),
      tap(() => {
        removedIds.forEach(id => originalIds.delete(id));
        this.originalItemIdsByChecklist.set(checklistId, originalIds);
      })
    );
  }

  private saveChecklistItem(checklistId: string, row: any): Observable<unknown> {
    if (row.id) {
      let request: Observable<unknown> = this.checklistItemApi.update(row.id, {
        title: row.title,
        position: row.position
      });

      if (row.isCompleted !== row.initialCompleted) {
        request = request.pipe(
          switchMap(() =>
            this.checklistItemApi.updateCompletion(row.id, row.isCompleted)
          ),
          tap(() => {
            row.group.get('initialCompleted')?.setValue(row.isCompleted, {
              emitEvent: false
            });
          })
        );
      }

      return request;
    }

    return this.checklistItemApi
      .create({
        checklistId,
        title: row.title,
        position: row.position
      })
      .pipe(
        tap(response => {
          const itemId = this.idOf(response.data);

          if (!itemId) {
            throw new Error('Checklist item id was not returned by the server.');
          }

          row.group.get('id')?.setValue(itemId, { emitEvent: false });

          const ids = this.originalItemIdsByChecklist.get(checklistId) ?? new Set<string>();
          ids.add(itemId);
          this.originalItemIdsByChecklist.set(checklistId, ids);
        }),
        switchMap(response => {
          const itemId = this.idOf(response.data);

          if (!row.isCompleted) return of(response);

          return this.checklistItemApi
            .updateCompletion(itemId, true)
            .pipe(
              tap(() => {
                row.group.get('initialCompleted')?.setValue(true, {
                  emitEvent: false
                });
              })
            );
        })
      );
  }

  private deleteChecklistTrees(checklistIds: string[]): Observable<void> {
    if (!checklistIds.length) return of(void 0);

    return from(checklistIds).pipe(
      concatMap(checklistId =>
        this.deleteChecklistItems([
          ...(this.originalItemIdsByChecklist.get(checklistId) ?? [])
        ]).pipe(
          switchMap(() => this.checklistApi.delete(checklistId))
        )
      ),
      toArray(),
      map(() => void 0)
    );
  }

  private deleteChecklistItems(itemIds: string[]): Observable<void> {
    if (!itemIds.length) return of(void 0);

    return from(itemIds).pipe(
      concatMap(itemId => this.checklistItemApi.delete(itemId)),
      toArray(),
      map(() => void 0)
    );
  }

  private createChecklistGroup(value: any = {}): FormGroup {
    const items = Array.isArray(value.items) && value.items.length
      ? value.items.map((item: any) =>
        this.createChecklistItemGroup({
          id: this.idOf(item),
          title: item.title ?? '',
          isCompleted: item.isCompleted === true,
          initialCompleted: item.isCompleted === true
        })
      )
      : [this.createChecklistItemGroup()];

    return this.fb.group({
      id: [value.id ?? ''],
      title: [
        value.title ?? '',
        [Validators.maxLength(this.checklistTitleMaxLength)]
      ],
      items: this.fb.array(items)
    });
  }

  private createChecklistItemGroup(value: any = {}): FormGroup {
    return this.fb.group({
      id: [value.id ?? ''],
      title: [
        value.title ?? '',
        [Validators.maxLength(this.checklistItemTitleMaxLength)]
      ],
      isCompleted: [value.isCompleted ?? false],
      initialCompleted: [value.initialCompleted ?? false]
    });
  }

  private checklistGroup(index: number): FormGroup | null {
    const control = this.checklists.at(index);
    return control ? (control as FormGroup) : null;
  }

  checklistItems(index: number): FormArray | null {
    return (this.checklistGroup(index)?.get('items') as FormArray | null) ?? null;
  }

  private checklistItemGroup(checklistIndex: number, itemIndex: number): FormGroup | null {
    const item = this.checklistItems(checklistIndex)?.at(itemIndex);
    return item ? (item as FormGroup) : null;
  }

  private validateBeforeSave(): string | null {
    if (!this.controlString('title').trim()) return 'Enter a note title.';
    if (!this.controlString('columnId').trim()) return 'Choose a column for this note.';
    if (!this.workspaceId || !this.workspaceFolderId) {
      return 'Unable to resolve the note workspace and folder.';
    }

    if (!this.withChecklist) return null;
    if (!this.checklists.length) return 'Add at least one checklist.';

    const checklistTitles = new Set<string>();

    for (let checklistIndex = 0; checklistIndex < this.checklists.length; checklistIndex++) {
      const checklist = this.checklistGroup(checklistIndex);
      const title = String(checklist?.get('title')?.value ?? '').trim();

      if (!title) return `Enter a title for checklist ${checklistIndex + 1}.`;

      const normalizedChecklistTitle = title.toLowerCase();
      if (checklistTitles.has(normalizedChecklistTitle)) {
        return `Checklist "${title}" is repeated. Use a different title.`;
      }

      checklistTitles.add(normalizedChecklistTitle);

      const items = this.checklistItems(checklistIndex);
      if (!items?.length) return `Add at least one item to "${title}".`;

      const itemTitles = new Set<string>();
      let validItemCount = 0;

      for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        const itemTitle = String(
          (items.at(itemIndex) as FormGroup).get('title')?.value ?? ''
        ).trim();

        if (!itemTitle) continue;

        validItemCount++;

        const normalizedItemTitle = itemTitle.toLowerCase();
        if (itemTitles.has(normalizedItemTitle)) {
          return `"${itemTitle}" is repeated inside "${title}".`;
        }

        itemTitles.add(normalizedItemTitle);
      }

      if (!validItemCount) return `Add at least one item to "${title}".`;

      if (validItemCount !== items.length) {
        return `Remove empty items from "${title}" before saving.`;
      }
    }

    return null;
  }

  private hasValidChecklistStructure(): boolean {
    if (!this.checklists.length) return false;

    const checklistTitles = new Set<string>();

    for (let checklistIndex = 0; checklistIndex < this.checklists.length; checklistIndex++) {
      const checklist = this.checklistGroup(checklistIndex);
      const title = String(checklist?.get('title')?.value ?? '').trim();
      const items = this.checklistItems(checklistIndex);

      if (!title || !items?.length) return false;

      const normalizedChecklistTitle = title.toLowerCase();
      if (checklistTitles.has(normalizedChecklistTitle)) return false;
      checklistTitles.add(normalizedChecklistTitle);

      const itemTitles = new Set<string>();

      for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        const itemTitle = String(
          (items.at(itemIndex) as FormGroup).get('title')?.value ?? ''
        ).trim();

        if (!itemTitle) return false;

        const normalizedItemTitle = itemTitle.toLowerCase();
        if (itemTitles.has(normalizedItemTitle)) return false;
        itemTitles.add(normalizedItemTitle);
      }
    }

    return true;
  }

  private noteChecklists(note: any): any[] | null {
    if (Array.isArray(note?.checklists)) return note.checklists;
    if (note?.checklist) return [note.checklist];
    if (note && Object.prototype.hasOwnProperty.call(note, 'checklists')) return [];
    if (note && Object.prototype.hasOwnProperty.call(note, 'checklist')) return [];

    return null;
  }

  private resetEditor(): void {
    this.workspaceId = '';
    this.workspaceFolderId = '';
    this.savedNoteId = '';
    this.originalChecklistIds.clear();
    this.originalItemIdsByChecklist.clear();
    this.columns.set([]);
    this.workspaceMembers.set([]);
    this.workspaceMemberRequestVersion++;
    this.loadingWorkspaceMembers.set(false);
    this.workspaceLabel.set('');
    this.folderLabel.set('');
    this.error.set('');
    this.loading.set(false);
    this.loadingChecklist.set(false);
    this.checklists.clear();

    this.form.reset({
      title: '',
      content: '',
      columnId: '',
      color: 'YELLOW',
      noteDate: '',
      workspaceMemberId: '',
      withChecklist: false
    });
  }

  private noteContent(note: any): string {
    const content = String(note?.content ?? '').trim();
    const title = String(note?.title ?? '').trim();

    return content === title ? '' : content;
  }

  private extractList(response: any): any[] {
    return extractList(response);
  }

  private idOf(value: any): string {
    return idOf(value);
  }

  private referenceId(value: any): string {
    return this.idOf(value);
  }

  private referenceLabel(value: any): string {
    if (!value || typeof value === 'string') return '';

    return String(value.name ?? value.label ?? '').trim();
  }

  private workspaceMemberName(member: WorkspaceMemberListItem): string {
    const displayName = String(member.user?.displayName ?? '').trim();
    const email = String(member.user?.email ?? '').trim();

    if (displayName) return displayName;
    if (email) return email.split('@')[0] || email;

    return 'Workspace member';
  }

  private workspaceMemberRole(member: WorkspaceMemberListItem): string {
    return String(
      member.role?.name ??
      member.role?.code ??
      'Member'
    ).trim();
  }

  private workspaceMemberAvatar(member: WorkspaceMemberListItem): string | null {
    /*
     * The lightweight member contract currently does not require an avatar,
     * but this fallback makes the dropdown automatically use one if the API
     * starts returning it later. Otherwise app-select shows initials.
     */
    const user = member.user as unknown as Record<string, unknown>;
    const profile = user?.['profile'] as Record<string, unknown> | undefined;

    const value =
      user?.['avatarUrl'] ??
      user?.['profileImage'] ??
      user?.['imageUrl'] ??
      profile?.['avatarUrl'] ??
      profile?.['profileImage'];

    return typeof value === 'string' && value.trim()
      ? value.trim()
      : null;
  }

  private initials(name: string): string {
    const words = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!words.length) return '?';

    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  private toDateKey(value: unknown): string | null {
    const normalized = String(value ?? '').trim();

    if (!normalized) return null;

    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);

    return match
      ? `${match[1]}-${match[2]}-${match[3]}`
      : null;
  }

  private normalizeColor(value: unknown):
    'YELLOW' | 'PINK' | 'BLUE' | 'GREEN' | 'ORANGE' | 'PURPLE' | 'RED' | 'BROWN' | 'BLACK' {
    switch (value) {
      case 'PINK':
      case 'BLUE':
      case 'GREEN':
      case 'ORANGE':
      case 'PURPLE':
      case 'RED':
      case 'BROWN':
      case 'BLACK':
        return value;
      default:
        return 'YELLOW';
    }
  }

  private handleLoadError(error: unknown, fallback: string): void {
    this.notifyError(
      this.errorMessage(error, fallback),
      'Could not open note editor'
    );
  }

  private notifyError(message: string, title: string): void {
    this.error.set(message);

    this.toastService.error(message, {
      title,
      dedupeKey: `note-editor-${this.mode}-${this.id || 'new'}-${message}`
    });
  }

  private errorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }

  private focusTitle(): void {
    setTimeout(() => {
      if (!this.open) return;

      const input = this.noteTitleInput?.nativeElement.querySelector(
        'input:not([disabled])'
      ) as HTMLInputElement | null;

      if (!input) return;

      input.focus({ preventScroll: true });

      if (this.mode === 'edit' && input.value) {
        input.setSelectionRange(0, input.value.length);
      }
    });
  }
}