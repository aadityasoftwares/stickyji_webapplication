import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { ResetPasswordResponse } from '../models/auth.models';
import { ResetPassword } from './reset-password';

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  const authService = { resetPassword: vi.fn() };
  const route = { snapshot: { queryParamMap: convertToParamMap({ token: 'test-reset-token' }) } };

  beforeEach(async () => {
    authService.resetPassword
      .mockReset()
      .mockReturnValue(of({ success: true, message: 'Password updated' }));
    route.snapshot.queryParamMap = convertToParamMap({ token: 'test-reset-token' });
    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: route },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function fillPasswords(confirmPassword = 'ExamplePassword123'): void {
    component.resetPasswordForm.setValue({ password: 'ExamplePassword123', confirmPassword });
    fixture.detectChanges();
  }

  it('shows both password controls and guidance without initial errors', () => {
    expect(fixture.nativeElement.querySelector('#reset-password')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#reset-confirm-password')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#reset-password-guide')).toBeTruthy();
    expect(component.passwordError).toBe('');
    expect(component.confirmPasswordError).toBe('');
  });

  it('prevents submission when the passwords differ', () => {
    fillPasswords('DifferentPassword123');
    component.submit();
    fixture.detectChanges();
    expect(component.confirmPasswordError).toBe('Passwords do not match.');
    expect(fixture.nativeElement.textContent).toContain('Passwords do not match.');
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('disables submission while loading and shows the success state afterwards', () => {
    const response = new Subject<ResetPasswordResponse>();
    authService.resetPassword.mockReturnValue(response);
    fillPasswords();
    component.submit();
    fixture.detectChanges();
    expect(component.loading()).toBe(true);
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
    expect(authService.resetPassword).toHaveBeenCalledWith(
      'test-reset-token',
      'ExamplePassword123',
    );
    response.next({ success: true, message: 'Password updated' });
    response.complete();
    fixture.detectChanges();
    expect(component.loading()).toBe(false);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.querySelector('#reset-success-title')).toBeTruthy();
  });

  it('shows expired links and keeps the new-link action available', () => {
    authService.resetPassword.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'Reset token expired' },
          }),
      ),
    );
    fillPasswords();
    component.submit();
    fixture.detectChanges();
    expect(component.invalidLink()).toBe(true);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const action = fixture.nativeElement.querySelector(
      '.invalid-state app-button button',
    ) as HTMLButtonElement;
    expect(action.textContent).toContain('Request a new reset link');
    action.click();
    expect(navigate).toHaveBeenCalledWith('/auth/forgot-password');
  });

  it('shows an invalid-link state when the token is missing', () => {
    route.snapshot.queryParamMap = convertToParamMap({});
    component.ngOnInit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#invalid-reset-title')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('keeps the form available after a temporary server error', () => {
    authService.resetPassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 503 })),
    );
    fillPasswords();
    component.submit();
    fixture.detectChanges();
    expect(component.invalidLink()).toBe(false);
    expect(component.resetPasswordForm.enabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.form-alert')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(false);
  });
});
