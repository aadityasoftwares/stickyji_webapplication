import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { extractErrorMessage } from '../../../shared/functions/common.function';
import { getInitials } from '../../../shared/functions/string.functions';
import { STICKY_NOTE_MESSAGES } from '../messages/sticky-note.messages';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCalendarDays,
  LucideCheck,
  LucideCheckCircle2,
  LucideChevronDown,
  LucideChevronUp,
  LucideClock3,
  LucideMoreHorizontal,
  LucideGrip,
  LucidePencil,
  LucideStar,
  LucideStarOff,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { Divider } from '../../../shared/components/divider/divider';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput } from '../../../shared/components/input/input';
import { DeleteConfirmModal } from '../../../shared/components/delete-confirm-modal/delete-confirm-modal';
import { StickyNoteApiService } from '../services/sticky-notes.service';
import { StickyNoteChecklistItemApiService } from '../services/sticky-note-checklist-item.service';
import { StickyNotesFavouriteService } from '../../sticky-notes-favourites/services/sticky-notes-favourite.service';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { getNoteColorBadgeVariant } from '../../../shared/functions/sticky-note.function';
import { STICKY_NOTE_FONT_OPTIONS, VIEW, View } from '../../../shared/constants/common.constants';
import { UserDateTimeFormatterService } from '../../../shared/services/user-date-time-formatter.service';

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const FONT_TOKEN_MAP: Readonly<Record<string, string>> = {
  DM_SANS: 'dmSans',
  CAVEAT: 'caveat',
  PATRICK_HAND: 'patrickHand',
  KALAM: 'kalam',
  ARCHITECTS_DAUGHTER: 'architectsDaughter',
  INDIE_FLOWER: 'indieFlower',
  NANUM_PEN: 'nanumPen',
  SHADOWS_INTO_LIGHT: 'shadowsIntoLight',
  COMIC_NEUE: 'comicNeue',
  SRIRACHA: 'sriracha',
  SHORT_STACK: 'shortStack',
  GOCHI_HAND: 'gochiHand',
};

/* -------------------------------------------------------------------------- */
/*                             Component Metadata                             */
/* -------------------------------------------------------------------------- */

