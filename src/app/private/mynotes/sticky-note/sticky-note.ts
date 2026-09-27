import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
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
  LucideTrash2,
  LucideX
} from '@lucide/angular';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { Divider } from '../../../shared/components/divider/divider';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput } from '../../../shared/components/input/input';
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
    Divider
  ],
  templateUrl: './sticky-note.html',
  styleUrl: './sticky-note.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StickyNote {
  @Input({ required: true }) data: any = {};
  @Input() preview = false;
  @Output() readonly editRequested = new EventEmitter<any>();
  @Output() readonly moveBackwardRequested = new EventEmitter<any>();
  @Output() readonly moveForwardRequested = new EventEmitter<any>();
  @Output() readonly checklistChange = new EventEmitter<any>();
  @Output() readonly titleChangeRequested = new EventEmitter<any>();
  @Output() readonly descriptionChangeRequested = new EventEmitter<any>();
  @Output() readonly deleteRequested = new EventEmitter<any>();
  @Output() readonly noteClick = new EventEmitter<any>();
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
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideX = LucideX;
  editingTitle = false;
  editingDescription = false;
  titleDraft = '';
  descriptionDraft = '';
  expandedChecklists = new Set<string>();
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
  get font(): string {
    return String(this.data?.font ?? 'dmSans').trim() || 'dmSans';
  }
  get fontSize(): number {
    const value = Number(this.data?.fontSize);
    return [13, 14, 15, 16].includes(value) ? value : 14;
  }
  get layout(): string {
    return String(this.data?.layout ?? 'detail');
  }
  get isPlainLayout(): boolean {
    return this.layout === 'plain';
  }
  get isCompleted(): boolean {
    return this.data?.completed === true;
  }
  get disabled(): boolean {
    return this.data?.disabled === true || this.data?.actionsDisabled === true;
  }
  get isSaving(): boolean {
    return this.data?.titleUpdating === true || this.data?.descriptionUpdating === true;
  }
  get showDragHandle(): boolean {
    return !this.preview && this.data?.showDragHandle !== false;
  }
  get checklists(): any[] {
    return Array.isArray(this.data?.checklists) ? this.data.checklists : [];
  }
  get totalChecklistItems(): number {
    return this.checklists.reduce(
      (total: number, checklist: any) => total + this.itemsFor(checklist).length,
      0
    );
  }
  get completedChecklistItems(): number {
    return this.checklists.reduce(
      (total: number, checklist: any) =>
        total + this.itemsFor(checklist).filter((item: any) => item?.isCompleted === true).length,
      0
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
    return ({
      YELLOW: 'noteYellow',
      ORANGE: 'noteOrange',
      PINK: 'notePink',
      RED: 'noteRed',
      GREEN: 'noteGreen',
      BLUE: 'noteBlue',
      PURPLE: 'notePurple',
      BROWN: 'noteBrown',
      BLACK: 'noteBlack',
      WHITE: 'neutral'
    } as any)[this.color] ?? 'neutral';
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
      [`is-font-${this.font}`]: true,
      'is-preview': this.preview,
      'is-completed': this.isCompleted,
      'is-disabled': this.disabled,
      'is-saving': this.isSaving,
      'is-compact': this.data?.compact === true || this.isPlainLayout
    };
  }
  requestEdit(event: Event): void {
    if (this.preview) return;
    this.stop(event);
    if (!this.disabled) this.editRequested.emit(this.data);
  }
  requestDelete(event: Event): void {
    if (this.preview) return;
    this.stop(event);
    if (!this.disabled) this.deleteRequested.emit(this.data);
  }
  requestMove(direction: 'backward' | 'forward', event: Event): void {
    if (this.preview) return;
    this.stop(event);
    if (this.disabled) return;
    if (direction === 'backward' && this.data?.canMoveBackward !== false) {
      this.moveBackwardRequested.emit(this.data);
    }
    if (direction === 'forward' && this.data?.canMoveForward !== false) {
      this.moveForwardRequested.emit(this.data);
    }
  }
  startTitleEdit(event: Event): void {
    if (this.preview) return;
    this.stop(event);
    if (this.disabled || this.data?.titleUpdating || this.data?.inlineEditing === false) return;
    this.titleDraft = this.title === 'Untitled note' ? '' : this.title;
    this.editingTitle = true;
  }
  saveTitle(): void {
    if (this.preview) return;
    if (!this.editingTitle) return;
    const nextTitle = this.titleDraft.trim();
    this.editingTitle = false;
    if (nextTitle && nextTitle !== this.title) {
      this.titleChangeRequested.emit({ noteId: this.noteId, title: nextTitle });
    }
    this.titleDraft = '';
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
    if (this.disabled || this.data?.descriptionUpdating || this.data?.inlineEditing === false) return;
    this.descriptionDraft = this.description;
    this.editingDescription = true;
  }
  saveDescription(): void {
    if (this.preview) return;
    if (!this.editingDescription) return;
    const nextDescription = this.descriptionDraft.trim();
    this.editingDescription = false;
    if (nextDescription !== this.description) {
      this.descriptionChangeRequested.emit({
        noteId: this.noteId,
        description: nextDescription
      });
    }
    this.descriptionDraft = '';
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
  isChecklistExpanded(checklist: any): boolean {
    return this.expandedChecklists.has(this.checklistId(checklist));
  }
  changeChecklistItem(item: any, checked: boolean): void {
    if (this.preview) return;
    if (this.disabled || item?.updating) return;
    this.checklistChange.emit({
      noteId: this.noteId,
      itemId: String(item?.id ?? item?._id ?? ''),
      checked
    });
  }
  avatarName(assignee: any): string {
    return String(assignee?.name ?? assignee?.displayName ?? assignee?.email ?? 'Member');
  }
  avatarImage(assignee: any): string {
    return String(assignee?.src ?? assignee?.avatarUrl ?? assignee?.imageUrl ?? '');
  }
  avatarInitials(assignee: any): string {
    return this.avatarName(assignee)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part.charAt(0).toUpperCase())
      .join('');
  }
  onCardClick(event: Event): void {
    if (this.preview) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, input, textarea, a, app-button, app-input, app-checkbox, [role="menu"]')) return;
    this.noteClick.emit(this.data);
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
    const result = String(value ?? fallback).trim().toUpperCase();
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
