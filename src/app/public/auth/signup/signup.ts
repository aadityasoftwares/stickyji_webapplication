import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  Router,
  RouterLink,
} from '@angular/router';
import { finalize } from 'rxjs';

import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCalendarDays,
  LucideCheckCircle2,
  LucideClock3,
  LucideLightbulb,
  LucideLockKeyhole,
  LucideMail,
  LucideShieldCheck,
  LucideSparkles,
} from '@lucide/angular';

import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { Divider } from '../../../shared/components/divider/divider';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput } from '../../../shared/components/input/input';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { ToastService } from '../../../shared/components/toast/services/toast.service';

import {
  AuthService,
} from '../services/auth-service';
import { RegisterCredentials, RegisterResponse } from '../models/auth.models';

type SignUpControl =
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'acceptTerms';

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value ?? '';
  const confirmPassword =
    control.get('confirmPassword')?.value ?? '';

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : {
      passwordMismatch: true,
    };
};

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AppIcon,
    Badge,
    Button,
    Checkbox,
    Divider,
    AppInput,
    StickyCard,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideClock3 = LucideClock3;
  readonly LucideLightbulb = LucideLightbulb;
  readonly LucideLockKeyhole = LucideLockKeyhole;
  readonly LucideMail = LucideMail;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideSparkles = LucideSparkles;

  @Input() brandName = 'MyStickyNotes';
  @Input() brandHref = '/';
  @Input() logoSrc?: string | null;
  @Input() logoAlt = '';
  @Input() initialEmail = '';
  @Input() redirectUrl = '/auth/verify-email';
  @Input() showGoogleSignUp = true;

  @Output()
  readonly googleSignUp = new EventEmitter<void>();

  readonly loading = signal(false);
  readonly submitted = signal(false);

  readonly signUpForm = this.formBuilder.nonNullable.group(
    {
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(254),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
        ],
      ],
      confirmPassword: [
        '',
        [
          Validators.required,
          Validators.maxLength(128),
        ],
      ],
      acceptTerms: [
        false,
        [
          Validators.requiredTrue,
        ],
      ],
    },
    {
      validators: passwordMatchValidator,
    },
  );

  constructor() {
    afterNextRender(() => {
      const email = this.initialEmail
        .trim()
        .toLowerCase();

      if (email) {
        this.emailControl.setValue(email);
      }

      this.focusControl('email');
    });
  }

  get emailControl() {
    return this.signUpForm.controls.email;
  }

  get passwordControl() {
    return this.signUpForm.controls.password;
  }

  get confirmPasswordControl() {
    return this.signUpForm.controls.confirmPassword;
  }

  get acceptTermsControl() {
    return this.signUpForm.controls.acceptTerms;
  }

  get emailError(): string {
    if (!this.shouldShowError(this.emailControl)) {
      return '';
    }

    if (this.emailControl.hasError('required')) {
      return 'Email address is required.';
    }

    if (this.emailControl.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (this.emailControl.hasError('maxlength')) {
      return 'Email address is too long.';
    }

    return '';
  }

  get passwordError(): string {
    if (!this.shouldShowError(this.passwordControl)) {
      return '';
    }

    if (this.passwordControl.hasError('required')) {
      return 'Password is required.';
    }

    if (this.passwordControl.hasError('minlength')) {
      return 'Use at least 8 characters.';
    }

    if (this.passwordControl.hasError('maxlength')) {
      return 'Password cannot exceed 128 characters.';
    }

    return '';
  }

  get confirmPasswordError(): string {
    const control = this.confirmPasswordControl;

    if (
      control.hasError('required') &&
      this.shouldShowError(control)
    ) {
      return 'Please confirm your password.';
    }

    if (
      control.hasError('maxlength') &&
      this.shouldShowError(control)
    ) {
      return 'Password cannot exceed 128 characters.';
    }

    const showMismatch =
      (
        this.submitted() ||
        control.touched ||
        control.dirty
      ) &&
      this.signUpForm.hasError(
        'passwordMismatch',
      );

    if (showMismatch) {
      return 'Passwords do not match.';
    }

    return '';
  }

  get termsError(): string {
    return this.shouldShowError(
      this.acceptTermsControl,
    )
      ? 'Please accept the Terms of Service and Privacy Policy.'
      : '';
  }

  submit(): void {
    if (this.loading()) {
      return;
    }

    this.submitted.set(true);

    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();

      this.focusControl(
        this.firstInvalidControl(),
      );

      return;
    }

    const value =
      this.signUpForm.getRawValue();

    const credentials: RegisterCredentials = {
      email: value.email
        .trim()
        .toLowerCase(),
      password: value.password,
      termsAccepted: value.acceptTerms,
      privacyPolicyAccepted: value.acceptTerms,
    };

    this.loading.set(true);

    this.signUpForm.disable({
      emitEvent: false,
    });

    this.authService
      .register(credentials)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);

          this.signUpForm.enable({
            emitEvent: false,
          });
        }),
      )
      .subscribe({
        next: (response) => {
          this.handleSuccess(response);
        },
        error: (error: HttpErrorResponse) => {
          this.handleFailure(error);
        },
      });
  }

  onSignIn(): void {
    if (this.loading()) {
      return;
    }

    void this.router.navigate(['/auth/login']);
  }

  onGoogleSignUp(): void {
    if (this.loading()) {
      return;
    }

    this.googleSignUp.emit();
  }

  private handleSuccess(
    response: RegisterResponse,
  ): void {
    if (!response?.success) {
      this.toastService.error(
        response?.message ||
        'We could not create your account. Please try again.',
        {
          title: 'Sign-up failed',
        },
      );

      return;
    }

    const email = this.emailControl.value
      .trim()
      .toLowerCase();

    this.toastService.success(
      response.message ||
      'Your workspace has been created.',
      {
        title: 'Welcome to MyStickyNotes!',
      },
    );

    void this.router.navigate(
      [this.safeRedirectUrl()],
      {
        queryParams: {
          email,
        },
      },
    );
  }

  private handleFailure(
    error: HttpErrorResponse,
  ): void {
    const message =
      this.resolveErrorMessage(error);

    this.toastService.error(
      message,
      {
        title:
          error.status === 409
            ? 'Account already exists'
            : error.status === 429
              ? 'Too many attempts'
              : 'Sign-up failed',
        duration:
          error.status === 429
            ? 8_000
            : 6_000,
        dedupeKey: 'signup-error',
      },
    );

    if (error.status === 409) {
      this.emailControl.markAsTouched();
      this.focusControl('email');
    }
  }

  private resolveErrorMessage(
    error: HttpErrorResponse,
  ): string {
    const message = this.backendMessage(error);

    if (error.status === 0) {
      return (
        'Unable to reach the server. ' +
        'Check your connection and try again.'
      );
    }

    if (
      error.status === 400 ||
      error.status === 409
    ) {
      return (
        message ||
        'Please check your account details.'
      );
    }

    if (error.status === 429) {
      return (
        message ||
        'Too many attempts. Please wait and try again.'
      );
    }

    if (error.status >= 500) {
      return (
        'The registration service is temporarily unavailable. ' +
        'Please try again shortly.'
      );
    }

    return (
      message ||
      'We could not create your account. Please try again.'
    );
  }

  private backendMessage(
    error: HttpErrorResponse,
  ): string {
    if (
      typeof error.error?.message === 'string'
    ) {
      return error.error.message;
    }

    if (
      typeof error.error?.error?.message ===
      'string'
    ) {
      return error.error.error.message;
    }

    return '';
  }

  private firstInvalidControl(): SignUpControl {
    if (this.emailControl.invalid) {
      return 'email';
    }

    if (this.passwordControl.invalid) {
      return 'password';
    }

    if (
      this.confirmPasswordControl.invalid ||
      this.signUpForm.hasError(
        'passwordMismatch',
      )
    ) {
      return 'confirmPassword';
    }

    return 'acceptTerms';
  }

  private focusControl(
    control: SignUpControl,
  ): void {
    const ids: Record<SignUpControl, string> = {
      email: 'sign-up-email',
      password: 'sign-up-password',
      confirmPassword: 'sign-up-confirm-password',
      acceptTerms: 'signup-terms',
    };

    requestAnimationFrame(() => {
      document
        .getElementById(ids[control])
        ?.focus();
    });
  }

  private safeRedirectUrl(): string {
    return (
      this.redirectUrl.startsWith('/') &&
      !this.redirectUrl.startsWith('//')
    )
      ? this.redirectUrl
      : '/auth/verify-email';
  }

  private shouldShowError(
    control: AbstractControl,
  ): boolean {
    return Boolean(
      control.invalid &&
      (
        this.submitted() ||
        control.touched ||
        control.dirty
      ),
    );
  }
}
