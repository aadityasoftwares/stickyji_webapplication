import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { AuthStore } from '../state/auth.store';
import { AuthService } from './auth-service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let authStore: AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService, AuthStore],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('registration view default', () => {
    const credentials = {
      firstName: 'New',
      lastName: 'Member',
      email: 'new@example.test',
      password: 'test-password',
      termsAccepted: true,
      privacyPolicyAccepted: true,
      timezoneCode: 'Asia/Kolkata',
      locale: 'en-IN',
    };
    const response = {
      success: true,
      data: {
        sessionId: 'new-session',
        tokens: { accessToken: 'new-token' },
        user: { id: 'new-user', email: 'new@example.test' },
      },
    };

    it('saves Notes as the initial view before completing registration', () => {
      const received = vi.fn();
      service.register(credentials).subscribe(received);
      httpTesting.expectOne(API_ENDPOINTS.auth.register).flush(response);
      const preference = httpTesting.expectOne(API_ENDPOINTS.userPreferences.update);
      expect(preference.request.body).toEqual({ key: 'todayView', value: 'NOTES' });
      expect(received).not.toHaveBeenCalled();
      preference.flush({ data: { key: 'todayView', value: 'NOTES' } });
      expect(received).toHaveBeenCalledWith(response);
    });

    it('creates the view preference when registration has not seeded it', () => {
      service.register(credentials).subscribe();
      httpTesting.expectOne(API_ENDPOINTS.auth.register).flush(response);
      httpTesting
        .expectOne(API_ENDPOINTS.userPreferences.update)
        .flush({}, { status: 404, statusText: 'Not Found' });
      const preference = httpTesting.expectOne(API_ENDPOINTS.userPreferences.create);
      expect(preference.request.body).toEqual({ key: 'todayView', value: 'NOTES' });
      preference.flush({ data: { key: 'todayView', value: 'NOTES' } });
    });

    it('retains successful registration if preference persistence fails', () => {
      const received = vi.fn();
      service.register(credentials).subscribe(received);
      httpTesting.expectOne(API_ENDPOINTS.auth.register).flush(response);
      httpTesting
        .expectOne(API_ENDPOINTS.userPreferences.update)
        .flush({}, { status: 500, statusText: 'Server Error' });
      expect(received).toHaveBeenCalledWith(response);
      expect(authStore.isAuthenticated()).toBe(true);
    });

    it('does not change the view on normal login', () => {
      service
        .login({ email: credentials.email, password: credentials.password, rememberMe: false })
        .subscribe();
      httpTesting.expectOne(API_ENDPOINTS.auth.login).flush(response);
      httpTesting.expectNone(API_ENDPOINTS.userPreferences.update);
    });
  });

  describe('logout', () => {
    it('sends POST to /auth/logout with sessionId and withCredentials, clearing session on success', () => {
      authStore.setSession({
        sessionId: 'sess-123',
        tokens: { accessToken: 'token-abc' },
        user: { id: 'u-1', email: 'test@example.com' } as any,
      });

      const clearSpy = vi.spyOn(authStore, 'clearSession');

      service.logout().subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpTesting.expectOne(API_ENDPOINTS.auth.logout);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ sessionId: 'sess-123' });
      expect(req.request.withCredentials).toBe(true);

      req.flush({ success: true, message: 'Logged out successfully' });
      expect(clearSpy).toHaveBeenCalled();
    });

    it('supports GET /auth/logout with query params when specified', () => {
      authStore.setSession({
        sessionId: 'sess-456',
        tokens: { accessToken: 'token-xyz' },
        user: { id: 'u-2', email: 'test2@example.com' } as any,
      });

      const clearSpy = vi.spyOn(authStore, 'clearSession');

      service.logout({ method: 'GET' }).subscribe();

      const req = httpTesting.expectOne(
        (request) =>
          request.url === API_ENDPOINTS.auth.logout &&
          request.params.get('sessionId') === 'sess-456',
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);

      req.flush({ success: true, message: 'Logged out' });
      expect(clearSpy).toHaveBeenCalled();
    });

    it('supports custom alias endpoint such as userLogout', () => {
      service.logout({ endpoint: API_ENDPOINTS.auth.userLogout }).subscribe();

      const req = httpTesting.expectOne(API_ENDPOINTS.auth.userLogout);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ success: true });
    });

    it('clears session even when logout HTTP request fails', () => {
      authStore.setSession({
        sessionId: 'sess-fail',
        tokens: { accessToken: 'token-exp' },
        user: { id: 'u-3', email: 'test3@example.com' } as any,
      });

      const clearSpy = vi.spyOn(authStore, 'clearSession');

      service.logout().subscribe({
        error: () => {
          // Expected failure
        },
      });

      const req = httpTesting.expectOne(API_ENDPOINTS.auth.logout);
      req.flush(
        { success: false, message: 'Token expired' },
        { status: 401, statusText: 'Unauthorized' },
      );

      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('sends POST to /auth/logoutall with withCredentials, clearing session', () => {
      authStore.setSession({
        sessionId: 'sess-all',
        tokens: { accessToken: 'token-all' },
        user: { id: 'u-4', email: 'test4@example.com' } as any,
      });

      const clearSpy = vi.spyOn(authStore, 'clearSession');

      service.logoutAll().subscribe();

      const req = httpTesting.expectOne(API_ENDPOINTS.auth.logoutAll);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);

      req.flush({ success: true, message: 'All sessions revoked' });
      expect(clearSpy).toHaveBeenCalled();
    });
  });
});