@Component({
  selector: 'app-sticky-note',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDividerModule,
    MatMenuModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Checkbox,
    Divider,
    DeleteConfirmModal,
  ],
  templateUrl: './sticky-note.html',
  styleUrl: './sticky-note.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyNote {
  private readonly stickyNoteApi = inject(StickyNoteApiService);
  private readonly checklistItemApi = inject(StickyNoteChecklistItemApiService);
  private readonly favoriteApi = inject(StickyNotesFavouriteService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dateTimeFormatter = inject(UserDateTimeFormatterService);

  /* -------------------------------------------------------------------------- */
  /*                               Inputs / Outputs                             */
  /* -------------------------------------------------------------------------- */

  @Input({ required: true }) data: any = {};
  @Input() preview = false;

  @Output() readonly editRequested = new EventEmitter<any>();
  @Output() readonly moveBackwardRequested = new EventEmitter<any>();
  @Output() readonly moveForwardRequested = new EventEmitter<any>();
  @Output() readonly checklistChange = new EventEmitter<any>();
  @Output() readonly titleChangeRequested = new EventEmitter<any>();
  @Output() readonly descriptionChangeRequested = new EventEmitter<any>();
  @Output() readonly favoriteToggled = new EventEmitter<{
    noteId: string;
    isFavorite: boolean;
    favoriteId?: string;
    note: any;
  }>();
  @Output() readonly deleteRequested = new EventEmitter<any>();
  @Output() readonly deleted = new EventEmitter<string>();
  @Output() readonly noteUpdated = new EventEmitter<any>();
  @Output() readonly noteClick = new EventEmitter<any>();

  /* -------------------------------------------------------------------------- */
  /*                                    Icons                                   */
  /* -------------------------------------------------------------------------- */

  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideCheck = LucideCheck;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideChevronUp = LucideChevronUp;
  readonly LucideClock3 = LucideClock3;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucideGrip = LucideGrip;
  readonly LucidePencil = LucidePencil;
  readonly LucideStar = LucideStar;
  readonly LucideStarOff = LucideStarOff;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideX = LucideX;

  /* -------------------------------------------------------------------------- */
  /*                                    State                                   */
  /* -------------------------------------------------------------------------- */

  editingTitle = false;
  editingDescription = false;
  titleDraft = '';
  descriptionDraft = '';
  titleUpdating = false;
  descriptionUpdating = false;
  showDeleteConfirm = false;
  isDeleting = false;
  readonly updatingItemIds = new Set<string>();
  expandedChecklists = new Set<string>();

  /* -------------------------------------------------------------------------- */
  /*                               Computed Values                              */
  /* -------------------------------------------------------------------------- */

  get noteId(): string {
    return String(this.data?.id ?? this.data?._id ?? '').trim();
  }

  get title(): string {
    return String(this.data?.title ?? '').trim() || 'Untitled note';
  }

  get description(): string {
    return String(this.data?.description ?? this.data?.content ?? '').trim();
  }

  get color(): string {
    return this.enumValue(this.data?.color, 'WHITE');
  }

  get shape(): string {
    return this.enumValue(this.data?.shape, 'SQUARE');
  }

  get variant(): string {
    return this.enumValue(this.data?.variant, 'PLAIN');
  }

  get pattern(): string {
    return this.enumValue(this.data?.backgroundPattern, 'NONE');
  }

  /* --- View & Layout --- */

  get view(): View {
    const raw = String(this.data?.view ?? VIEW.KANBAN).toLowerCase();
    return raw === VIEW.TABLE ? VIEW.TABLE : VIEW.KANBAN;
  }

  get isKanbanView(): boolean {
    return this.view === VIEW.KANBAN;
  }

  get isTableView(): boolean {
    return this.view === VIEW.TABLE;
  }

  get layout(): string {
    return String(this.data?.layout ?? 'DETAIL')
      .trim()
      .toUpperCase();
  }

  get isCompact(): boolean {
    return this.layout === 'COMPACT' || this.layout === 'PLAIN' || this.data?.compact === true;
  }

  get isDetail(): boolean {
    return !this.isCompact;
  }

  get isPlainLayout(): boolean {
    return this.isCompact;
  }

  /* --- Typography --- */

  get font(): string {
    return (
      String(this.data?.font ?? 'DM_SANS')
        .trim()
        .toUpperCase() || 'DM_SANS'
    );
  }

  get fontClass(): string {
    return FONT_TOKEN_MAP[this.font] ?? this.font.toLowerCase();
  }

  get fontFamily(): string {
    const option = STICKY_NOTE_FONT_OPTIONS.find(
      (opt) =>
        opt.value === this.font || opt.family.toLowerCase().includes(this.font.toLowerCase()),
    );
    return option?.family ?? '"DM Sans", sans-serif';
  }

  get fontSize(): number {
    const value = Number(this.data?.fontSize);
    return [13, 14, 15, 16].includes(value) ? value : 14;
  }

  /* --- Presentation & Controls --- */

  get isCompleted(): boolean {
    return this.data?.completed === true;
  }

  get isFavorite(): boolean {
    if (this.data?.isFavorite !== undefined && this.data?.isFavorite !== null) {
      return Boolean(this.data.isFavorite);
    }
    return this.favoriteApi.isFavorite(this.noteId);
  }

  get favoriteId(): string {
    return String(
      this.data?.favoriteId || this.favoriteApi.getFavoriteId(this.noteId) || '',
    ).trim();
  }

  get isFavoriteBusy(): boolean {
    return this.favoriteApi.isBusy(this.noteId);
  }

  get disabled(): boolean {
    return this.data?.disabled === true || this.data?.actionsDisabled === true || this.isDeleting;
  }

  get isSaving(): boolean {
    return (
      this.titleUpdating ||
      this.descriptionUpdating ||
      this.isDeleting ||
      this.updatingItemIds.size > 0 ||
      this.data?.titleUpdating === true ||
      this.data?.descriptionUpdating === true
    );
  }

  get noteKey(): string {
    const rawKey = this.data?.noteKey;
    if (rawKey && String(rawKey).trim()) {
      return String(rawKey).trim();
    }
    const num = Number(this.data?.stickyNoteNumber);
    if (!isNaN(num) && num > 0) {
      return `ST-${String(num).padStart(6, '0')}`;
    }
    return '';
  }

  get columnLabel(): string {
    return String(this.data?.columnLabel ?? '').trim();
  }

  get columnBadgeVariant(): any {
    return this.data?.columnBadgeVariant || 'neutral';
  }

  get showDragHandle(): boolean {
    return !this.preview && this.data?.showDragHandle !== false;
  }

  get showMoveActions(): boolean {
    return this.data?.showMoveActions !== false;
  }

  get canMoveBackward(): boolean {
    return this.data?.canMoveBackward !== false;
  }

  get canMoveForward(): boolean {
    return this.data?.canMoveForward !== false;
  }

  get dueLabel(): string {
    const explicitLabel = String(this.data?.dueLabel ?? '').trim();
    if (explicitLabel) {
      return this.dateTimeFormatter.formatDateKey(explicitLabel, '') || explicitLabel;
    }

    return this.dateTimeFormatter.formatDateKey(this.data?.noteDate, '');
  }

  get timeEstimate(): string {
    return String(this.data?.timeEstimate || '').trim();
  }

  get tag(): string {
    return String(this.data?.tag || '').trim();
  }

  get hasFooterContent(): boolean {
    return Boolean(
      this.isCompleted || this.dueLabel || this.timeEstimate || this.tag || this.assignees.length,
    );
  }

  get checklists(): any[] {
    return Array.isArray(this.data?.checklists) ? this.data.checklists : [];
  }

  get totalChecklistItems(): number {
    return this.checklists.reduce(
      (total: number, checklist: any) => total + this.itemsFor(checklist).length,
      0,
    );
  }

  get completedChecklistItems(): number {
    return this.checklists.reduce(
      (total: number, checklist: any) =>
        total + this.itemsFor(checklist).filter((item: any) => item?.isCompleted === true).length,
      0,
    );
  }

  get progress(): number {
    if (typeof this.data?.progress === 'number') {
      return Math.max(0, Math.min(100, Math.round(this.data.progress)));
    }
    return this.totalChecklistItems
      ? Math.round((this.completedChecklistItems / this.totalChecklistItems) * 100)
      : 0;
  }

  get assignees(): any[] {
    return Array.isArray(this.data?.assignees) ? this.data.assignees.slice(0, 4) : [];
  }

  get badgeVariant(): any {
    return getNoteColorBadgeVariant(this.color);
  }

  get controlVariant(): any {
    return this.color === 'WHITE' ? 'secondary' : this.badgeVariant;
  }

  get dividerVariant(): any {
    return this.color === 'WHITE' ? 'neutral' : this.badgeVariant;
  }

  get inputVariant(): any {
    return this.color === 'WHITE' ? 'paper' : this.badgeVariant;
  }

  get cardClasses(): any {
    return {
      [`is-color-${this.classToken(this.color)}`]: true,
      [`is-shape-${this.classToken(this.shape)}`]: true,
      [`is-variant-${this.classToken(this.variant)}`]: true,
      [`is-pattern-${this.classToken(this.pattern)}`]: true,
      [`is-font-${this.fontClass}`]: true,
      'is-preview': this.preview,
      'is-completed': this.isCompleted,
      'is-disabled': this.disabled,
      'is-saving': this.isSaving,
      'is-compact': this.isCompact,
      [`is-view-${this.view}`]: true,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                                Public Actions                              */
  /* -------------------------------------------------------------------------- */

  requestEdit(event: Event): void {
    if (this.preview) return;
    this.stop(event);
    if (!this.disabled) this.editRequested.emit(this.data);
  }

  toggleFavorite(event?: Event): void {
    if (this.preview) return;
    if (event) this.stop(event);
    const id = this.noteId;
    if (!id || this.disabled || this.isFavoriteBusy) return;

    const currentFavId = this.favoriteId;
    this.favoriteApi
      .toggleFavorite(id, currentFavId, this.title)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result: any) => {
          const nextIsFavorite = result?.isFavorite ?? !this.isFavorite;
          const nextFavId = result?.favoriteId ?? '';
          if (this.data) {
            this.data.isFavorite = nextIsFavorite;
            this.data.favoriteId = nextFavId;
          }
          this.favoriteToggled.emit({
            noteId: id,
            isFavorite: nextIsFavorite,
            favoriteId: nextFavId,
            note: this.data,
          });
          this.noteUpdated.emit(this.data);
        },
      });
  }

  requestDelete(event: Event): void {
    if (this.preview) return;
    this.stop(event);
    if (!this.disabled && !this.isDeleting) {
      this.showDeleteConfirm = true;
    }
  }

  closeDeleteConfirm(): void {
    if (!this.isDeleting) {
      this.showDeleteConfirm = false;
    }
  }

  confirmDelete(): void {
    const id = this.noteId;
    if (!id || this.isDeleting) return;

    this.isDeleting = true;
    this.stickyNoteApi
      .moveToTrash(id)
      .pipe(
        finalize(() => {
          this.isDeleting = false;
          this.showDeleteConfirm = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success(STICKY_NOTE_MESSAGES.SUCCESS.MOVED_TO_TRASH_WITH_RETENTION, {
            title: 'Note safely moved',
            dedupeKey: `trash-note-${id}`,
          });
          this.deleted.emit(id);
          this.deleteRequested.emit(this.data);
        },
        error: (error: any) => {
          this.toastService.error(
            extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.MOVE_TO_TRASH_FAILED),
            {
              title: 'Note not moved',
              dedupeKey: `trash-note-${id}`,
            },
          );
        },
      });
  }

  requestMove(direction: 'backward' | 'forward', event: Event): void {
    if (this.preview) return;
    this.stop(event);
    if (this.disabled) return;
    if (direction === 'backward' && this.canMoveBackward) {
      this.moveBackwardRequested.emit(this.data);
    }
    if (direction === 'forward' && this.canMoveForward) {
      this.moveForwardRequested.emit(this.data);
    }
  }

  startTitleEdit(event: Event): void {
    if (this.preview) return;
    this.stop(event);
    if (
      this.disabled ||
      this.titleUpdating ||
      this.data?.titleUpdating ||
      this.data?.inlineEditing === false
    )
      return;
    this.titleDraft = this.title === 'Untitled note' ? '' : this.title;
    this.editingTitle = true;
  }

  saveTitle(): void {
    if (this.preview) return;
    if (!this.editingTitle) return;
    const nextTitle = this.titleDraft.trim();
    this.editingTitle = false;
    this.titleDraft = '';
    if (!nextTitle || nextTitle === this.title) return;

    const previousTitle = this.title;
    this.data.title = nextTitle;
    this.titleUpdating = true;

    this.stickyNoteApi
      .update(this.noteId, { title: nextTitle })
      .pipe(
        finalize(() => {
          this.titleUpdating = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response: any) => {
          const serverTitle = String(response?.data?.title ?? nextTitle).trim();
          if (serverTitle) {
            this.data.title = serverTitle;
          }
          this.noteUpdated.emit(this.data);
          this.titleChangeRequested.emit({ noteId: this.noteId, title: this.data.title });
        },
        error: (error: any) => {
          this.data.title = previousTitle;
          this.toastService.error(
            extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.RENAME_FAILED),
            {
              title: 'Title not updated',
              dedupeKey: `note-title-${this.noteId}`,
            },
          );
        },
      });
  }

  cancelTitleEdit(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.editingTitle = false;
    this.titleDraft = '';
  }

  onTitleKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveTitle();
    } else if (event.key === 'Escape') {
      this.cancelTitleEdit(event);
    }
  }

  startDescriptionEdit(event: Event): void {
    if (this.preview) return;
    this.stop(event);
    if (
      this.disabled ||
      this.descriptionUpdating ||
      this.data?.descriptionUpdating ||
      this.data?.inlineEditing === false
    )
      return;
    this.descriptionDraft = this.description;
    this.editingDescription = true;
  }

  saveDescription(): void {
    if (this.preview) return;
    if (!this.editingDescription) return;
    const nextDescription = this.descriptionDraft.trim();
    this.editingDescription = false;
    this.descriptionDraft = '';
    if (nextDescription === this.description) return;

    const previousDescription = this.description;
    this.data.content = nextDescription;
    this.data.description = nextDescription;
    this.data.compact = !nextDescription;
    this.descriptionUpdating = true;

    this.stickyNoteApi
      .update(this.noteId, { content: nextDescription })
      .pipe(
        finalize(() => {
          this.descriptionUpdating = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response: any) => {
          const serverContent = String(response?.data?.content ?? nextDescription).trim();
          this.data.content = serverContent;
          this.data.description = serverContent;
          this.data.compact = !serverContent;
          this.noteUpdated.emit(this.data);
          this.descriptionChangeRequested.emit({
            noteId: this.noteId,
            description: serverContent,
          });
        },
        error: (error: any) => {
          this.data.content = previousDescription;
          this.data.description = previousDescription;
          this.data.compact = !previousDescription;
          this.toastService.error(
            extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.DESCRIPTION_UPDATE_FAILED),
            {
              title: 'Description not updated',
              dedupeKey: `note-description-${this.noteId}`,
            },
          );
        },
      });
  }

  cancelDescriptionEdit(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.editingDescription = false;
    this.descriptionDraft = '';
  }

  onDescriptionKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Escape') this.cancelDescriptionEdit(event);
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.saveDescription();
    }
  }

  toggleChecklist(checklist: any, event: Event): void {
    this.stop(event);
    const id = this.checklistId(checklist);
    const next = new Set(this.expandedChecklists);
    next.has(id) ? next.delete(id) : next.add(id);
    this.expandedChecklists = next;
  }

  visibleItems(checklist: any): any[] {
    const items = this.itemsFor(checklist);
    return this.expandedChecklists.has(this.checklistId(checklist))
      ? items
      : items.slice(0, this.previewLimit);
  }

  hiddenItemCount(checklist: any): number {
    return Math.max(0, this.itemsFor(checklist).length - this.previewLimit);
  }

  checklistMoreLabel(checklist: any): string {
    return this.isChecklistExpanded(checklist)
      ? 'Show less'
      : `+${this.hiddenItemCount(checklist)} more`;
  }

  checklistMoreIcon(checklist: any): any {
    return this.isChecklistExpanded(checklist) ? this.LucideChevronUp : this.LucideChevronDown;
  }

  isChecklistExpanded(checklist: any): boolean {
    return this.expandedChecklists.has(this.checklistId(checklist));
  }

  isItemUpdating(itemId: string): boolean {
    return this.updatingItemIds.has(itemId);
  }

  changeChecklistItem(item: any, checked: boolean): void {
    if (this.preview) return;
    const itemId = String(item?.id ?? item?._id ?? '').trim();
    if (!itemId || this.disabled || this.isItemUpdating(itemId)) return;
    if (item.isCompleted === checked) return;

    item.isCompleted = checked;
    this.recalculateChecklists();
    this.updatingItemIds.add(itemId);

    this.checklistItemApi
      .updateCompletion(itemId, checked)
      .pipe(
        finalize(() => {
          this.updatingItemIds.delete(itemId);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response: any) => {
          const confirmed = response?.data?.isCompleted;
          if (typeof confirmed === 'boolean' && confirmed !== checked) {
            item.isCompleted = confirmed;
            this.recalculateChecklists();
          }
          this.noteUpdated.emit(this.data);
          this.checklistChange.emit({
            noteId: this.noteId,
            itemId,
            checked: item.isCompleted,
          });
        },
        error: (error: any) => {
          item.isCompleted = !checked;
          this.recalculateChecklists();
          this.toastService.error(
            extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.CHECKLIST_UPDATE_FAILED),
            {
              title: 'Checklist not updated',
              dedupeKey: `checklist-item-${itemId}`,
            },
          );
        },
      });
  }

  /** Resolves the nested userId object (populated) or falls back to the flat assignee props. */
  private resolveAssigneeUser(assignee: any): any {
    const userId = assignee?.userId;
    // userId may be a populated object or a plain string id
    return userId && typeof userId === 'object' ? userId : assignee;
  }

  avatarName(assignee: any): string {
    const user = this.resolveAssigneeUser(assignee);
    const profile = user?.profile;
    const displayName =
      profile?.displayName ?? user?.displayName ?? assignee?.name ?? assignee?.displayName;
    if (displayName) return String(displayName).trim();

    const firstName = profile?.firstName ?? user?.firstName ?? assignee?.firstName ?? '';
    const lastName = profile?.lastName ?? user?.lastName ?? assignee?.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;

    const email = user?.email ?? assignee?.email ?? '';
    if (email) return String(email).split('@')[0];

    return 'Member';
  }

  avatarImage(assignee: any): string {
    const user = this.resolveAssigneeUser(assignee);
    const profile = user?.profile;
    return String(
      profile?.avatarUrl ??
        user?.avatarUrl ??
        assignee?.src ??
        assignee?.avatarUrl ??
        assignee?.imageUrl ??
        '',
    );
  }

  avatarInitials(assignee: any): string {
    return getInitials(this.avatarName(assignee), '');
  }

  onCardClick(event: Event): void {
    if (this.preview) return;
    const target = event.target as HTMLElement;
    if (
      target.closest(
        'button, input, textarea, a, app-button, app-input, app-checkbox, [role="menu"]',
      )
    )
      return;
    this.noteClick.emit(this.data);
  }

  /* -------------------------------------------------------------------------- */
  /*                           Private / Helper Methods                         */
  /* -------------------------------------------------------------------------- */

  private recalculateChecklists(): void {
    const checklists = this.checklists;
    let total = 0;
    let completed = 0;
    for (const checklist of checklists) {
      const items = this.itemsFor(checklist);
      const done = items.filter((i: any) => i?.isCompleted === true).length;
      checklist.totalCount = items.length;
      checklist.completedCount = done;
      total += items.length;
      completed += done;
    }
    this.data.checklistItemCount = total;
    this.data.completedChecklistItemCount = completed;
    this.data.progress = total ? Math.round((completed / total) * 100) : 0;
  }

  private get previewLimit(): number {
    const value = Number(this.data?.previewLimit ?? 3);
    return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 3;
  }

  private itemsFor(checklist: any): any[] {
    return Array.isArray(checklist?.items) ? checklist.items : [];
  }

  private checklistId(checklist: any): string {
    return String(checklist?.id ?? checklist?._id ?? checklist?.title ?? 'checklist');
  }

  private enumValue(value: any, fallback: string): string {
    const result = String(value ?? fallback)
      .trim()
      .toUpperCase();
    return result || fallback;
  }

  private classToken(value: string): string {
    return value.toLowerCase().replace(/_/g, '-');
  }

  private stop(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }
}
