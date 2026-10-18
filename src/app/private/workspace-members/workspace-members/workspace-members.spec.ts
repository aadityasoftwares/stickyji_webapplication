import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { OverlayContainer } from '@angular/cdk/overlay';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';
import { WorkspaceRoleApiService } from '../../roles/services/workspace-role.service';
import type { WorkspaceRole } from '../../roles/models/workspace-role.models';
import { WorkspaceMemberApiService } from '../services/workspace-member.service';
import { WorkspaceInvitationApiService } from '../services/workspace-invitation.service';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { WorkspaceMembers } from './workspace-members';
import { SendWorkspaceMemberRequestSidePanel } from '../send-workspace-member-request-side-panel/send-workspace-member-request-side-panel';
import { USER_PREFERENCE_KEYS } from '../../../shared/constants/common.constants';
import { UserPreferenceStore } from '../../user-preferences/services/user-preference.store';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import type { WorkspaceMemberListItem } from '../models/workspace-member.models';
import type { WorkspaceInvitation } from '../models/workspace-invitation.models';

describe('WorkspaceMembers', () => {
  let component: WorkspaceMembers;
  let fixture: ComponentFixture<WorkspaceMembers>;
  let overlay: HTMLElement;
  const member: WorkspaceMemberListItem = {
    id: 'member-1',
    user: { id: 'user-1', displayName: 'Alex', email: 'alex@example.com' },
    role: { id: 'editor', code: 'EDITOR', name: 'Editor' },
    status: 'ACTIVE',
    joinedAt: null,
    lastActiveAt: null,
    addedBy: null,
    isOwner: false,
    isCurrentUser: false,
  };
  const invitation: WorkspaceInvitation = {
    id: 'invitation-1',
    workspaceId: 'workspace-1',
    email: 'invite@example.com',
    roleId: 'editor',
    invitedBy: 'owner',
    status: 'PENDING',
    expiresAt: '2099-01-01',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceMembers],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    const store = TestBed.inject(WorkspaceStore);
    store.setWorkspaces([{ id: 'workspace-1', name: 'Team' }]);
    store.select('workspace-1');
    fixture = TestBed.createComponent(WorkspaceMembers);
    component = fixture.componentInstance;
    vi.spyOn(component, 'loadWorkspaceAccess').mockImplementation(() => {});
    fixture.detectChanges();
    await fixture.whenStable();
    component.members.set([member]);
    component.invitations.set([invitation]);
    fixture.detectChanges();
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
  }, 30_000);

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('preserves bulk removal permissions and refreshes once after mixed results', () => {
    const api = TestBed.inject(WorkspaceMemberApiService);
    const first = new Subject<any>();
    const second = new Subject<any>();
    const remove = vi.spyOn(api, 'remove').mockReturnValueOnce(first).mockReturnValueOnce(second);
    const reload = vi.spyOn(component, 'loadMembers').mockImplementation(() => {});
    const success = vi.spyOn(TestBed.inject(ToastService), 'success');
    component.members.set([
      member,
      { ...member, id: 'second' },
      { ...member, id: 'owner', isOwner: true },
    ]);
    component.selectedMemberIds.set(new Set(['member-1', 'second', 'owner']));
    component.bulkRemoveSelected();
    expect(remove.mock.calls).toEqual([['member-1'], ['second']]);
    first.next({});
    first.complete();
    expect(reload).not.toHaveBeenCalled();
    second.error(new Error('Failed'));
    expect(success).toHaveBeenCalledWith('Removed 1 member');
    expect(reload).toHaveBeenCalledTimes(1);
    expect(component.selectedCount()).toBe(0);
  });

  it('restores only removed members and keeps active members unchanged', () => {
    const restore = vi
      .spyOn(TestBed.inject(WorkspaceMemberApiService), 'restore')
      .mockReturnValue(of({ data: {} } as any));
    const reload = vi.spyOn(component, 'loadMembers').mockImplementation(() => {});
    component.members.set([member, { ...member, id: 'removed', status: 'REMOVED' }]);
    component.selectedMemberIds.set(new Set(['member-1', 'removed']));
    component.bulkRestoreSelected();
    expect(restore.mock.calls).toEqual([['removed']]);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('keeps removed-group search and active-member sorting behavior', () => {
    component.members.set([
      { ...member, id: 'removed', status: 'REMOVED' },
      { ...member, id: 'zoe', user: { ...member.user, displayName: 'Zoe' } },
      member,
    ]);
    component.setSort('name');
    expect(component.visibleMembers().map((item) => item.id)).toEqual(['member-1', 'zoe']);
    component.updateSearch('alex');
    expect(
      component
        .memberGroups()
        .find((group) => group.id === 'removed')
        ?.items.map((item) => item.id),
    ).toEqual(['removed']);
  });

  it('preserves invitation response aliases and first-array precedence', () => {
    const getAll = vi.spyOn(TestBed.inject(WorkspaceInvitationApiService), 'getAll');
    for (const key of ['items', 'invitations', 'workspaceInvitations', 'docs', 'results']) {
      getAll.mockReturnValue(of({ data: { [key]: [invitation] } } as any));
      component.loadInvitations();
      expect(component.invitations()).toEqual([invitation]);
    }
    getAll.mockReturnValue(of({ data: { items: [], invitations: [invitation] } } as any));
    component.loadInvitations();
    expect(component.invitations()).toEqual([]);
  });

  async function openMenu(selector: string): Promise<string> {
    const trigger = fixture.nativeElement.querySelector(selector) as HTMLElement;
    expect(trigger).toBeTruthy();
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    return overlay.textContent ?? '';
  }

  it('keeps the member card and offers the shared member actions', async () => {
    expect(fixture.nativeElement.querySelector('app-member-card-wrapper')).toBeTruthy();
    const text = await openMenu('.workspace-member-card-menu');
    expect(text).toContain('View details');
    expect(text).toContain('Change role');
    expect(text).toContain('Remove member');
    expect(text).toContain('Copy email');
  });

  it('renders grouped table rows with selection and the same menu', async () => {
    component.setMemberView('list');
    component.toggleMemberSelection(member, true);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.workspace-gtable tbody tr.app-highlight-active'),
    ).toBeTruthy();
    const text = await openMenu('.workspace-table-menu-button');
    expect(text).toContain('Change role');
    expect(text).toContain('Copy email');
    const view = vi.spyOn(component, 'openMemberView').mockImplementation(() => {});
    const button = Array.from(overlay.querySelectorAll('button')).find((item) =>
      item.textContent?.includes('View details'),
    )!;
    button.click();
    expect(view).toHaveBeenCalledWith(member);
  });

  it('protects owners from role changes and removal', async () => {
    component.members.set([{ ...member, isOwner: true }]);
    fixture.detectChanges();
    const text = await openMenu('.workspace-member-card-menu');
    expect(text).not.toContain('Change role');
    expect(text).not.toContain('Remove member');
  });

  it('offers restore for removed members', async () => {
    component.setMemberView('list');
    component.members.set([{ ...member, status: 'REMOVED' }]);
    component.setMemberTab('removed');
    fixture.detectChanges();
    expect(await openMenu('.workspace-table-menu-button')).toContain('Restore access');
  });

  it('renders invitations in the workspace table and preserves cancellation', async () => {
    component.setMemberTab('invitations');
    component.setMemberView('list');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.workspace-group .workspace-invitation-gtable'),
    ).toBeTruthy();
    const text = await openMenu('.workspace-invitation-menu-button');
    expect(text).toContain('Copy email');
    expect(text).toContain('Cancel invitation');
  });

  it('keeps copy email available on closed invitation cards', async () => {
    component.invitations.set([{ ...invitation, status: 'ACCEPTED' }]);
    component.setMemberTab('invitations');
    fixture.detectChanges();
    const text = await openMenu('.workspace-member-card-menu');
    expect(text).toContain('Copy email');
    expect(text).not.toContain('Cancel invitation');
  });

  it('opens the context menu and clears its target when switching tabs', async () => {
    const card = fixture.nativeElement.querySelector('app-member-card-wrapper') as HTMLElement;
    card.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 50, clientY: 75 }),
    );
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 10));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.contextMenuMember()).toBe(member);
    expect(component.contextMenuPosition()).toEqual({ x: 50, y: 75 });
    expect(overlay.textContent).toContain('View details');
    component.setMemberTab('invitations');
    expect(component.contextMenuMember()).toBeNull();
  });

  it('persists member view, status filter, and sort order with member preference keys', () => {
    const prefStore = TestBed.inject(UserPreferenceStore);
    const saveSpy = vi.spyOn(prefStore, 'setAndSave');

    component.setMemberView('list');
    expect(saveSpy).toHaveBeenCalledWith(USER_PREFERENCE_KEYS.WORKSPACE_MEMBER_VIEW, 'LIST');

    component.setMemberTab('active');
    expect(saveSpy).toHaveBeenCalledWith(
      USER_PREFERENCE_KEYS.WORKSPACE_MEMBER_STATUS_FILTER,
      'ACTIVE',
    );

    component.setSort('createdAt');
    expect(saveSpy).toHaveBeenCalledWith(
      USER_PREFERENCE_KEYS.WORKSPACE_MEMBER_SORT_ORDER,
      'RECENTLY_CREATED',
    );
  });

  it('restores member view, status filter, and sort order from preferences', () => {
    const prefStore = TestBed.inject(UserPreferenceStore);
    prefStore.updatePreference(USER_PREFERENCE_KEYS.WORKSPACE_MEMBER_VIEW, 'LIST');
    prefStore.updatePreference(USER_PREFERENCE_KEYS.WORKSPACE_MEMBER_STATUS_FILTER, 'INVITATIONS');
    prefStore.updatePreference(USER_PREFERENCE_KEYS.WORKSPACE_MEMBER_SORT_ORDER, 'NAME_ASC');

    expect(component.view()).toBe('list');
    expect(component.activeTab()).toBe('invitations');
    expect(component.sortBy()).toBe('name');
  });

  it('maps missing populated references safely into the role editor', () => {
    const incomplete: WorkspaceMemberListItem = {
      ...member,
      user: null,
      role: null,
      addedBy: null,
    };
    component.members.set([incomplete]);
    component.openRoleEditor(incomplete);
    expect(component.memberModalMember()?.userId).toEqual({
      id: '',
      _id: '',
      displayName: undefined,
      email: undefined,
    });
    expect(component.memberModalMember()?.roleId).toMatchObject({ id: '', _id: '' });
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('ignores stale role results and stale finalization', () => {
    const older = new Subject<WorkspaceRole[]>();
    const newer = new Subject<WorkspaceRole[]>();
    vi.spyOn(TestBed.inject(WorkspaceRoleApiService), 'getWorkspaceRoles')
      .mockReturnValueOnce(older)
      .mockReturnValueOnce(newer);
    component.loadRoles();
    component.loadRoles();
    older.next([]);
    older.complete();
    expect(component.loadingRoles()).toBe(true);
    newer.next([]);
    newer.complete();
    expect(component.loadingRoles()).toBe(false);
  });

  it('loads every member page before publishing counts', () => {
    const getAll = vi.spyOn(TestBed.inject(WorkspaceMemberApiService), 'getAll');
    getAll
      .mockReturnValueOnce(
        of({
          success: true,
          message: '',
          data: [member],
          meta: { page: 1, limit: 1, total: 2, totalPages: 2 },
        }),
      )
      .mockReturnValueOnce(
        of({
          success: true,
          message: '',
          data: [{ ...member, id: 'second' }],
          meta: { page: 2, limit: 1, total: 2, totalPages: 2 },
        }),
      );
    component.loadMembers();
    expect(getAll.mock.calls.map(([query]) => query?.page)).toEqual([1, 2]);
    expect(component.totalCount()).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('reports later-page failure rather than showing a successful partial list', () => {
    vi.spyOn(TestBed.inject(WorkspaceMemberApiService), 'getAll')
      .mockReturnValueOnce(
        of({
          success: true,
          message: '',
          data: [member],
          meta: { page: 1, limit: 1, total: 2, totalPages: 2 },
        }),
      )
      .mockReturnValueOnce(throwError(() => new Error('Page failed')));
    component.loadMembers();
    expect(component.error()).toBeTruthy();
    expect(component.members()).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  it('rejects duplicate bulk requests and reports failed actions', () => {
    const pending = new Subject<unknown>();
    const remove = vi
      .spyOn(TestBed.inject(WorkspaceMemberApiService), 'remove')
      .mockReturnValue(pending as ReturnType<WorkspaceMemberApiService['remove']>);
    vi.spyOn(component, 'loadMembers').mockImplementation(() => {});
    const error = vi.spyOn(TestBed.inject(ToastService), 'error');
    component.selectedMemberIds.set(new Set(['member-1']));
    component.bulkRemoveSelected();
    component.bulkRemoveSelected();
    expect(remove).toHaveBeenCalledTimes(1);
    pending.error(new Error('Denied'));
    expect(component.bulkBusy()).toBe(false);
    expect(component.busyIds().size).toBe(0);
    expect(error).toHaveBeenCalled();
  });

  it('rechecks removal and cancellation guards on confirmation', () => {
    const remove = vi.spyOn(TestBed.inject(WorkspaceMemberApiService), 'remove');
    component.removeTarget.set({ ...member, isOwner: true });
    component.confirmRemove();
    expect(remove).not.toHaveBeenCalled();
    const cancel = vi.spyOn(TestBed.inject(WorkspaceInvitationApiService), 'cancel');
    component.cancelInvitationTarget.set({ ...invitation, status: 'ACCEPTED' });
    component.confirmCancelInvitation();
    expect(cancel).not.toHaveBeenCalled();
  });

  it('handles null list responses and invalid rows without rendering errors', () => {
    const getAll = vi.spyOn(TestBed.inject(WorkspaceMemberApiService), 'getAll');
    getAll.mockReturnValue(of(null) as unknown as ReturnType<WorkspaceMemberApiService['getAll']>);
    component.loadMembers();
    expect(component.members()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('clears old workspace state and cancels pending mutations', async () => {
    const pending = new Subject<unknown>();
    vi.spyOn(TestBed.inject(WorkspaceMemberApiService), 'remove').mockReturnValue(
      pending as ReturnType<WorkspaceMemberApiService['remove']>,
    );
    const emitted = vi.spyOn(component.memberRemoved, 'emit');
    component.requestRemove(member);
    component.confirmRemove();
    const store = TestBed.inject(WorkspaceStore);
    store.setWorkspaces([
      { id: 'workspace-1', name: 'Team' },
      { id: 'workspace-2', name: 'Other' },
    ]);
    store.select('workspace-2');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.members()).toEqual([]);
    expect(component.invitations()).toEqual([]);
    expect(component.removing()).toBe(false);
    pending.next({});
    pending.complete();
    expect(emitted).not.toHaveBeenCalled();
  });

  it('reports unavailable clipboard support without throwing', async () => {
    const error = vi.spyOn(TestBed.inject(ToastService), 'error');
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    try {
      await component.copyMemberId('member-1');
      await component.copyAccessEmail('alex@example.com');
      expect(error).toHaveBeenCalledTimes(2);
    } finally {
      if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard);
      else Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('loads every invitation page using total and limit when totalPages is absent', () => {
    const getAll = vi.spyOn(TestBed.inject(WorkspaceInvitationApiService), 'getAll');
    getAll
      .mockReturnValueOnce(
        of({
          data: [invitation],
          pagination: { page: 1, limit: 1, total: 2 },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: [{ ...invitation, id: 'second' }],
          pagination: { page: 2, limit: 1, total: 2 },
        }),
      );
    component.loadInvitations();
    expect(getAll.mock.calls.map(([query]) => query?.page)).toEqual([1, 2]);
    expect(component.invitationCount()).toBe(2);
    expect(component.invitationLoading()).toBe(false);
  });

  it('preserves descending-name preferences for current and removed members', () => {
    component.members.set([
      member,
      { ...member, id: 'zoe', user: { displayName: 'Zoe' } },
      { ...member, id: 'removed-alex', status: 'REMOVED' },
      { ...member, id: 'removed-zoe', status: 'REMOVED', user: { displayName: 'Zoe' } },
    ]);
    TestBed.inject(UserPreferenceStore).updatePreference(
      USER_PREFERENCE_KEYS.WORKSPACE_MEMBER_SORT_ORDER,
      'NAME_DESC',
    );
    expect(component.visibleMembers().map((item) => item.id)).toEqual(['zoe', 'member-1']);
    expect(
      component
        .memberGroups()
        .find((group) => group.id === 'removed')
        ?.items.map((item) => item.id),
    ).toEqual(['removed-zoe', 'removed-alex']);
    component.setSort('name');
    expect(component.visibleMembers().map((item) => item.id)).toEqual(['member-1', 'zoe']);
  });

  it('prevents repeated removal confirmation and displays backend-declared failures', () => {
    const pending = new Subject<{ success: boolean; message: string; data: null }>();
    const remove = vi
      .spyOn(TestBed.inject(WorkspaceMemberApiService), 'remove')
      .mockReturnValue(pending);
    const error = vi.spyOn(TestBed.inject(ToastService), 'error');
    const success = vi.spyOn(TestBed.inject(ToastService), 'success');
    component.requestRemove(member);
    component.confirmRemove();
    component.confirmRemove();
    expect(remove).toHaveBeenCalledTimes(1);
    pending.next({ success: false, message: 'Access denied', data: null });
    expect(error).toHaveBeenCalledWith('Access denied', expect.anything());
    expect(success).not.toHaveBeenCalled();
    expect(component.removing()).toBe(false);
  });

  it('does not publish old role options after a workspace switch', async () => {
    const pending = new Subject<WorkspaceRole[]>();
    vi.spyOn(TestBed.inject(WorkspaceRoleApiService), 'getWorkspaceRoles').mockReturnValue(pending);
    component.loadRoles();
    const store = TestBed.inject(WorkspaceStore);
    store.setWorkspaces([
      { id: 'workspace-1', name: 'Team' },
      { id: 'workspace-2', name: 'Other' },
    ]);
    store.select('workspace-2');
    fixture.detectChanges();
    await fixture.whenStable();
    pending.next([
      {
        id: 'old-role',
        name: 'Old',
        displayName: 'Old',
        code: 'EDITOR',
        type: 'SYSTEM',
        scope: 'WORKSPACE',
        isSystem: true,
        isActive: true,
      },
    ]);
    pending.complete();
    expect(component.availableRoleOptions()).toEqual([]);
    expect(component.loadingRoles()).toBe(false);
  });

  it('cancels role-editor requests when the panel changes workspace', () => {
    vi.spyOn(TestBed.inject(WorkspaceRoleApiService), 'getWorkspaceRoles').mockReturnValue(of([]));
    const pending = new Subject<never>();
    vi.spyOn(TestBed.inject(WorkspaceMemberApiService), 'assignRole').mockReturnValue(pending);
    const panelFixture = TestBed.createComponent(SendWorkspaceMemberRequestSidePanel);
    const panel = panelFixture.componentInstance;
    panelFixture.componentRef.setInput('workspaceId', '111111111111111111111111');
    panelFixture.componentRef.setInput('member', {
      id: '222222222222222222222222',
      workspaceId: '111111111111111111111111',
      userId: '333333333333333333333333',
      roleId: '444444444444444444444444',
      status: 'ACTIVE',
    });
    panelFixture.componentRef.setInput('open', true);
    panelFixture.detectChanges();
    const saved = vi.spyOn(panel.saved, 'emit');
    panel.submit();
    expect(panel.saving()).toBe(true);
    panelFixture.componentRef.setInput('workspaceId', '555555555555555555555555');
    panelFixture.detectChanges();
    expect(panel.saving()).toBe(false);
    expect(pending.observed).toBe(false);
    expect(saved).not.toHaveBeenCalled();
    panelFixture.destroy();
  });

  it('preserves restoration eligibility separately from role-edit and removal restrictions', () => {
    const restore = vi.spyOn(TestBed.inject(WorkspaceMemberApiService), 'restore').mockReturnValue(
      of({
        success: true,
        message: '',
        data: {
          id: 'member-1',
          workspaceId: 'workspace-1',
          userId: 'user-1',
          roleId: 'editor',
          status: 'ACTIVE',
        },
      }),
    );
    vi.spyOn(component, 'loadMembers').mockImplementation(() => {});
    const removed = { ...member, status: 'REMOVED' as const, isCurrentUser: true };
    component.members.set([removed]);
    component.restoreMember(removed);
    expect(restore).toHaveBeenCalledTimes(1);
    component.selectedMemberIds.set(new Set(['member-1']));
    component.bulkRestoreSelected();
    expect(restore).toHaveBeenCalledTimes(2);
    component.restoreMember(member);
    expect(restore).toHaveBeenCalledTimes(2);
  });
});
