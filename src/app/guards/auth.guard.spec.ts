import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { AuthStore } from '../public/auth/state/auth.store';
import { UserPreferenceStore } from '../private/user-preferences/services/user-preference.store';
import { UserPreferenceService } from '../private/user-preferences/services/user-preference.service';
import { UserDatePipe } from '../shared/pipes/user-date.pipe';
import { authGuard } from './auth.guard';

@Component({ standalone: true, imports: [UserDatePipe], template: `{{ timestamp | userDate:'datetime' }}` })
class DateScreen { readonly timestamp = '2026-10-09T03:32:55.742Z'; }
@Component({ standalone: true, template: 'Login' })
class LoginScreen {}

describe('Authenticated preference initialization', () => {
  let response: Subject<unknown>;
  let api: { getMyPreferences: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    response = new Subject();
    api = { getMyPreferences: vi.fn(() => response) };
    TestBed.configureTestingModule({ providers: [
      { provide: UserPreferenceService, useValue: api },
      provideRouter([
        { path: 'private', canActivate: [authGuard], component: DateScreen },
        { path: 'auth/login', component: LoginScreen },
      ]),
    ] });
    TestBed.inject(AuthStore).setSession({
      user: { id: 'user', email: 'user@example.test', globalRoleId: '', status: 'ACTIVE', isEmailVerified: true, isMfaEnabled: false },
      sessionId: 'session', tokens: { accessToken: 'token' },
    });
  });

  it('waits for saved preferences before rendering date-dependent screens', async () => {
    const harness = await RouterTestingHarness.create();
    const navigation = harness.navigateByUrl('/private', DateScreen);
    await vi.waitFor(() => expect(api.getMyPreferences).toHaveBeenCalledOnce());
    expect(harness.routeNativeElement).toBeNull();
    response.next({ data: [{ key: 'timezone', value: 'Asia/Kolkata' }] });
    response.complete();
    await navigation;
    expect(harness.routeNativeElement?.textContent?.trim()).toBe('09/10/2026 09:02 AM');
    TestBed.inject(UserPreferenceStore).load();
    expect(api.getMyPreferences).toHaveBeenCalledOnce();
  });

  it('opens the screen with UTC defaults after a preference API failure', async () => {
    const harness = await RouterTestingHarness.create();
    const navigation = harness.navigateByUrl('/private', DateScreen);
    await vi.waitFor(() => expect(api.getMyPreferences).toHaveBeenCalledOnce());
    response.error(new Error('Offline'));
    await navigation;
    expect(harness.routeNativeElement?.textContent?.trim()).toBe('09/10/2026 03:32 AM');
    expect(TestBed.inject(UserPreferenceStore).error()).toBeTruthy();
  });

  it('does not fetch preferences for unauthenticated users', async () => {
    TestBed.inject(AuthStore).clearSession();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/private', LoginScreen);
    expect(api.getMyPreferences).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toContain('/auth/login');
  });
});
