import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import {
  forkJoin,
} from 'rxjs';

import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCalendarDays,
  LucideCheck,
  LucideCheckCircle2,
  LucideClock3,
  LucideGripVertical,
  LucidePlus,
  LucideX,
  LucideZap,
} from '@lucide/angular';

import {
  AppIcon,
} from '../../shared/components/icon/icon';
import {
  Avatar,
} from '../../shared/components/avatar/avatar';
import {
  Badge,
} from '../../shared/components/badge/badge';
import {
  Button,
} from '../../shared/components/button/button';
import {
  Checkbox,
} from '../../shared/components/checkbox/checkbox';
import {
  Divider,
} from '../../shared/components/divider/divider';
import {
  Label,
} from '../../shared/components/label/label';
import {
  StickyCard,
} from '../../shared/components/sticky-card/sticky-card';

import {
  WorkspaceFolderStore,
} from '../workspacefolders/services/workspace-folder.store';

import type {
  KanbanColumn,
  KanbanFolder,
  KanbanNote,
  KanbanStatus,
  StickyNote,
  StickyNoteColor,
  StickyNoteColumn,
  StickyNoteColumnColor,
  StickyNoteColumnType,
} from './models/mynotes.interface';

import {
  StickyNoteColumnApiService,
} from './services/sticky-note-column.service';
import { StickyNoteApiService } from './services/sticky-notes.service';



