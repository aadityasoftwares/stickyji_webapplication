import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SendWorkspaceMemberRequestSidePanel } from './send-workspace-member-request-side-panel';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { WorkspaceDropdownStore } from '../../workspace/services/workspace-dropdown.store';
import { WorkspaceRoleApiService } from '../../roles/services/workspace-role.service';
import { WorkspaceInvitationApiService } from '../services/workspace-invitation.service';

describe('SendWorkspaceMemberRequestSidePanel', () => {
  let component: SendWorkspaceMemberRequestSidePanel;
  let fixture: ComponentFixture<SendWorkspaceMemberRequestSidePanel>;
  let workspaceStore: WorkspaceStore;
  let workspaceDropdownStore: WorkspaceDropdownStore;
  let roleApi: WorkspaceRoleApiService;
  let invitationApi: WorkspaceInvitationApiService;

  const validWorkspaceId1 = '111111111111111111111111';
  const validWorkspaceId2 = '222222222222222222222222';
  const validRoleId1 = '333333333333333333333333';
  const validRoleId2 = '444444444444444444444444';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendWorkspaceMemberRequestSidePanel],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    workspaceStore = TestBed.inject(WorkspaceStore);
    workspaceDropdownStore = TestBed.inject(WorkspaceDropdownStore);
    roleApi = TestBed.inject(WorkspaceRoleApiService);
    invitationApi = TestBed.inject(WorkspaceInvitationApiService);

    workspaceStore.setWorkspaces([
      { id: validWorkspaceId1, name: 'Workspace Alpha' },
      { id: validWorkspaceId2, name: 'Workspace Beta' },
    ]);
    workspaceStore.select(validWorkspaceId1);

    vi.spyOn(roleApi, 'getWorkspaceRoles').mockReturnValue(
      of([
        {
          id: validRoleId1,
          name: 'Member',
          code: 'WORKSPACE_MEMBER',
          scope: 'WORKSPACE',
          isActive: true,
          isSystem: true,
          isDefault: true,
        } as any,
      ]),
    );

    fixture = TestBed.createComponent(SendWorkspaceMemberRequestSidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize selectedWorkspaceId from workspaceId input when opened', () => {
    fixture.componentRef.setInput('workspaceId', validWorkspaceId1);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect(component.selectedWorkspaceId()).toBe(validWorkspaceId1);
  });

  it('should derive availableWorkspaceOptions from workspaceOptions input if supplied', () => {
    const customOptions = [
      { label: 'Custom 1', value: validWorkspaceId1 },
      { label: 'Custom 2', value: validWorkspaceId2 },
    ];
    fixture.componentRef.setInput('workspaceOptions', customOptions);
    fixture.detectChanges();

    expect(component.availableWorkspaceOptions()).toEqual(customOptions);
  });

  it('should derive availableWorkspaceOptions from workspaceStore when workspaceOptions input is not supplied', () => {
    fixture.componentRef.setInput('workspaceOptions', []);
    fixture.detectChanges();

    const options = component.availableWorkspaceOptions();
    expect(options.length).toBe(2);
    expect(options[0].value).toBe(validWorkspaceId1);
    expect(options[1].value).toBe(validWorkspaceId2);
  });

  it('should update selectedWorkspaceId without modifying workspaceStore or workspaceDropdownStore selection', () => {
    fixture.componentRef.setInput('workspaceId', validWorkspaceId1);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect(component.selectedWorkspaceId()).toBe(validWorkspaceId1);
    expect(workspaceStore.selectedId()).toBe(validWorkspaceId1);

    const rolesSpy = vi.spyOn(roleApi, 'getWorkspaceRoles').mockReturnValue(
      of([
        {
          id: validRoleId2,
          name: 'Contributor',
          code: 'WORKSPACE_CONTRIBUTOR',
          scope: 'WORKSPACE',
          isActive: true,
          isSystem: true,
          isDefault: true,
        } as any,
      ]),
    );

    // User switches to Workspace Beta in the sidepanel
    component.updateWorkspaceId(validWorkspaceId2);
    fixture.detectChanges();

    // Sidepanel internal target is updated
    expect(component.selectedWorkspaceId()).toBe(validWorkspaceId2);
    expect(rolesSpy).toHaveBeenCalledWith(validWorkspaceId2);

    // CRITICAL REQUIREMENT: workspaceStore and workspaceDropdownStore selected workspace must NOT be updated
    expect(workspaceStore.selectedId()).toBe(validWorkspaceId1);
    expect(workspaceDropdownStore.selectedWorkspaceId()).not.toBe(validWorkspaceId2);
  });

  it('should submit batch invitations with the selectedWorkspaceId chosen in the sidepanel', () => {
    fixture.componentRef.setInput('workspaceId', validWorkspaceId1);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    // Change target workspace in sidepanel
    component.updateWorkspaceId(validWorkspaceId2);
    fixture.detectChanges();

    component.updateEmailDraft('invitee@example.com');
    component.addEmail();
    component.updateRoleId(validRoleId2);

    const batchSpy = vi.spyOn(invitationApi, 'createBatch').mockReturnValue(
      of({
        success: true,
        message: 'Success',
        data: {
          summary: { total: 1, created: 1, emailSent: 1, emailFailed: 0 },
          created: [],
          skipped: [],
        },
      } as any),
    );

    component.submit();

    expect(batchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: validWorkspaceId2,
        invitations: [
          expect.objectContaining({
            email: 'invitee@example.com',
          }),
        ],
      }),
    );

    // Store remains on original workspace
    expect(workspaceStore.selectedId()).toBe(validWorkspaceId1);
  });
});
