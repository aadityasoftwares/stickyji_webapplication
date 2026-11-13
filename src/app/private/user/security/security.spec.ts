import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SecurityComponent } from './security';
import { AuthService } from '../../../public/auth/services/auth-service';
import { AuthStore } from '../../../public/auth/state/auth.store';
import { ToastService } from '../../../shared/components/toast/services/toast.service';

describe('SecurityComponent', () => {
  let component: SecurityComponent;
  let fixture: ComponentFixture<SecurityComponent>;

  const authServiceMock = {
    changePassword: vi.fn(),
    forgotPassword: vi.fn(),
    logoutAll: vi.fn(),
  };

  const authStoreMock = {
    user: vi.fn(() => ({
      id: 'usr_123',
      email: 'test@stickyji.com',
      authProvider: 'local',
      isEmailVerified: true,
    })),
    userEmail: vi.fn(() => 'test@stickyji.com'),
    isEmailVerified: vi.fn(() => true),
    clearSession: vi.fn(),
  };

  const toastMock = {
    show: vi.fn(),
    success: vi.fn(),
    danger: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    authServiceMock.changePassword.mockReturnValue(
      of({ success: true, message: 'Password changed successfully.' }),
    );
    authServiceMock.forgotPassword.mockReturnValue(
      of({ success: true, message: 'Password reset email sent.' }),
    );
    authServiceMock.logoutAll.mockReturnValue(of({ success: true }));

    await TestBed.configureTestingModule({
      imports: [SecurityComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: AuthStore, useValue: authStoreMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component and initializes with default state', () => {
    expect(component).toBeTruthy();
    expect(component.changePasswordForm).toBeDefined();
    expect(component.changePasswordForm.valid).toBe(false);
    expect(component.userEmail()).toBe('test@stickyji.com');
  });

  it('renders account subnav linking profile and security', () => {
    const subnavLinks = fixture.nativeElement.querySelectorAll('.subnav-link');
    expect(subnavLinks.length).toBe(2);
    expect(subnavLinks[0].textContent).toContain('Profile');
    expect(subnavLinks[1].textContent).toContain('Password & Security');
  });

  it('evaluates password strength and criteria correctly', () => {
    const newPassCtrl = component.newPasswordControl;

    // None / Empty
    expect(component.passwordStrength.level).toBe('none');

    // Weak: short
    newPassCtrl.setValue('abc');
    expect(component.hasMinLength).toBe(false);

    // Meets 8 chars, mixed case, numbers, special
    newPassCtrl.setValue('SecretP@ss123');
    expect(component.hasMinLength).toBe(true);
    expect(component.hasUppercase).toBe(true);
    expect(component.hasLowercase).toBe(true);
    expect(component.hasNumber).toBe(true);
    expect(component.hasSpecialChar).toBe(true);
    expect(component.passwordStrength.level).toBe('strong');
  });

  it('validates that new password and confirm password must match', () => {
    component.currentPasswordControl.setValue('OldPassword123!');
    component.newPasswordControl.setValue('NewPassword123!');
    component.confirmPasswordControl.setValue('DifferentPass123!');

    expect(component.changePasswordForm.hasError('passwordsMismatch')).toBe(true);
    expect(component.passwordsMatch).toBe(false);

    component.confirmPasswordControl.setValue('NewPassword123!');
    expect(component.changePasswordForm.hasError('passwordsMismatch')).toBe(false);
    expect(component.passwordsMatch).toBe(true);
  });

  it('validates that new password cannot be identical to current password', () => {
    component.currentPasswordControl.setValue('ExactSamePassword123!');
    component.newPasswordControl.setValue('ExactSamePassword123!');
    component.confirmPasswordControl.setValue('ExactSamePassword123!');

    expect(component.changePasswordForm.hasError('passwordMatchesCurrent')).toBe(true);
    expect(component.isDifferentFromCurrent).toBe(false);
  });

  it('submits changePassword successfully and triggers redirect flow', () => {
    component.currentPasswordControl.setValue('CurrentPass123!');
    component.newPasswordControl.setValue('BrandNewPass123!');
    component.confirmPasswordControl.setValue('BrandNewPass123!');

    expect(component.changePasswordForm.valid).toBe(true);

    component.submitChangePassword();

    expect(authServiceMock.changePassword).toHaveBeenCalledWith(
      'CurrentPass123!',
      'BrandNewPass123!',
    );
    expect(component.passwordChangeSuccess()).toBe(true);
    expect(toastMock.success).toHaveBeenCalled();
  });

  it('handles backend error when current password is wrong', () => {
    const errorResponse = new HttpErrorResponse({
      error: { message: 'INVALID_CURRENT_PASSWORD' },
      status: 400,
      statusText: 'Bad Request',
    });
    authServiceMock.changePassword.mockReturnValue(throwError(() => errorResponse));

    component.currentPasswordControl.setValue('WrongCurrentPass123!');
    component.newPasswordControl.setValue('BrandNewPass123!');
    component.confirmPasswordControl.setValue('BrandNewPass123!');

    component.submitChangePassword();

    expect(component.submitting()).toBe(false);
    expect(component.errorMessage()).toContain('current password you entered is incorrect');
  });

  it('requests password reset email via forgotPassword', () => {
    component.requestPasswordResetEmail();

    expect(authServiceMock.forgotPassword).toHaveBeenCalledWith('test@stickyji.com');
    expect(component.emailSentMessage()).toContain('test@stickyji.com');
    expect(toastMock.success).toHaveBeenCalled();
  });

  it('signs out all active sessions when triggered', () => {
    component.signOutAllOtherSessions();

    expect(authServiceMock.logoutAll).toHaveBeenCalled();
  });
});
