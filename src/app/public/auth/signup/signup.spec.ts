import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { Signup } from './signup';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;
  const mockAuthService = {
    register: vi.fn().mockReturnValue(of({ success: true, message: 'Account created' })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show validation errors before submit is clicked', () => {
    // Controls are invalid initially
    expect(component.signUpForm.invalid).toBe(true);

    // Touch and dirty the control
    component.firstNameControl.markAsTouched();
    component.firstNameControl.markAsDirty();

    // Errors should still be empty before submit
    expect(component.firstNameError).toBe('');
    expect(component.emailError).toBe('');
    expect(component.passwordError).toBe('');
    expect(component.termsError).toBe('');
  });

  it('should show validation errors only after submit is pressed', () => {
    component.submit();

    expect(component.submitted()).toBe(true);
    expect(component.firstNameError).toBe('First name is required.');
    expect(component.emailError).toBe('Email address is required.');
    expect(component.passwordError).toBe('Password is required.');
    expect(component.termsError).toBe('Please accept the Terms of Service and Privacy Policy.');

    // Once a field is corrected, its error should clear immediately
    component.firstNameControl.setValue('Aaditya');
    expect(component.firstNameError).toBe('');
  });
});
