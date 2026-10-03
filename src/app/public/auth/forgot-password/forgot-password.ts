import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnInit,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { finalize } from 'rxjs';

import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheckCircle2,
  LucideLockKeyhole,
  LucideMail,
  LucideShieldCheck,
  LucideSparkles,
} from '@lucide/angular';

import { AppIcon } from '../../../shared/components/icon/icon';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Input as AppInput } from '../../../shared/components/input/input';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { AUTH_MESSAGES } from '../messages/auth.messages';

import {
  AuthService,
} from '../services/auth-service';
import { ForgotPasswordResponse } from '../models/auth.models';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AppIcon,
    Badge,
    Button,
    AppInput,
    StickyCard,
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  @Input() brandName = 'MyStickyNotes';
  @Input() brandHref = '/';
  @Input() logoSrc: string | null = null;
  @Input() logoAlt = '';
  @Input() initialEmail = '';

  readonly loading = signal(false);
  readonly resetSent = signal(false);
  readonly serverError = signal('');
  readonly submitted = signal(false);

  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideLockKeyhole = LucideLockKeyhole;
  readonly LucideMail = LucideMail;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideSparkles = LucideSparkles;

  readonly forgotPasswordForm = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(254),
      ],
    ],
  });

  constructor() {
    afterNextRender(() => {
      this.focusEmail();
    });
  }

  ngOnInit(): void {
    const inputEmail = this.initialEmail
      .trim()
      .toLowerCase();

    const queryEmail = (
      this.route.snapshot.queryParamMap.get('email') ?? ''
    )
      .trim()
      .toLowerCase();

    const email = inputEmail || queryEmail;

    if (email) {
      this.emailControl.setValue(email);
    }
  }

  get emailControl() {
    return this.forgotPasswordForm.controls.email;
  }

  get submittedEmail(): string {
    return this.emailControl.value
      .trim()
      .toLowerCase();
  }

  get emailError(): string {
    const control = this.emailControl;

    const shouldShow =
      control.invalid &&
      (
        this.submitted() ||
        control.touched ||
        control.dirty
      );

    if (!shouldShow) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Enter the email connected to your workspace.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (control.hasError('maxlength')) {
      return 'Email address is too long.';
    }

    return 'Please check your email address.';
  }

  submit(): void {
    if (this.loading()) {
      return;
    }

    this.submitted.set(true);

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      this.focusEmail();

      return;
    }

    this.sendResetRequest(false);
  }

  resend(): void {
    if (
      this.loading() ||
      !this.submittedEmail
    ) {
      return;
    }

    this.sendResetRequest(true);
  }

  onSignIn(): void {
    if (this.loading()) {
      return;
    }

    const email = this.submittedEmail;

    void this.router.navigate(
      ['/auth/login'],
      {
        queryParams: email
          ? { email }
          : undefined,
      },
    );
  }

  private sendResetRequest(
    resend: boolean,
  ): void {
    const email = this.submittedEmail;

    if (!email) {
      return;
    }

    this.serverError.set('');
    this.loading.set(true);

    this.forgotPasswordForm.disable({
      emitEvent: false,
    });

    this.authService
      .forgotPassword(email)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);

          this.forgotPasswordForm.enable({
            emitEvent: false,
          });
        }),
      )
      .subscribe({
        next: (response) => {
          this.handleSuccess(
            response,
            resend,
          );
        },
        error: (error: HttpErrorResponse) => {
          this.handleFailure(error);
        },
      });
  }

  private handleSuccess(
    response: ForgotPasswordResponse,
    resend: boolean,
  ): void {
    if (!response?.success) {
      this.serverError.set(
        response?.message ||
        AUTH_MESSAGES.ERROR.RESET_EMAIL_FAILED,
      );

      return;
    }

    this.resetSent.set(true);

    this.toastService.success(
      resend
        ? AUTH_MESSAGES.SUCCESS.RESET_LINK_REQUESTED_AGAIN
        : response.message ||
        AUTH_MESSAGES.SUCCESS.RESET_INSTRUCTIONS_SENT,
      {
        title: resend
          ? 'Reset link requested'
          : 'Check your inbox',
      },
    );
  }

  private handleFailure(
    error: HttpErrorResponse,
  ): void {
    const message =
      this.resolveErrorMessage(error);

    this.serverError.set(message);

    this.toastService.error(
      message,
      {
        title:
          error.status === 429
            ? 'Too many requests'
            : 'Unable to send reset link',
        duration:
          error.status === 429
            ? 8_000
            : 6_000,
        dedupeKey:
          'forgot-password-error',
      },
    );
  }

  private resolveErrorMessage(
    error: HttpErrorResponse,
  ): string {
    const backendMessage =
      this.backendMessage(error);

    if (error.status === 0) {
      return (
        'Unable to reach the server. ' +
        'Check your connection and try again.'
      );
    }

    if (error.status === 400) {
      return (
        backendMessage ||
        'Please check your email address.'
      );
    }

    if (error.status === 429) {
      return (
        backendMessage ||
        'Too many password reset requests. Please wait before trying again.'
      );
    }

    if (error.status >= 500) {
      return (
        backendMessage ||
        'Password recovery is temporarily unavailable. Please try again shortly.'
      );
    }

    return (
      backendMessage ||
      'We could not send the reset link. Please try again.'
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

  private focusEmail(): void {
    requestAnimationFrame(() => {
      document
        .getElementById(
          'forgot-password-email',
        )
        ?.focus();
    });
  }
}
