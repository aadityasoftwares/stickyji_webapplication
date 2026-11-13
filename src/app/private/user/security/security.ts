import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAlertTriangle,
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheck,
  LucideCheckCircle2,
  LucideCircleUserRound,
  LucideClock3,
  LucideEye,
  LucideEyeOff,
  LucideInfo,
  LucideKeyRound,
  LucideLock,
  LucideLockKeyhole,
  LucideLogOut,
  LucideMail,
  LucideRefreshCw,
  LucideShield,
  LucideShieldAlert,
  LucideShieldCheck,
  LucideSparkles,
  LucideX,
} from '@lucide/angular';
import { AuthService } from '../../../public/auth/services/auth-service';
import { AuthStore } from '../../../public/auth/state/auth.store';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Divider } from '../../../shared/components/divider/divider';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput } from '../../../shared/components/input/input';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { APP_ROUTES } from '../../../shared/constants/route.constants';
import { extractErrorMessage } from '../../../shared/functions/api.functions';

export type PasswordStrengthLevel = 'none' | 'weak' | 'fair' | 'good' | 'strong';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    AppIcon,
    Badge,
    Button,
    StickyCard,
    AppInput,
    Divider,
  ],
  templateUrl: './security.html',
  styleUrl: './security.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly routes = APP_ROUTES;

  // Icons
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideShieldAlert = LucideShieldAlert;
  readonly LucideKeyRound = LucideKeyRound;
  readonly LucideLockKeyhole = LucideLockKeyhole;
  readonly LucideLock = LucideLock;
  readonly LucideCheck = LucideCheck;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideX = LucideX;
  readonly LucideMail = LucideMail;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideCircleUserRound = LucideCircleUserRound;
  readonly LucideInfo = LucideInfo;
  readonly LucideAlertTriangle = LucideAlertTriangle;
  readonly LucideClock3 = LucideClock3;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideLogOut = LucideLogOut;

  // State Signals
  readonly submitting = signal(false);
  readonly sendingResetEmail = signal(false);
  readonly loggingOutAll = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly emailSentMessage = signal<string | null>(null);
  readonly passwordChangeSuccess = signal(false);
  readonly countdown = signal(3);

  // User Signals
  readonly user = computed(() => this.authStore.user());
  readonly userEmail = computed(() => this.authStore.userEmail() || 'your account email');
  readonly isEmailVerified = computed(() => this.authStore.isEmailVerified());
  readonly authProvider = computed(() => this.authStore.user()?.authProvider || 'local');
  readonly isSocialAccount = computed(() => {
    const provider = this.authProvider().toLowerCase();
    return provider === 'google' || provider === 'github';
  });

  changePasswordForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.destroyRef.onDestroy(() => {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    });
  }

  private initForm(): void {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: [
          '',
          [Validators.required, Validators.minLength(8), Validators.maxLength(128)],
        ],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(128),
            this.requireComplexityValidator,
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: [this.passwordsMatchValidator, this.passwordDifferentValidator],
      },
    );

    this.changePasswordForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
    });
  }

  get currentPasswordControl(): FormControl<string> {
    return this.changePasswordForm.controls['currentPassword'] as FormControl<string>;
  }

  get newPasswordControl(): FormControl<string> {
    return this.changePasswordForm.controls['newPassword'] as FormControl<string>;
  }

  get confirmPasswordControl(): FormControl<string> {
    return this.changePasswordForm.controls['confirmPassword'] as FormControl<string>;
  }

  // Field Errors
  get currentPasswordError(): string {
    const control = this.currentPasswordControl;
    if (!control.touched && !control.dirty) return '';
    if (control.hasError('required')) return 'Current password is required.';
    if (control.hasError('minlength')) return 'Password must be at least 8 characters.';
    return '';
  }

  get newPasswordError(): string {
    const control = this.newPasswordControl;
    if (!control.touched && !control.dirty) return '';
    if (control.hasError('required')) return 'New password is required.';
    if (control.hasError('minlength')) return 'Password must be at least 8 characters.';
    if (control.hasError('maxlength')) return 'Password cannot exceed 128 characters.';
    if (this.changePasswordForm.hasError('passwordMatchesCurrent')) {
      return 'New password must be different from your current password.';
    }
    return '';
  }

  get confirmPasswordError(): string {
    const control = this.confirmPasswordControl;
    if (!control.touched && !control.dirty) return '';
    if (control.hasError('required')) return 'Please confirm your new password.';
    if (this.changePasswordForm.hasError('passwordsMismatch')) {
      return 'Passwords do not match.';
    }
    return '';
  }

  // Live Criteria Helpers
  get hasMinLength(): boolean {
    const val = this.newPasswordControl.value || '';
    return val.length >= 8;
  }

  get hasUppercase(): boolean {
    const val = this.newPasswordControl.value || '';
    return /[A-Z]/.test(val);
  }

  get hasLowercase(): boolean {
    const val = this.newPasswordControl.value || '';
    return /[a-z]/.test(val);
  }

  get hasNumber(): boolean {
    const val = this.newPasswordControl.value || '';
    return /[0-9]/.test(val);
  }

  get hasSpecialChar(): boolean {
    const val = this.newPasswordControl.value || '';
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);
  }

  get isDifferentFromCurrent(): boolean {
    const current = this.currentPasswordControl.value || '';
    const next = this.newPasswordControl.value || '';
    return Boolean(current && next && current !== next);
  }

  get passwordsMatch(): boolean {
    const next = this.newPasswordControl.value || '';
    const confirm = this.confirmPasswordControl.value || '';
    return Boolean(next && confirm && next === confirm);
  }

  get passwordStrength(): {
    level: PasswordStrengthLevel;
    score: number;
    label: string;
    percent: number;
  } {
    const val = this.newPasswordControl.value || '';
    if (!val) {
      return { level: 'none', score: 0, label: 'Not entered', percent: 0 };
    }

    let score = 0;
    if (val.length >= 8) score++;
    if (val.length >= 12) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)) score++;

    if (score <= 1) {
      return { level: 'weak', score: 1, label: 'Weak', percent: 25 };
    }
    if (score === 2) {
      return { level: 'fair', score: 2, label: 'Fair', percent: 50 };
    }
    if (score <= 4) {
      return { level: 'good', score: 3, label: 'Good', percent: 75 };
    }
    return { level: 'strong', score: 4, label: 'Strong', percent: 100 };
  }

  // Custom Form Validators
  private requireComplexityValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    if (!value) return null;
    if (value.length < 8) return { minlength: true };
    return null;
  }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPass = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!newPass || !confirm) return null;
    return newPass === confirm ? null : { passwordsMismatch: true };
  }

  private passwordDifferentValidator(group: AbstractControl): ValidationErrors | null {
    const current = group.get('currentPassword')?.value;
    const next = group.get('newPassword')?.value;
    if (!current || !next) return null;
    return current === next ? { passwordMatchesCurrent: true } : null;
  }

  // Submit Handler
  submitChangePassword(): void {
    if (this.submitting() || this.passwordChangeSuccess()) return;

    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    const { currentPassword, newPassword } = this.changePasswordForm.value;

    this.submitting.set(true);

    this.authService
      .changePassword(currentPassword, newPassword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.submitting.set(false);
          this.passwordChangeSuccess.set(true);
          const msg =
            response?.message ||
            'Password updated successfully. All other sessions have been logged out for security.';
          this.successMessage.set(msg);
          this.toast.success('Password changed successfully!', { title: 'Account Security' });
          this.startRedirectCountdown();
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          const extracted = extractErrorMessage(error, '');

          if (
            extracted.includes('INVALID_CURRENT_PASSWORD') ||
            extracted.toLowerCase().includes('current password') ||
            error.status === 400
          ) {
            if (extracted.includes('different from')) {
              this.errorMessage.set('New password must be different from your current password.');
            } else {
              this.errorMessage.set(
                'The current password you entered is incorrect. If you cannot remember it, use the password reset link above.',
              );
              this.currentPasswordControl.setErrors({ incorrect: true });
            }
          } else {
            this.errorMessage.set(
              extracted ||
                'Failed to update your password. Please verify your entries and try again.',
            );
          }

          this.toast.error(this.errorMessage() || 'Password update failed.', {
            title: 'Security Error',
          });
        },
      });
  }

  // Quick Reset Link via Email
  requestPasswordResetEmail(): void {
    const email = this.authStore.userEmail();
    if (!email || this.sendingResetEmail()) return;

    this.sendingResetEmail.set(true);
    this.emailSentMessage.set(null);

    this.authService
      .forgotPassword(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.sendingResetEmail.set(false);
          const msg =
            response?.message || `Password reset instructions have been dispatched to ${email}.`;
          this.emailSentMessage.set(msg);
          this.toast.success('Reset link sent to your email!', { title: 'Email Dispatched' });
        },
        error: (error: HttpErrorResponse) => {
          this.sendingResetEmail.set(false);
          const msg = extractErrorMessage(
            error,
            'Unable to send reset instructions at this time. Please try again later.',
          );
          this.errorMessage.set(msg);
          this.toast.error(msg, { title: 'Reset Error' });
        },
      });
  }

  // Global Session Sign-Out
  signOutAllOtherSessions(): void {
    if (this.loggingOutAll()) return;

    this.loggingOutAll.set(true);

    this.authService
      .logoutAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loggingOutAll.set(false);
          this.toast.success('All active sessions have been signed out.');
          void this.router.navigate([this.routes.LOGIN], {
            queryParams: { reason: 'sessions_terminated' },
          });
        },
        error: () => {
          this.loggingOutAll.set(false);
          void this.router.navigate([this.routes.LOGIN]);
        },
      });
  }

  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  resetForm(): void {
    this.changePasswordForm.reset();
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  onSignInNow(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.authStore.clearSession();
    void this.router.navigate([this.routes.LOGIN], {
      queryParams: { reason: 'password_updated' },
    });
  }

  private startRedirectCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    let count = 3;
    this.countdown.set(count);
    this.countdownTimer = setInterval(() => {
      count--;
      this.countdown.set(count);
      if (count <= 0) {
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
        this.authStore.clearSession();
        void this.router.navigate([this.routes.LOGIN], {
          queryParams: { reason: 'password_updated' },
        });
      }
    }, 1000);
  }

  private focusFirstInvalid(): void {
    if (this.currentPasswordControl.invalid) {
      document.getElementById('security-current-password')?.focus();
    } else if (this.newPasswordControl.invalid) {
      document.getElementById('security-new-password')?.focus();
    } else if (this.confirmPasswordControl.invalid) {
      document.getElementById('security-confirm-password')?.focus();
    }
  }
}
