import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { authGuard } from '../../../guards/auth.guard';
import { authInterceptor } from '../../../interceptors/auth.interceptor';
import { WorkspaceDropdownStore } from '../../../private/workspace/services/workspace-dropdown.store';
import { WorkspaceStore } from '../../../private/workspace/services/workspace.store';
import { WorkspaceFolderStore } from '../../../private/workspacefolders/services/workspace-folder.store';
import { StickyNoteColumnStore } from '../../../private/mynotes/services/sticky-note-column.store';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { AppSessionStore } from '../../../shared/functions/app-session.store';
import { AuthSession } from '../interfaces/auth.interface';
import { AuthStore } from '../state/auth.store';
import { AuthService } from './auth-service';
import { AuthRefreshService } from './auth-refresh.service';

const session = (id: string): AuthSession => ({
  sessionId: `session-${id}`,
  tokens: { accessToken: `token-${id}` },
  user: {
    id,
    email: `${id}@example.test`,
    globalRoleId: '',
    status: 'ACTIVE',
    isEmailVerified: true,
    isMfaEnabled: false,
  },
});
const workspace = (id: string) => ({
  id,
  name: id,
  folders: [{ id: `folder-${id}`, name: 'Notes' }],
});

describe('Account boundaries without reloading Angular', () => {
  let http: HttpTestingController;
  let auth: AuthStore;
  let service: AuthService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthStore);
    service = TestBed.inject(AuthService);
  });
  afterEach(() => http.verify());

  it('loads only the second account workspaces after logout and login', () => {
    const dropdown = TestBed.inject(WorkspaceDropdownStore);
    const workspaces = TestBed.inject(WorkspaceStore);
    const folders = TestBed.inject(WorkspaceFolderStore);
    const columns = TestBed.inject(StickyNoteColumnStore);
    const app = TestBed.inject(AppSessionStore);
    auth.setSession(session('a'));
    workspaces.setWorkspaces([workspace('a')]);
    columns.setColumns('a', 'folder-a', [{ id: 'column-a' }]);
    service.logout().subscribe();
    http.expectOne(API_ENDPOINTS.auth.logout).flush({ success: true });
    expect(dropdown.loaded()).toBe(false);
    expect(dropdown.selectedWorkspaceId()).toBeNull();
    expect(workspaces.workspaces()).toEqual([]);
    expect(folders.folders()).toEqual([]);
    expect(columns.columns()).toEqual([]);
    expect(app.initialized()).toBe(false);

    service
      .login({ email: 'b@example.test', password: 'test-password', rememberMe: false })
      .subscribe();
    http.expectOne(API_ENDPOINTS.auth.login).flush({ success: true, data: session('b') });
    workspaces.load();
    const request = http.expectOne(API_ENDPOINTS.workspaces.dropdown);
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-b');
    request.flush({ success: true, data: [workspace('b')] });
    expect(dropdown.items().map((item) => item.id)).toEqual(['b']);
    expect(workspaces.selectedId()).toBe('b');
    expect(workspaces.workspaces().map((item) => item.id)).toEqual(['b']);
  });

  it('cancels a pending workspace load and does not share it with the next account', () => {
    const dropdown = TestBed.inject(WorkspaceDropdownStore);
    const workspaces = TestBed.inject(WorkspaceStore);
    auth.setSession(session('a'));
    workspaces.load();
    dropdown.load().subscribe();
    const old = http.expectOne(API_ENDPOINTS.workspaces.dropdown);
    auth.clearSession();
    expect(old.cancelled).toBe(true);
    auth.setSession(session('b'));
    dropdown.load().subscribe();
    http
      .expectOne(API_ENDPOINTS.workspaces.dropdown)
      .flush({ success: true, data: [workspace('b')] });
    expect(dropdown.selectedWorkspaceId()).toBe('b');
  });

  it('resets state on direct account replacement but preserves it for same-user token refresh', () => {
    const dropdown = TestBed.inject(WorkspaceDropdownStore);
    auth.setSession(session('a'));
    dropdown.setItems([workspace('a')]);
    auth.setSession({ ...session('a'), tokens: { accessToken: 'renewed-a' } });
    expect(dropdown.selectedWorkspaceId()).toBe('a');
    auth.setSession(session('b'));
    expect(dropdown.items()).toEqual([]);
  });

  it('cancels an old refresh before a new login can adopt its response', () => {
    auth.setSession(session('a'));
    TestBed.inject(AuthRefreshService).refreshSession().subscribe();
    const old = http.expectOne(API_ENDPOINTS.auth.refreshToken);
    service
      .login({ email: 'b@example.test', password: 'test-password', rememberMe: false })
      .subscribe();
    expect(old.cancelled).toBe(true);
    http.expectOne(API_ENDPOINTS.auth.login).flush({ success: true, data: session('b') });
    expect(auth.userId()).toBe('b');
  });

  it('shares startup restoration and emits the restored account', () => {
    const values: boolean[] = [];
    service.initializeSession().subscribe((value) => values.push(value));
    service.initializeSession().subscribe((value) => values.push(value));
    http.expectOne(API_ENDPOINTS.auth.refreshToken).flush({ success: true, data: session('a') });
    expect(values).toEqual([true, true]);
    expect(auth.userId()).toBe('a');
  });

  it('waits for startup restoration and preferences before allowing a protected deep link', () => {
    const decisions: unknown[] = [];
    service.initializeSession().subscribe();
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/app/today' } as RouterStateSnapshot),
    ) as Observable<unknown>;
    result.subscribe((decision) => decisions.push(decision));
    expect(decisions).toEqual([]);
    http.expectOne(API_ENDPOINTS.auth.refreshToken).flush({ success: true, data: session('a') });
    expect(decisions).toEqual([]);
    http.expectOne(API_ENDPOINTS.userPreferences.my).flush({ success: true, data: [] });
    TestBed.tick();
    expect(decisions).toEqual([true]);
  });

  it('does not log out when the retried API returns a genuine permission error', () => {
    auth.setSession(session('a'));
    const error = vi.fn();
    TestBed.inject(HttpClient).get(API_ENDPOINTS.workspaces.dropdown).subscribe({ error });
    http
      .expectOne(API_ENDPOINTS.workspaces.dropdown)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne(API_ENDPOINTS.auth.refreshToken).flush({ success: true, data: session('a') });
    http
      .expectOne(API_ENDPOINTS.workspaces.dropdown)
      .flush({}, { status: 403, statusText: 'Forbidden' });
    expect(error).toHaveBeenCalledOnce();
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('clears expired authentication and redirects when refresh fails', () => {
    auth.setSession(session('a'));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    TestBed.inject(HttpClient)
      .get(API_ENDPOINTS.workspaces.dropdown)
      .subscribe({ error: () => {} });
    http
      .expectOne(API_ENDPOINTS.workspaces.dropdown)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne(API_ENDPOINTS.auth.refreshToken)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledOnce();
  });

  it('clears every cache even if the logout endpoint fails', () => {
    const dropdown = TestBed.inject(WorkspaceDropdownStore);
    auth.setSession(session('a'));
    dropdown.setItems([workspace('a')]);
    service.logout().subscribe({ error: () => {} });
    http.expectOne(API_ENDPOINTS.auth.logout).flush({}, { status: 500, statusText: 'Unavailable' });
    expect(auth.isAuthenticated()).toBe(false);
    expect(dropdown.items()).toEqual([]);
  });

  it('cancels a pending refresh when logout starts', () => {
    auth.setSession(session('a'));
    TestBed.inject(AuthRefreshService).refreshSession().subscribe();
    const refresh = http.expectOne(API_ENDPOINTS.auth.refreshToken);
    service.logout().subscribe();
    expect(refresh.cancelled).toBe(true);
    http.expectOne(API_ENDPOINTS.auth.logout).flush({ success: true });
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('does not launch a queued workspace refresh during logout', () => {
    const dropdown = TestBed.inject(WorkspaceDropdownStore);
    auth.setSession(session('a'));
    dropdown.load().subscribe();
    const old = http.expectOne(API_ENDPOINTS.workspaces.dropdown);
    dropdown.refresh().subscribe();
    auth.clearSession();
    expect(old.cancelled).toBe(true);
    http.expectNone(API_ENDPOINTS.workspaces.dropdown);
  });

  it('keeps public invitation previews alive while restoring a session', () => {
    TestBed.inject(HttpClient)
      .post(API_ENDPOINTS.workspaceInvitations.validateToken, {})
      .subscribe();
    const preview = http.expectOne(API_ENDPOINTS.workspaceInvitations.validateToken);
    service.initializeSession().subscribe();
    http.expectOne(API_ENDPOINTS.auth.refreshToken).flush({ success: true, data: session('a') });
    expect(preview.cancelled).toBe(false);
    preview.flush({ success: true });
  });
});
