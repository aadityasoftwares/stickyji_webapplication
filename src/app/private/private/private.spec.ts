import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Private } from './private';
import { AuthService } from '../../public/auth/services/auth-service';
import { AuthStore } from '../../public/auth/state/auth.store';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { APP_ROUTES, routeCommands } from '../../shared/constants/route.constants';
import { USER_PREFERENCE_KEYS } from '../../shared/constants/common.constants';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';

describe('Private', () => {
  let component: Private;
  let fixture: ComponentFixture<Private>;
  let authService: AuthService;
  let authStore: AuthStore;
  let userPreferenceStore: UserPreferenceStore;
  let router: Router;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Private],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Private);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    authStore = TestBed.inject(AuthStore);
    userPreferenceStore = TestBed.inject(UserPreferenceStore);
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService);
    await fixture.whenStable();
  });

  it('opens mobile navigation and returns focus to its opener after Escape', async () => {
    const opener: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.mobile-navigation-bar button',
    );
    opener.click();
    await fixture.whenStable();
    expect(component.mobileSidebarOpen()).toBe(true);
    expect(opener.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('.mobile-close button'),
    );
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(component.mobileSidebarOpen()).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('closes the mobile drawer from the backdrop', async () => {
    component.openMobileSidebar();
    await fixture.whenStable();
    fixture.nativeElement.querySelector('.sidebar-scrim').click();
    await fixture.whenStable();
    expect(component.mobileSidebarOpen()).toBe(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('updates and saves sidebarCollapsed in userPreferenceStore', () => {
    const saveSpy = vi.spyOn(userPreferenceStore, 'setAndSave');

    component.setSidebarCollapsed(true);

    expect(component.sidebarCollapsed()).toBe(true);
    expect(saveSpy).toHaveBeenCalledWith(USER_PREFERENCE_KEYS.SIDEBAR_COLLAPSED, true);
  });

  it('should handle successful logout: calls service, clears session and preferences, and navigates to login', () => {
    const logoutResponse = { success: true, message: 'You have been logged out' };
    vi.spyOn(authService, 'logout').mockReturnValue(of(logoutResponse as any));
    const clearSessionSpy = vi.spyOn(authStore, 'clearSession');
    const resetPreferencesSpy = vi.spyOn(userPreferenceStore, 'reset');
    const navigateSpy = vi.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));
    const toastSpy = vi.spyOn(toastService, 'success');

    const workspaceStore = TestBed.inject(WorkspaceStore);
    const resetWorkspaceSpy = vi.spyOn(workspaceStore, 'reset');

    component.logout();

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(clearSessionSpy).toHaveBeenCalled();
    expect(resetWorkspaceSpy).toHaveBeenCalled();
    expect(resetPreferencesSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(routeCommands(APP_ROUTES.LOGIN));
    expect(toastSpy).toHaveBeenCalledWith('You have been logged out', {
      title: 'See you soon!',
    });
    expect(component.loggingOut()).toBe(false);
  });

  it('should handle error during logout: still clears session, resets preferences, and navigates to login', () => {
    vi.spyOn(authService, 'logout').mockReturnValue(throwError(() => new Error('Network error')));
    const clearSessionSpy = vi.spyOn(authStore, 'clearSession');
    const resetPreferencesSpy = vi.spyOn(userPreferenceStore, 'reset');
    const navigateSpy = vi.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));
    const toastSpy = vi.spyOn(toastService, 'info');

    component.logout();

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(clearSessionSpy).toHaveBeenCalled();
    expect(resetPreferencesSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(routeCommands(APP_ROUTES.LOGIN));
    expect(toastSpy).toHaveBeenCalledWith('You have been logged out.');
    expect(component.loggingOut()).toBe(false);
  });

  it('should prevent repeated logout triggers when already loggingOut', () => {
    vi.spyOn(authService, 'logout').mockReturnValue(of({ success: true } as any));
    component.loggingOut.set(true);

    component.logout();

    expect(authService.logout).not.toHaveBeenCalled();
  });
});
