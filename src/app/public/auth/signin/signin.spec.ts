import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { Signin } from './signin';

describe('Signin', () => {
  let component: Signin;
  let fixture: ComponentFixture<Signin>;
  const mockAuthService = {
    login: vi.fn().mockReturnValue(of({ success: true, message: 'Signed in' })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signin],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Signin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show validation errors before submit is clicked', () => {
    expect(component.signInForm.invalid).toBe(true);

    component.emailControl.markAsTouched();
    component.passwordControl.markAsTouched();

    expect(component.emailError).toBe('');
    expect(component.passwordError).toBe('');
  });

  it('should show validation errors only after submit is pressed', () => {
    component.submit();

    expect(component.submitted()).toBe(true);
    expect(component.emailError).toBe('Enter the email connected to your workspace.');
    expect(component.passwordError).toBe('Enter your password.');

    // Once a field is corrected, its error should clear immediately
    component.emailControl.setValue('test@example.com');
    expect(component.emailError).toBe('');
  });
});