@Component({
  standalone: true,
  selector: 'app-mynotes',
  imports: [
    DragDropModule,
    AppIcon,
    Avatar,
    Badge,
    Button,
    Checkbox,
    Divider,
    Label,
    StickyCard,
  ],
  templateUrl: './mynotes.html',
  styleUrl: './mynotes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyNotes implements AfterViewInit {
  private readonly destroyRef =
    inject(DestroyRef);

  private readonly workspaceFolderStore =
    inject(WorkspaceFolderStore);

  private readonly stickyNoteColumnApiService =
    inject(StickyNoteColumnApiService);

  private readonly stickyNoteApiService =
    inject(StickyNoteApiService);

  @Input()
  heading = 'My Board';

  @Input()
  description =
    'Capture ideas, stay organized, and get things done.';

  @Input()
  focusTitle =
    'Finish the homepage story';

  @Input()
  focusCompletedSteps = 3;

  @Input()
  focusTotalSteps = 5;

  @Input()
  subscriptionUrl = '/pricing';

  @Input()
  showAdvertisement = true;

  @Input()
  adsenseClient = '';

  @Input()
  adsenseSlot = '';

  @Input()
  set initialNotes(
    value:
      | readonly KanbanNote[]
      | null
      | undefined,
  ) {
    if (!value) {
      return;
    }

    this.notes.set(
      value.map(
        note => this.copyNote(note),
      ),
    );

    this.bindLegacyNoteColumns();
  }

  @Output()
  readonly noteAdded =
    new EventEmitter<KanbanNote>();

  @Output()
  readonly noteMoved =
    new EventEmitter<KanbanNote>();

  @Output()
  readonly noteChanged =
    new EventEmitter<KanbanNote>();

  @Output()
  readonly folderAdded =
    new EventEmitter<KanbanFolder>();

  @Output()
  readonly subscribeRequested =
    new EventEmitter<void>();

  readonly LucideArrowLeft =
    LucideArrowLeft;

  readonly LucideArrowRight =
    LucideArrowRight;

  readonly LucideCalendarDays =
    LucideCalendarDays;

  readonly LucideCheck =
    LucideCheck;

  readonly LucideCheckCircle2 =
    LucideCheckCircle2;

  readonly LucideClock3 =
    LucideClock3;

  readonly LucideGripVertical =
    LucideGripVertical;

  readonly LucidePlus =
    LucidePlus;

  readonly LucideX =
    LucideX;

  readonly LucideZap =
    LucideZap;

  private readonly columnsState =
    signal<readonly KanbanColumn[]>([]);

  get columns(): readonly KanbanColumn[] {
    return this.columnsState();
  }

  readonly loadingColumns =
    signal(false);

  readonly columnsError =
    signal<string | null>(null);

  readonly notes =
    signal<KanbanNote[]>([]);

  readonly loadingNotes =
    signal(false);

  readonly notesError =
    signal<string | null>(null);

  readonly creatingNote =
    signal(false);

  readonly folders =
    computed<KanbanFolder[]>(
      () => {
        return this.workspaceFolderStore
          .folders()
          .filter(
            folder =>
              folder.status === 'ACTIVE',
          )
          .sort(
            (first, second) =>
              first.position -
              second.position,
          )
          .map(
            folder => ({
              id: folder._id,
              label: folder.name,
            }),
          );
      },
    );

  readonly loadingFolders =
    this.workspaceFolderStore.loading;

  readonly foldersInitialized =
    this.workspaceFolderStore.initialized;

  readonly foldersError =
    this.workspaceFolderStore.error;

  readonly activeFolder =
    signal<string | null>(null);

  readonly folderComposerOpen =
    signal(false);

  readonly composerColumn =
    signal<string | null>(null);

  readonly activeNoteCount =
    computed(
      () => {
        const completedColumn =
          this.getCompletedColumn();

        const notes =
          this.notesForActiveFolder();

        if (!completedColumn) {
          return notes.length;
        }

        return notes.filter(
          note =>
            this.resolveNoteColumnId(note) !==
            completedColumn.id,
        ).length;
      },
    );

  private readonly currentDate =
    new Date();

  readonly todayLabel =
    new Intl.DateTimeFormat(
      'en-US',
      {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      },
    ).format(
      this.currentDate,
    );

  readonly todayIso = [
    this.currentDate.getFullYear(),
    String(
      this.currentDate.getMonth() + 1,
    ).padStart(
      2,
      '0',
    ),
    String(
      this.currentDate.getDate(),
    ).padStart(
      2,
      '0',
    ),
  ].join('-');

  draftTitle = '';

  draftFolderName = '';

  private columnRequestVersion = 0;

  private noteRequestVersion = 0;

  constructor() {
    effect(
      () => {
        const workspaceId =
          this.workspaceFolderStore.workspaceId();

        const folders =
          this.folders();

        const activeFolderId =
          this.activeFolder();

        if (
          !workspaceId ||
          folders.length === 0
        ) {
          ++this.columnRequestVersion;
          ++this.noteRequestVersion;

          this.activeFolder.set(null);
          this.columnsState.set([]);
          this.notes.set([]);

          return;
        }

        const currentFolderExists =
          activeFolderId &&
          folders.some(
            folder =>
              folder.id === activeFolderId,
          );

        if (currentFolderExists) {
          return;
        }

        const defaultFolder =
          this.workspaceFolderStore.defaultFolder();

        const defaultFolderExists =
          defaultFolder &&
          folders.some(
            folder =>
              folder.id ===
              defaultFolder._id,
          );

        this.activeFolder.set(
          defaultFolderExists
            ? defaultFolder._id
            : folders[0]?.id ?? null,
        );
      },
      {
        allowSignalWrites: true,
      },
    );

    effect(
      () => {
        const workspaceId =
          this.workspaceFolderStore.workspaceId();

        const workspaceFolderId =
          this.activeFolder();

        if (
          !workspaceId ||
          !workspaceFolderId
        ) {
          ++this.columnRequestVersion;
          ++this.noteRequestVersion;

          this.columnsState.set([]);
          this.notes.set([]);

          this.loadingColumns.set(false);
          this.loadingNotes.set(false);

          return;
        }

        this.loadColumns(
          workspaceId,
          workspaceFolderId,
        );

        this.loadNotes(
          workspaceId,
          workspaceFolderId,
        );
      },
      {
        allowSignalWrites: true,
      },
    );
  }

  get focusProgress(): number {
    const total =
      Math.max(
        1,
        this.focusTotalSteps,
      );

    const completed =
      Math.min(
        Math.max(
          0,
          this.focusCompletedSteps,
        ),
        total,
      );

    return Math.round(
      (completed / total) * 100,
    );
  }

  ngAfterViewInit(): void {
    this.requestAdvertisementRender();
  }

  selectFolder(
    folder: KanbanFolder,
  ): void {
    if (
      this.activeFolder() ===
      folder.id
    ) {
      return;
    }

    this.activeFolder.set(
      folder.id,
    );

    this.closeComposer();
  }

  notesFor(
    columnIdOrStatus: string,
  ): KanbanNote[] {
    const columnId =
      this.resolveRequestedColumnId(
        columnIdOrStatus,
      );

    if (!columnId) {
      return [];
    }

    return this.notes().filter(
      note =>
        this.resolveNoteColumnId(note) ===
        columnId,
    );
  }

  visibleNotesFor(
    columnIdOrStatus: string,
  ): KanbanNote[] {
    const folderId =
      this.activeFolder();

    if (!folderId) {
      return [];
    }

    const columnId =
      this.resolveRequestedColumnId(
        columnIdOrStatus,
      );

    if (!columnId) {
      return [];
    }

    return this.notes().filter(
      note =>
        this.resolveNoteFolder(note) ===
        folderId &&
        this.resolveNoteColumnId(note) ===
        columnId,
    );
  }

  columnCount(
    columnIdOrStatus: string,
  ): number {
    return this.visibleNotesFor(
      columnIdOrStatus,
    ).length;
  }

  folderCount(
    folderId: string,
  ): number {
    return this.notes()
      .filter(
        note =>
          this.resolveNoteFolder(note) ===
          folderId,
      )
      .length;
  }

  totalNoteCount(): number {
    return this.notesForActiveFolder()
      .length;
  }

  completedNoteCount(): number {
    const completedColumn =
      this.getCompletedColumn();

    if (!completedColumn) {
      return 0;
    }

    return this.notesForActiveFolder()
      .filter(
        note =>
          this.resolveNoteColumnId(note) ===
          completedColumn.id,
      )
      .length;
  }

  remainingNoteCount(): number {
    return Math.max(
      0,
      this.totalNoteCount() -
      this.completedNoteCount(),
    );
  }

  completionPercentage(): number {
    const total =
      this.totalNoteCount();

    if (total === 0) {
      return 0;
    }

    return Math.round(
      (
        this.completedNoteCount() /
        total
      ) * 100,
    );
  }

  openFolderComposer(): void {
    this.draftFolderName = '';

    this.folderComposerOpen.set(
      true,
    );
  }

  closeFolderComposer(): void {
    this.draftFolderName = '';

    this.folderComposerOpen.set(
      false,
    );
  }

  updateFolderDraft(
    event: Event,
  ): void {
    this.draftFolderName =
      (
        event.target as HTMLInputElement
      ).value;
  }

  addFolder(): void {
    const label =
      this.draftFolderName.trim();

    if (!label) {
      return;
    }

    const workspaceId =
      this.workspaceFolderStore.workspaceId();

    if (!workspaceId) {
      return;
    }

    const folder: KanbanFolder = {
      id: `new-${Date.now()}`,
      label,
    };

    this.folderAdded.emit({
      ...folder,
    });

    this.closeFolderComposer();
  }

  openComposer(
    columnIdOrStatus: string,
  ): void {
    const columnId =
      this.resolveRequestedColumnId(
        columnIdOrStatus,
      );

    if (!columnId) {
      return;
    }

    this.draftTitle = '';

    this.composerColumn.set(
      columnId,
    );
  }

  closeComposer(): void {
    this.draftTitle = '';

    this.composerColumn.set(
      null,
    );
  }

  updateDraft(
    event: Event,
  ): void {
    this.draftTitle =
      (
        event.target as HTMLInputElement
      ).value;
  }

  addNote(
    columnIdOrStatus: string,
  ): void {
    if (this.creatingNote()) {
      return;
    }

    const title =
      this.draftTitle.trim();

    if (!title) {
      return;
    }

    const workspaceId =
      this.workspaceFolderStore.workspaceId();

    const workspaceFolderId =
      this.activeFolder();

    if (
      !workspaceId ||
      !workspaceFolderId
    ) {
      return;
    }

    const columnId =
      this.resolveRequestedColumnId(
        columnIdOrStatus,
      );

    if (!columnId) {
      return;
    }

    const column =
      this.getColumn(columnId);

    if (!column) {
      return;
    }

    this.creatingNote.set(true);
    this.notesError.set(null);

    this.stickyNoteApiService
      .create({
        workspaceId,
        workspaceFolderId,
        columnId,
        title,
        content: title,
        color:
          column.color ??
          'YELLOW',
      })
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({
        next: response => {
          const note =
            this.mapStickyNote(
              response.data,
            );

          this.notes.update(
            notes => [
              ...notes,
              note,
            ],
          );

          this.noteAdded.emit(
            this.copyNote(note),
          );

          this.creatingNote.set(false);

          this.closeComposer();
        },
        error: error => {
          this.creatingNote.set(false);

          this.notesError.set(
            error?.error?.message ??
            error?.message ??
            'Unable to create sticky note.',
          );
        },
      });
  }

  moveBackward(
    note: KanbanNote,
  ): void {
    const columnId =
      this.resolveNoteColumnId(
        note,
      );

    const index =
      this.columnIndex(columnId);

    if (index <= 0) {
      return;
    }

    const previousColumn =
      this.columns[index - 1];

    if (!previousColumn) {
      return;
    }

    this.moveNote(
      note.id,
      previousColumn.id,
    );
  }

  moveForward(
    note: KanbanNote,
  ): void {
    const columnId =
      this.resolveNoteColumnId(
        note,
      );

    const index =
      this.columnIndex(columnId);

    if (
      index < 0 ||
      index >=
      this.columns.length - 1
    ) {
      return;
    }

    const nextColumn =
      this.columns[index + 1];

    if (!nextColumn) {
      return;
    }

    this.moveNote(
      note.id,
      nextColumn.id,
    );
  }

  canMoveBackward(
    note: KanbanNote,
  ): boolean {
    const columnId =
      this.resolveNoteColumnId(
        note,
      );

    return (
      this.columnIndex(columnId) > 0
    );
  }

  canMoveForward(
    note: KanbanNote,
  ): boolean {
    const columnId =
      this.resolveNoteColumnId(
        note,
      );

    const index =
      this.columnIndex(columnId);

    return (
      index >= 0 &&
      index <
      this.columns.length - 1
    );
  }

  toggleChecklist(
    noteId: string,
    itemId: string,
    checked: boolean,
  ): void {
    let changedNote:
      | KanbanNote
      | undefined;

    this.notes.update(
      notes =>
        notes.map(
          note => {
            if (
              note.id !== noteId ||
              !note.checklist
            ) {
              return note;
            }

            const updatedNote: KanbanNote = {
              ...note,
              checklist:
                note.checklist.map(
                  item =>
                    item.id === itemId
                      ? {
                        ...item,
                        checked,
                      }
                      : item,
                ),
            };

            changedNote =
              updatedNote;

            return updatedNote;
          },
        ),
    );

    if (changedNote) {
      this.noteChanged.emit(
        this.copyNote(
          changedNote,
        ),
      );
    }
  }

  dropNote(
    event: CdkDragDrop<
      KanbanNote[],
      KanbanNote[],
      KanbanNote
    >,
    targetColumnId: string,
  ): void {
    const draggedNote =
      event.item.data;

    const sourceColumnId =
      this.resolveNoteColumnId(
        draggedNote,
      );

    if (
      !sourceColumnId ||
      !targetColumnId
    ) {
      return;
    }

    const snapshot =
      this.notes().map(
        note => this.copyNote(note),
      );

    const sameColumn =
      sourceColumnId ===
      targetColumnId;

    const targetNotes = [
      ...event.container.data,
    ];

    if (sameColumn) {
      moveItemInArray(
        targetNotes,
        event.previousIndex,
        event.currentIndex,
      );

      this.applyColumnOrders(
        new Map([
          [
            targetColumnId,
            targetNotes,
          ],
        ]),
      );
    } else {
      const sourceNotes = [
        ...event.previousContainer.data,
      ];

      transferArrayItem(
        sourceNotes,
        targetNotes,
        event.previousIndex,
        event.currentIndex,
      );

      const movedNote =
        this.withColumn(
          draggedNote,
          targetColumnId,
        );

      const normalizedTargetNotes =
        targetNotes.map(
          note =>
            note.id === movedNote.id
              ? movedNote
              : note,
        );

      this.applyColumnOrders(
        new Map([
          [
            sourceColumnId,
            sourceNotes,
          ],
          [
            targetColumnId,
            normalizedTargetNotes,
          ],
        ]),
      );

      this.noteMoved.emit(
        this.copyNote(
          movedNote,
        ),
      );
    }

    if (sameColumn) {
      const movedNote =
        this.notes().find(
          note =>
            note.id ===
            draggedNote.id,
        );

      if (movedNote) {
        this.noteChanged.emit(
          this.copyNote(
            movedNote,
          ),
        );
      }
    }

    this.persistColumnOrders(
      sameColumn
        ? [targetColumnId]
        : [
          sourceColumnId,
          targetColumnId,
        ],
      snapshot,
    );
  }

  columnDropListIds(
    excludeColumnId?: string,
  ): string[] {
    return this.columns
      .filter(
        column =>
          column.id !==
          excludeColumnId,
      )
      .map(
        column =>
          `${column.id}-drop-list`,
      );
  }

  isCompletedColumn(
    columnId: string | undefined,
  ): boolean {
    if (!columnId) {
      return false;
    }

    return (
      this.getColumn(columnId)?.type ===
      'COMPLETED'
    );
  }

  isNoteCompleted(
    note: KanbanNote,
  ): boolean {
    return this.isCompletedColumn(
      this.resolveNoteColumnId(
        note,
      ),
    );
  }

  private loadColumns(
    workspaceId: string,
    workspaceFolderId: string,
  ): void {
    const requestVersion =
      ++this.columnRequestVersion;

    this.loadingColumns.set(
      true,
    );

    this.columnsError.set(
      null,
    );

    this.stickyNoteColumnApiService
      .getByWorkspaceFolder(
        workspaceId,
        workspaceFolderId,
      )
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({
        next: response => {
          if (
            requestVersion !==
            this.columnRequestVersion
          ) {
            return;
          }

          const columns =
            (
              response.data ??
              []
            )
              .slice()
              .sort(
                (first, second) =>
                  first.position -
                  second.position,
              )
              .map(
                column =>
                  this.mapColumn(
                    column,
                  ),
              );

          this.columnsState.set(
            columns,
          );

          this.bindLegacyNoteColumns();

          this.loadingColumns.set(
            false,
          );
        },
        error: error => {
          if (
            requestVersion !==
            this.columnRequestVersion
          ) {
            return;
          }

          this.columnsState.set([]);

          this.loadingColumns.set(
            false,
          );

          this.columnsError.set(
            error?.error?.message ??
            error?.message ??
            'Unable to load board columns.',
          );
        },
      });
  }

  private loadNotes(
    workspaceId: string,
    workspaceFolderId: string,
  ): void {
    const requestVersion =
      ++this.noteRequestVersion;

    this.loadingNotes.set(true);
    this.notesError.set(null);

    this.stickyNoteApiService
      .getByWorkspaceFolder(
        workspaceId,
        workspaceFolderId,
        {
          status: 'ACTIVE',
          page: 1,
          limit: 100,
          sortBy: 'position',
          sortOrder: 'asc',
        },
      )
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({
        next: response => {
          if (
            requestVersion !==
            this.noteRequestVersion
          ) {
            return;
          }

          const notes =
            (
              response.data ??
              []
            )
              .slice()
              .sort(
                (first, second) =>
                  first.position -
                  second.position,
              )
              .map(
                note =>
                  this.mapStickyNote(
                    note,
                  ),
              );

          this.notes.set(notes);

          this.loadingNotes.set(false);
        },
        error: error => {
          if (
            requestVersion !==
            this.noteRequestVersion
          ) {
            return;
          }

          this.notes.set([]);

          this.loadingNotes.set(false);

          this.notesError.set(
            error?.error?.message ??
            error?.message ??
            'Unable to load sticky notes.',
          );
        },
      });
  }

  private mapStickyNote(
    stickyNote: StickyNote,
  ): KanbanNote {
    const columnId =
      this.getReferenceId(
        stickyNote.columnId,
      );

    const folderId =
      this.getReferenceId(
        stickyNote.workspaceFolderId,
      );

    const populatedColumn =
      typeof stickyNote.columnId ===
        'object'
        ? stickyNote.columnId
        : null;

    const columnType =
      populatedColumn?.type ??
      this.getColumn(
        columnId,
      )?.type;

    const folderLabel =
      this.folders()
        .find(
          folder =>
            folder.id === folderId,
        )
        ?.label ??
      'Notes';

    const normalizedContent =
      stickyNote.content.trim();

    const normalizedTitle =
      stickyNote.title.trim();

    const description =
      normalizedContent &&
        normalizedContent !==
        normalizedTitle
        ? normalizedContent
        : undefined;

    return {
      id: stickyNote._id,
      status: stickyNote.status,
      columnId,
      folderId,
      eyebrow:
        columnType === 'COMPLETED'
          ? 'Completed'
          : columnType ===
            'IN_PROGRESS'
            ? 'In progress'
            : 'Note',
      title:
        normalizedTitle ||
        'Untitled note',
      description,
      tone:
        this.noteColorToTone(
          stickyNote.color,
        ),
      tag: folderLabel,
      tagVariant: 'outline',
      compact:
        !description,
    };
  }

  private getReferenceId(
    value:
      | string
      | {
        _id: string;
      }
      | null
      | undefined,
  ): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    return value._id;
  }

  private noteColorToTone(
    color: StickyNoteColor,
  ): KanbanNote['tone'] {
    switch (color) {
      case 'BLUE':
        return 'noteBlue';

      case 'GREEN':
        return 'noteGreen';

      case 'PINK':
        return 'notePink';

      case 'ORANGE':
        return 'noteOrange';

      case 'PURPLE':
        return 'notePurple';

      case 'RED':
        return 'noteRed';

      case 'BROWN':
        return 'noteBrown';

      case 'YELLOW':
      default:
        return 'noteYellow';
    }
  }

  private mapColumn(
    column: StickyNoteColumn,
  ): KanbanColumn {
    return {
      id: column._id,
      label: column.name,
      type: column.type,
      color: column.color,
      position: column.position,
      isSystem: column.isSystem,
      accent:
        this.columnAccent(
          column.color,
        ),
      checkboxVariant:
        this.columnCheckboxVariant(
          column.color,
        ),
    };
  }

  private bindLegacyNoteColumns(): void {
    if (this.columns.length === 0) {
      return;
    }

    this.notes.update(
      notes =>
        notes.map(
          note => {
            if (
              note.columnId &&
              this.columns.some(
                column =>
                  column.id ===
                  note.columnId,
              )
            ) {
              return note;
            }

            const columnType =
              this.legacyStatusToColumnType(
                note.status,
              );

            if (!columnType) {
              return note;
            }

            const column =
              this.columns.find(
                candidate =>
                  candidate.type ===
                  columnType,
              );

            if (!column) {
              return note;
            }

            return {
              ...note,
              columnId: column.id,
            };
          },
        ),
    );
  }

  private moveNote(
    noteId: string,
    columnId: string,
  ): void {
    const note =
      this.notes().find(
        candidate =>
          candidate.id ===
          noteId,
      );

    if (!note) {
      return;
    }

    const sourceColumnId =
      this.resolveNoteColumnId(
        note,
      );

    if (
      !sourceColumnId ||
      sourceColumnId ===
      columnId
    ) {
      return;
    }

    const snapshot =
      this.notes().map(
        item => this.copyNote(item),
      );

    const sourceNotes =
      this.visibleNotesFor(
        sourceColumnId,
      ).filter(
        item =>
          item.id !== noteId,
      );

    const movedNote =
      this.withColumn(
        note,
        columnId,
      );

    const targetNotes = [
      ...this.visibleNotesFor(
        columnId,
      ),
      movedNote,
    ];

    this.applyColumnOrders(
      new Map([
        [
          sourceColumnId,
          sourceNotes,
        ],
        [
          columnId,
          targetNotes,
        ],
      ]),
    );

    this.noteMoved.emit(
      this.copyNote(
        movedNote,
      ),
    );

    this.persistColumnOrders(
      [
        sourceColumnId,
        columnId,
      ],
      snapshot,
    );
  }

  private applyColumnOrders(
    columnOrders: Map<
      string,
      KanbanNote[]
    >,
  ): void {
    const folderId =
      this.activeFolder();

    if (!folderId) {
      return;
    }

    const affectedColumns =
      new Set(
        columnOrders.keys(),
      );

    const affectedNoteIds =
      new Set(
        Array.from(
          columnOrders.values(),
        ).flatMap(
          notes =>
            notes.map(
              note => note.id,
            ),
        ),
      );

    this.notes.update(
      notes => {
        const remainingNotes =
          notes.filter(
            note => {
              const noteColumnId =
                this.resolveNoteColumnId(
                  note,
                );

              const noteFolderId =
                this.resolveNoteFolder(
                  note,
                );

              return !(
                affectedNoteIds.has(
                  note.id,
                ) ||
                (
                  noteFolderId === folderId &&
                  affectedColumns.has(
                    noteColumnId,
                  )
                )
              );
            },
          );

        const orderedNotes =
          this.columns
            .filter(
              column =>
                columnOrders.has(
                  column.id,
                ),
            )
            .flatMap(
              column =>
                (
                  columnOrders.get(
                    column.id,
                  ) ??
                  []
                ).map(
                  note =>
                    this.resolveNoteColumnId(
                      note,
                    ) === column.id
                      ? note
                      : this.withColumn(
                        note,
                        column.id,
                      ),
                ),
            );

        return [
          ...remainingNotes,
          ...orderedNotes,
        ];
      },
    );
  }

  private persistColumnOrders(
    columnIds: string[],
    rollbackSnapshot: KanbanNote[],
  ): void {
    const uniqueColumnIds =
      Array.from(
        new Set(
          columnIds.filter(Boolean),
        ),
      );

    const requests =
      uniqueColumnIds.flatMap(
        columnId =>
          this.visibleNotesFor(
            columnId,
          ).map(
            (note, position) =>
              this.stickyNoteApiService
                .update(
                  note.id,
                  {
                    columnId,
                    position,
                  },
                ),
          ),
      );

    if (requests.length === 0) {
      return;
    }

    this.notesError.set(null);

    forkJoin(requests)
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({
        error: error => {
          this.notes.set(
            rollbackSnapshot.map(
              note =>
                this.copyNote(
                  note,
                ),
            ),
          );

          this.notesError.set(
            error?.error?.message ??
            error?.message ??
            'Unable to save note position.',
          );
        },
      });
  }

  private withColumn(
    note: KanbanNote,
    columnId: string,
  ): KanbanNote {
    const column =
      this.getColumn(columnId);

    if (!column) {
      return note;
    }

    const currentColumnId =
      this.resolveNoteColumnId(
        note,
      );

    if (
      currentColumnId ===
      columnId
    ) {
      return note;
    }

    const completed =
      column.type === 'COMPLETED';

    const nextStatus =
      this.isLegacyKanbanStatus(
        note.status,
      )
        ? this.columnTypeToLegacyStatus(
          column.type,
        ) ?? note.status
        : note.status;

    return {
      ...note,
      columnId,
      status: nextStatus,
      eyebrow: completed
        ? this.doneLabel()
        : note.eyebrow
          .toLowerCase()
          .startsWith(
            'done at',
          )
          ? column.type ===
            'IN_PROGRESS'
            ? 'In progress'
            : 'Next up'
          : note.eyebrow,
      completedAt: completed
        ? this.timeNow()
        : undefined,
      tone: note.tone,
    };
  }

  private resolveRequestedColumnId(
    value: string,
  ): string {
    if (!value) {
      return '';
    }

    const directColumn =
      this.columns.find(
        column =>
          column.id === value,
      );

    if (directColumn) {
      return directColumn.id;
    }

    const type =
      this.legacyStatusToColumnType(
        value,
      );

    if (!type) {
      return '';
    }

    return (
      this.columns.find(
        column =>
          column.type === type,
      )?.id ??
      ''
    );
  }

  private resolveNoteColumnId(
    note: KanbanNote,
  ): string {
    if (
      note.columnId &&
      this.columns.some(
        column =>
          column.id ===
          note.columnId,
      )
    ) {
      return note.columnId;
    }

    const columnType =
      this.legacyStatusToColumnType(
        note.status,
      );

    if (!columnType) {
      return '';
    }

    return (
      this.columns.find(
        column =>
          column.type ===
          columnType,
      )?.id ??
      ''
    );
  }

  private legacyStatusToColumnType(
    status: string,
  ): StickyNoteColumnType | null {
    switch (
    status
      .trim()
      .toLowerCase()
    ) {
      case 'todo':
        return 'TODO';

      case 'doing':
        return 'IN_PROGRESS';

      case 'done':
        return 'COMPLETED';

      default:
        return null;
    }
  }

  private columnTypeToLegacyStatus(
    type:
      | StickyNoteColumnType
      | undefined,
  ): KanbanStatus | null {
    switch (type) {
      case 'TODO':
        return 'todo';

      case 'IN_PROGRESS':
        return 'doing';

      case 'COMPLETED':
        return 'done';

      default:
        return null;
    }
  }

  private isLegacyKanbanStatus(
    status: string,
  ): status is KanbanStatus {
    return (
      status === 'todo' ||
      status === 'doing' ||
      status === 'done'
    );
  }

  private getColumn(
    columnId: string,
  ): KanbanColumn | undefined {
    return this.columns.find(
      column =>
        column.id === columnId,
    );
  }

  private getCompletedColumn():
    | KanbanColumn
    | undefined {
    return this.columns.find(
      column =>
        column.type ===
        'COMPLETED',
    );
  }

  private columnIndex(
    columnId: string,
  ): number {
    return this.columns.findIndex(
      column =>
        column.id === columnId,
    );
  }

  private notesForActiveFolder():
    KanbanNote[] {
    const folderId =
      this.activeFolder();

    if (!folderId) {
      return [];
    }

    return this.notes().filter(
      note =>
        this.resolveNoteFolder(note) ===
        folderId,
    );
  }

  private defaultTone(
    columnId: string,
  ): KanbanNote['tone'] {
    const color =
      this.getColumn(
        columnId,
      )?.color;

    switch (color) {
      case 'BLUE':
        return 'noteBlue';

      case 'GREEN':
        return 'noteGreen';

      case 'PINK':
        return 'notePink';

      case 'ORANGE':
        return 'noteOrange';

      case 'PURPLE':
        return 'notePurple';

      case 'YELLOW':
      default:
        return 'noteYellow';
    }
  }

  private columnAccent(
    color: StickyNoteColumnColor,
  ): string {
    switch (color) {
      case 'BLUE':
        return '#87cdf5';

      case 'GREEN':
        return '#18a957';

      case 'PINK':
        return '#f5a8c7';

      case 'PURPLE':
        return '#b8a4e8';

      case 'ORANGE':
        return '#f4a261';

      case 'YELLOW':
      default:
        return '#ffd84d';
    }
  }

  private columnCheckboxVariant(
    color: StickyNoteColumnColor,
  ): KanbanColumn['checkboxVariant'] {
    switch (color) {
      case 'BLUE':
        return 'noteBlue';

      case 'GREEN':
        return 'noteGreen';

      case 'PINK':
        return 'notePink';

      case 'PURPLE':
        return 'notePurple';

      case 'ORANGE':
        return 'noteOrange';

      case 'YELLOW':
      default:
        return 'noteYellow';
    }
  }

  private doneLabel(): string {
    return `Done at ${this.timeNow()}`;
  }

  private timeNow(): string {
    return new Intl.DateTimeFormat(
      'en',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      },
    ).format(
      new Date(),
    );
  }

  private resolveNoteFolder(
    note: KanbanNote,
  ): string {
    if (
      note.folderId &&
      this.folders().some(
        folder =>
          folder.id === note.folderId,
      )
    ) {
      return note.folderId;
    }

    const normalizedTag =
      (
        note.tag ??
        ''
      )
        .trim()
        .toLowerCase();

    const matchingFolder =
      this.folders().find(
        folder =>
          folder.label
            .trim()
            .toLowerCase() ===
          normalizedTag,
      );

    if (matchingFolder) {
      return matchingFolder.id;
    }

    const defaultFolder =
      this.workspaceFolderStore.defaultFolder();

    return (
      defaultFolder?._id ??
      ''
    );
  }

  private requestAdvertisementRender(): void {
    if (
      typeof window === 'undefined' ||
      !this.showAdvertisement ||
      !this.adsenseClient ||
      !this.adsenseSlot
    ) {
      return;
    }

    window.setTimeout(
      () => {
        try {
          const adsenseWindow =
            window as Window & {
              adsbygoogle?: Array<
                Record<string, unknown>
              >;
            };

          adsenseWindow.adsbygoogle ??=
            [];

          adsenseWindow.adsbygoogle.push(
            {},
          );
        } catch {
          // Ad blockers or delayed scripts
          // must not break the board.
        }
      },
    );
  }

  private copyNote(
    note: KanbanNote,
  ): KanbanNote {
    return {
      ...note,
      checklist:
        note.checklist?.map(
          item => ({
            ...item,
          }),
        ),
      assignees:
        note.assignees?.map(
          assignee => ({
            ...assignee,
          }),
        ),
    };
  }
}