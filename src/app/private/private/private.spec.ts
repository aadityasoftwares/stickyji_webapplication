import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Private } from './private';
import { AuthService } from '../../public/auth/services/auth-service';
import { AuthStore } from '../../public/auth/state/auth.store';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { APP_ROUTES, routeCommands } from '../../shared/constants/route.constants';
import { STORAGE_KEYS } from '../../shared/constants/app.constants';
import { setLocalStorageItem, getLocalStorageItem } from '../../shared/functions/storage.functions';

describe('Private', () => {
  let component: Private;
  let fixture: ComponentFixture<Private>;
  let authService: AuthService;
  let authStore: AuthStore;
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

  it('should handle successful logout: calls service, clears session and workspace storage, and navigates to login', () => {
    const logoutResponse = { success: true, message: 'You have been logged out' };
    vi.spyOn(authService, 'logout').mockReturnValue(of(logoutResponse as any));
    const clearSessionSpy = vi.spyOn(authStore, 'clearSession');
    const navigateSpy = vi.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));
    const toastSpy = vi.spyOn(toastService, 'success');

    setLocalStorageItem(STORAGE_KEYS.WORKSPACE_ID, 'ws-123');
    expect(getLocalStorageItem(STORAGE_KEYS.WORKSPACE_ID)).toBe('ws-123');

    component.logout();

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(clearSessionSpy).toHaveBeenCalled();
    expect(getLocalStorageItem(STORAGE_KEYS.WORKSPACE_ID)).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(routeCommands(APP_ROUTES.LOGIN));
    expect(toastSpy).toHaveBeenCalledWith('You have been logged out', {
      title: 'See you soon!',
    });
    expect(component.loggingOut()).toBe(false);
  });

  it('should handle error during logout: still clears session, removes workspace, and navigates to login', () => {
    vi.spyOn(authService, 'logout').mockReturnValue(throwError(() => new Error('Network error')));
    const clearSessionSpy = vi.spyOn(authStore, 'clearSession');
    const navigateSpy = vi.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));
    const toastSpy = vi.spyOn(toastService, 'info');

    setLocalStorageItem(STORAGE_KEYS.WORKSPACE_ID, 'ws-456');

    component.logout();

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(clearSessionSpy).toHaveBeenCalled();
    expect(getLocalStorageItem(STORAGE_KEYS.WORKSPACE_ID)).toBeNull();
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
