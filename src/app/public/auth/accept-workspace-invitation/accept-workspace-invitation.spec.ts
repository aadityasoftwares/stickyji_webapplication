import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from '../services/auth-service';
import {
  WorkspaceInvitationApiResponse,
  WorkspaceInvitationPreview,
  WorkspaceInvitationPublicService,
} from '../services/workspace-invitation-public.service';
import { AcceptWorkspaceInvitation } from './accept-workspace-invitation';

describe('AcceptWorkspaceInvitation', () => {
  let component: AcceptWorkspaceInvitation;
  let fixture: ComponentFixture<AcceptWorkspaceInvitation>;
  let previewResponse: Subject<WorkspaceInvitationApiResponse<WorkspaceInvitationPreview>>;
  const preview: WorkspaceInvitationPreview = {
    invitationId: 'invite-1',
    email: 'invited@example.com',
    userExists: false,
    workspace: { id: 'workspace-1', name: 'Design team' },
    role: { id: 'role-1', name: 'Editor' },
    invitedBy: { name: 'Team owner' },
    message: 'Welcome to the team!',
    expiresAt: '2026-12-01T12:00:00Z',
  };

  beforeEach(async () => {
    previewResponse = new Subject();
    await TestBed.configureTestingModule({
      imports: [AcceptWorkspaceInvitation],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ token: 'test-invitation' }) },
          },
        },
        { provide: AuthService, useValue: { login: vi.fn(), register: vi.fn() } },
        {
          provide: WorkspaceInvitationPublicService,
          useValue: { validateToken: () => previewResponse.asObservable(), accept: vi.fn() },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AcceptWorkspaceInvitation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function showInvitation(userExists = false): void {
    previewResponse.next({ success: true, message: 'Ready', data: { ...preview, userExists } });
    previewResponse.complete();
    fixture.detectChanges();
  }

  it('shows the loading state while checking the invitation', () => {
    expect(component.pageState()).toBe('loading');
    expect(fixture.nativeElement.querySelector('.invitation-state')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('redirects only after workspace acceptance succeeds, preserving its ID', () => {
    showInvitation();
    const response = new Subject<any>();
    vi.mocked(TestBed.inject(WorkspaceInvitationPublicService).accept).mockReturnValue(response);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.authCompleted.set(true);
    component.retryAccept();
    expect(navigate).not.toHaveBeenCalled();
    response.next({ success: true, data: {
      invitationId: 'invite-1', workspaceId: 'workspace-1',
      workspaceName: 'Design team', roleName: 'Editor',
    } });
    response.complete();
    expect(navigate).toHaveBeenCalledOnce();
    expect(router.serializeUrl(navigate.mock.calls[0][0] as import('@angular/router').UrlTree))
      .toBe('/app?workspaceId=workspace-1');
  });

  it('stays on the invitation when acceptance fails', () => {
    showInvitation();
    const response = new Subject<any>();
    vi.mocked(TestBed.inject(WorkspaceInvitationPublicService).accept).mockReturnValue(response);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    component.authCompleted.set(true);
    component.retryAccept();
    response.next({ success: false, message: 'Unable to accept' });
    response.complete();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.pageError()).toBe('Unable to accept');
  });

  afterEach(() => vi.restoreAllMocks());

  it('keeps invitation details and the locked email in the new-account card', () => {
    showInvitation();
    const card: HTMLElement = fixture.nativeElement.querySelector('.form-card');
    expect(card.textContent).toContain('Design team');
    expect(card.textContent).toContain('Editor');
    expect(card.textContent).toContain('Expires');
    expect(card.querySelector('details')?.textContent).toContain('Welcome to the team!');
    const email = card.querySelector<HTMLInputElement>('#invitation-email');
    expect(email?.disabled).toBe(true);
    expect(email?.value).toBe('invited@example.com');
    expect(card.querySelector('#invitation-first-name')).toBeTruthy();
    expect(card.querySelector('#invitation-terms')).toBeTruthy();
  });

  it('shows existing-account controls without registration fields', () => {
    showInvitation(true);
    expect(fixture.nativeElement.querySelector('#invitation-first-name')).toBeNull();
    expect(fixture.nativeElement.querySelector('#invitation-terms')).toBeNull();
    expect(fixture.nativeElement.querySelector('#invitation-remember')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#invitation-password').autocomplete).toBe(
      'current-password',
    );
  });

  it('shows an unavailable invitation with recovery actions', () => {
    previewResponse.error({ status: 410, error: { message: 'Invitation expired' } });
    fixture.detectChanges();
    expect(component.pageState()).toBe('invalid');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Check invitation again');
    expect(fixture.nativeElement.textContent).toContain('Go to sign in');
  });

  it('keeps the retry action available after authentication completes', () => {
    showInvitation();
    component.authCompleted.set(true);
    component.pageError.set('Please try joining again.');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.querySelector('.join-finish-card')?.textContent).toContain(
      'Please try joining again.',
    );
    expect(fixture.nativeElement.querySelector('.retry-join-button')).toBeTruthy();
  });

  it('shows accepted workspace access and the open-workspace action', () => {
    showInvitation();
    component.accepted.set({
      invitationId: 'invite-1',
      workspaceId: 'workspace-1',
      workspaceName: 'Design team',
      roleName: 'Editor',
    });
    component.pageState.set('accepted');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.accepted-summary')?.textContent).toContain(
      'Design team',
    );
    expect(fixture.nativeElement.querySelector('.invitation-success')?.textContent).toContain(
      'Open workspace',
    );
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
});
