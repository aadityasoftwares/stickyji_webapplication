import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAlertCircle, LucideRefreshCw, LucideUserPlus, LucideUsers } from '@lucide/angular';
import { finalize } from 'rxjs';

import { AppIcon } from '../../../shared/components/icon/icon';
import { Button } from '../../../shared/components/button/button';
import { Select, SelectOption, SelectValue } from '../../../shared/components/select/select';
import { extractErrorMessage, extractList, idOf } from '../../../shared/functions/common.function';
import { getInitials } from '../../../shared/functions/string.functions';
import { WorkspaceMemberApiService } from '../../workspace-members/services/workspace-member.service';
import type { WorkspaceMemberListItem } from '../../workspace-members/models/workspace-member.models';

export interface AssigneePreviewItem {
  id: string;
  name: string;
  displayName: string;
  email: string;
  initials: string;
  avatarUrl?: string;
  roleName?: string;
}

@Component({
  selector: 'app-sticky-note-assignee-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppIcon,
    Button,
    Select
  ],
  templateUrl: './sticky-note-assignee-select.html',
  styleUrl: './sticky-note-assignee-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StickyNoteAssigneeSelect implements OnChanges {
  private readonly workspaceMemberApi = inject(WorkspaceMemberApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() workspaceId = '';
  @Input() selectedAssigneeIds: readonly string[] = [];
  @Input() disabled = false;
  @Input() placeholder = '+ Assign members';

  @Output() readonly selectedAssigneeIdsChange = new EventEmitter<string[]>();
  @Output() readonly selectedAssigneesChange = new EventEmitter<AssigneePreviewItem[]>();

  readonly LucideUsers = LucideUsers;
  readonly LucideUserPlus = LucideUserPlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideAlertCircle = LucideAlertCircle;

  readonly members = signal<WorkspaceMemberListItem[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  private loadedWorkspaceId = '';

  /**
   * Transformed options for app-select
   */
  readonly memberOptions = computed<SelectOption[]>(() => {
    return this.members().map(member => {
      const user = member.user;
      const userId = user?.id || idOf(member);
      const displayName = user?.displayName ||
        [(user as any)?.firstName, (user as any)?.lastName].filter(Boolean).join(' ') ||
        (member as any)?.profile?.displayName ||
        (member as any)?.displayName ||
        (member as any)?.name ||
        'Member';
      const email = user?.email || (member as any)?.email || '';
      const initials = getInitials(displayName, 'M');

      return {
        label: displayName,
        value: userId,
        description: email,
        avatar: {
          name: displayName,
          initials,
          tone: 'neutral',
          shape: 'circle'
        }
      };
    });
  });

  get currentValues(): string[] {
    return Array.isArray(this.selectedAssigneeIds) ? [...this.selectedAssigneeIds] : [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['workspaceId']) {
      const nextWorkspaceId = (this.workspaceId || '').trim();
      if (nextWorkspaceId !== this.loadedWorkspaceId) {
        this.fetchMembers(nextWorkspaceId);
      }
    }
  }

  fetchMembers(workspaceId: string): void {
    const trimmedId = (workspaceId || '').trim();
    if (!trimmedId) {
      this.members.set([]);
      this.loadedWorkspaceId = '';
      this.loading.set(false);
      this.loadError.set(null);
      this.emitChanges([], []);
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);

    this.workspaceMemberApi.getAll({
      workspaceId: trimmedId,
      status: 'ACTIVE',
      page: 1,
      limit: 100
    }).pipe(
      finalize(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => {
        this.loadedWorkspaceId = trimmedId;
        const list = (extractList(response) as WorkspaceMemberListItem[]) || [];
        this.members.set(list);
        this.loadError.set(null);

        // Filter out any selectedAssigneeIds that don't exist in the new workspace
        const availableUserIds = new Set(list.map(m => m.user?.id || idOf(m)));
        const validSelectedIds = this.currentValues.filter(id => availableUserIds.has(id));

        if (validSelectedIds.length !== this.currentValues.length) {
          const previewItems = this.buildPreviewItems(validSelectedIds, list);
          this.emitChanges(validSelectedIds, previewItems);
        } else {
          const previewItems = this.buildPreviewItems(this.currentValues, list);
          this.selectedAssigneesChange.emit(previewItems);
        }
      },
      error: error => {
        this.loadError.set(extractErrorMessage(error, 'Unable to load workspace members.'));
      }
    });
  }

  onSelectionChange(values: SelectValue | SelectValue[] | null): void {
    const ids: string[] = Array.isArray(values)
      ? values.map(v => String(v))
      : values != null
        ? [String(values)]
        : [];

    const previewItems = this.buildPreviewItems(ids, this.members());
    this.emitChanges(ids, previewItems);
  }

  private emitChanges(ids: string[], previewItems: AssigneePreviewItem[]): void {
    this.selectedAssigneeIdsChange.emit(ids);
    this.selectedAssigneesChange.emit(previewItems);
  }

  private buildPreviewItems(ids: string[], membersList: WorkspaceMemberListItem[]): AssigneePreviewItem[] {
    const membersMap = new Map<string, WorkspaceMemberListItem>();
    for (const m of membersList) {
      const uId = m.user?.id || idOf(m);
      if (uId) membersMap.set(uId, m);
    }

    return ids.map(id => {
      const member = membersMap.get(id);
      const name = member?.user?.displayName ||
        [(member?.user as any)?.firstName, (member?.user as any)?.lastName].filter(Boolean).join(' ') ||
        (member as any)?.profile?.displayName ||
        (member as any)?.displayName ||
        (member as any)?.name ||
        'Member';
      return {
        id,
        name,
        displayName: name,
        email: member?.user?.email || (member as any)?.email || '',
        initials: getInitials(name, 'M'),
        roleName: member?.role?.name
      };
    });
  }

}
