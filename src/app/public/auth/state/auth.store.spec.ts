import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthStore } from './auth.store';
import { WorkspaceRoleApiService } from '../../../private/roles-permissions/services/workspace-role.service';
import { UserPreferenceStore } from '../../../private/user-preferences/services/user-preference.store';
import type { AuthenticatedUser } from '../models/auth.models';

const account = (roleId = 'global-role'): AuthenticatedUser => ({
  id: 'user',
  email: 'user@example.test',
  globalRoleId: roleId,
  status: 'ACTIVE',
  isEmailVerified: true,
  isMfaEnabled: false,
});
const globalRole = {
  id: 'global-role',
  scope: 'GLOBAL',
  isActive: true,
  permissions: [{ module: 'WORKSPACE', action: 'CREATE', isActive: true }],
};

describe('Global workspace creation permission', () => {
  const roles = { getById: vi.fn() };
  beforeEach(() => {
    roles.getById.mockReset().mockReturnValue(of({ data: globalRole }));
    TestBed.configureTestingModule({
      providers: [
        { provide: WorkspaceRoleApiService, useValue: roles },
        { provide: UserPreferenceStore, useValue: { reset: vi.fn() } },
      ],
    });
  });

  it('resolves the authenticated global role once and never uses a workspace role', () => {
    const store = TestBed.inject(AuthStore);
    store.setUser(account());
    store.loadGlobalPermissions();
    store.loadGlobalPermissions();
    TestBed.tick();
    expect(roles.getById).toHaveBeenCalledExactlyOnceWith('global-role');
    expect(store.canCreateWorkspace()).toBe(true);
    roles.getById.mockReturnValue(
      of({ data: { ...globalRole, id: 'invited-role', scope: 'WORKSPACE' } }),
    );
    store.setUser(account('invited-role'));
    expect(store.canCreateWorkspace()).toBe(false);
    TestBed.tick();
    expect(store.canCreateWorkspace()).toBe(false);
  });

  it('fails closed for missing, inactive or unavailable grants', () => {
    const store = TestBed.inject(AuthStore);
    store.setUser(account());
    roles.getById.mockReturnValue(of({ data: { ...globalRole, permissions: [] } }));
    store.loadGlobalPermissions();
    TestBed.tick();
    expect(store.canCreateWorkspace()).toBe(false);
    roles.getById.mockReturnValue(throwError(() => new Error('Unavailable')));
    store.setUser(account());
    TestBed.tick();
    expect(store.canCreateWorkspace()).toBe(false);
  });

  it('cancels stale account requests and clears grants on logout', () => {
    const response = new Subject();
    roles.getById.mockReturnValue(response);
    const store = TestBed.inject(AuthStore);
    store.setUser(account());
    store.loadGlobalPermissions();
    TestBed.tick();
    store.clearSession();
    TestBed.tick();
    response.next({ data: globalRole });
    expect(store.canCreateWorkspace()).toBe(false);
  });
});
