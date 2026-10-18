import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { ForgotPassword } from './forgot-password';

describe('ForgotPassword', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;
  const mockAuthService = {
    forgotPassword: vi.fn().mockReturnValue(of({ success: true, message: 'Reset email sent' })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show validation errors before submit is clicked', () => {
    expect(component.forgotPasswordForm.invalid).toBe(true);

    component.emailControl.markAsTouched();
    expect(component.emailError).toBe('');
  });

  it('should show validation errors only after submit is pressed', () => {
    component.submit();

    expect(component.submitted()).toBe(true);
    expect(component.emailError).toBe('Enter the email connected to your workspace.');

    // Once email is valid, error should clear immediately
    component.emailControl.setValue('user@example.com');
    expect(component.emailError).toBe('');
  });

  it('should call authService.forgotPassword and show success state on valid submit', () => {
    component.emailControl.setValue('user@example.com');
    component.submit();

    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('user@example.com');
    expect(component.resetSent()).toBe(true);
  });
});
