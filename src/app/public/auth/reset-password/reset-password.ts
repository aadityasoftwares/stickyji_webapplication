import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheck,
  LucideCheckCircle2,
  LucideKeyRound,
  LucideLockKeyhole,
  LucideRefreshCw,
  LucideShieldCheck,
  LucideSparkles,
} from '@lucide/angular';

import { AppIcon } from '../../../shared/components/icon/icon';
import { Button } from '../../../shared/components/button/button';
import { Input as AppInput } from '../../../shared/components/input/input';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { extractErrorMessage } from '../../../shared/functions/api.functions';
import { AUTH_MESSAGES } from '../messages/auth.messages';

import { AuthService } from '../services/auth-service';
import { ResetPasswordResponse } from '../models/auth.models';

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value ?? '';
  const confirmPassword = control.get('confirmPassword')?.value ?? '';

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
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppIcon, Button, AppInput, StickyCard],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly brandName = 'Sticky Ji';
  readonly brandHref = '/';
  readonly logoSrc = 'StickyJiHorizontalLogo.png';
  readonly logoAlt = 'Sticky Ji';

  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly resetComplete = signal(false);
  readonly invalidLink = signal(false);
  readonly serverError = signal('');
  readonly resetToken = signal('');

  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideKeyRound = LucideKeyRound;
  readonly LucideLockKeyhole = LucideLockKeyhole;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideSparkles = LucideSparkles;

  readonly resetPasswordForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required, Validators.maxLength(128)]],
    },
    {
      validators: passwordsMatchValidator,
    },
  );

  constructor() {
    afterNextRender(() => {
      this.focusControl('reset-password');
    });
  }

  ngOnInit(): void {
    const token = (this.route.snapshot.queryParamMap.get('token') ?? '').trim();

    if (!token) {
      this.invalidLink.set(true);
      this.serverError.set('This password reset link is missing or invalid.');

      return;
    }

    this.resetToken.set(token);
  }

  get passwordControl() {
    return this.resetPasswordForm.controls.password;
  }

  get confirmPasswordControl() {
    return this.resetPasswordForm.controls.confirmPassword;
  }

  get passwordError(): string {
    const control = this.passwordControl;

    if (!this.shouldShowError(control)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Enter your new password.';
    }

    if (control.hasError('minlength')) {
      return 'Password must be at least 8 characters.';
    }

    if (control.hasError('maxlength')) {
      return 'Password cannot exceed 128 characters.';
    }

    return 'Please check your password.';
  }

  get confirmPasswordError(): string {
    const control = this.confirmPasswordControl;

    if (control.hasError('required') && this.shouldShowError(control)) {
      return 'Confirm your new password.';
    }

    const shouldShowMismatch =
      this.submitted() && this.resetPasswordForm.hasError('passwordMismatch');

    if (shouldShowMismatch) {
      return 'Passwords do not match.';
    }

    return '';
  }

  get hasMinimumLength(): boolean {
    return this.passwordControl.value.length >= 8;
  }

  get passwordsMatch(): boolean {
    const password = this.passwordControl.value;
    const confirmPassword = this.confirmPasswordControl.value;

    return Boolean(password && confirmPassword && password === confirmPassword);
  }

  submit(): void {
    if (this.loading() || this.invalidLink() || this.resetComplete()) {
      return;
    }

    this.submitted.set(true);
    this.serverError.set('');

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      this.focusFirstInvalidControl();

      return;
    }

    const token = this.resetToken();

    if (!token) {
      this.invalidLink.set(true);
      this.serverError.set('This password reset link is invalid.');

      return;
    }

    const password = this.passwordControl.value;

    this.loading.set(true);

    this.resetPasswordForm.disable({
      emitEvent: false,
    });

    this.authService
      .resetPassword(token, password)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);

          if (!this.resetComplete() && !this.invalidLink()) {
            this.resetPasswordForm.enable({
              emitEvent: false,
            });
          }
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

    void this.router.navigateByUrl('/auth/login');
  }

  onRequestNewLink(): void {
    if (this.loading()) {
      return;
    }

    void this.router.navigateByUrl('/auth/forgot-password');
  }

  private handleSuccess(response: ResetPasswordResponse): void {
    if (!response?.success) {
      this.serverError.set(response?.message || AUTH_MESSAGES.ERROR.RESET_FAILED);

      this.resetPasswordForm.enable({
        emitEvent: false,
      });

      return;
    }

    this.resetComplete.set(true);
    this.serverError.set('');
    this.resetPasswordForm.reset();

    this.toastService.success(response.message || AUTH_MESSAGES.SUCCESS.PASSWORD_RESET, {
      title: 'Password updated',
    });
  }

  private handleFailure(error: HttpErrorResponse): void {
    const message = this.resolveErrorMessage(error);

    this.serverError.set(message);

    if (this.isInvalidResetTokenError(error)) {
      this.invalidLink.set(true);
    }

    this.toastService.error(message, {
      title: this.invalidLink() ? 'Reset link unavailable' : 'Password reset failed',
      duration: error.status === 429 ? 8_000 : 6_000,
      dedupeKey: 'reset-password-error',
    });
  }

  private isInvalidResetTokenError(error: HttpErrorResponse): boolean {
    if (error.status !== 400) {
      return false;
    }

    const message = extractErrorMessage(error, '').toLowerCase();

    return (
      message.includes('token') || message.includes('expired') || message.includes('reset link')
    );
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const backendMessage = extractErrorMessage(error, '');

    if (error.status === 0) {
      return 'Unable to reach the server. ' + 'Check your connection and try again.';
    }

    if (error.status === 400) {
      return backendMessage || 'This password reset link is invalid or has expired.';
    }

    if (error.status === 422) {
      return backendMessage || 'Please check your new password and try again.';
    }

    if (error.status === 429) {
      return backendMessage || 'Too many attempts. Please wait before trying again.';
    }

    if (error.status >= 500) {
      return (
        backendMessage || 'Password reset is temporarily unavailable. Please try again shortly.'
      );
    }

    return backendMessage || 'We could not reset your password. Please try again.';
  }

  private shouldShowError(control: AbstractControl): boolean {
    return Boolean(control.invalid && this.submitted());
  }

  private focusFirstInvalidControl(): void {
    const id = this.passwordControl.invalid ? 'reset-password' : 'reset-confirm-password';

    this.focusControl(id);
  }

  private focusControl(id: string): void {
    requestAnimationFrame(() => {
      document.getElementById(id)?.focus();
    });
  }
}
