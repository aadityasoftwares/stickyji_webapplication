import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
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
  LucideUserRound,
} from '@lucide/angular';

import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { Divider } from '../../../shared/components/divider/divider';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput } from '../../../shared/components/input/input';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { extractErrorMessage } from '../../../shared/functions/api.functions';
import { SeoService } from '../../../shared/services/seo.service';
import { AUTH_MESSAGES } from '../messages/auth.messages';

import { AuthService } from '../services/auth-service';
import {
  RegisterCredentials,
  RegisterResponse,
} from '../models/auth.models';

type SignUpControl =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'password'
  | 'acceptTerms';

interface BrowserRegistrationContext {
  timezoneCode: string;
  locale: string;
  countryCodeHint?: string;
}

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
export class Signup implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seoService = inject(SeoService);

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
  readonly LucideUserRound = LucideUserRound;

  @Input() brandName = 'Sticky Ji';
  @Input() brandHref = '/';
  @Input() logoSrc?: string | null = 'StickyJiHorizontalLogo.png';
  @Input() logoAlt = 'Sticky Ji';
  @Input() initialEmail = '';
  @Input() redirectUrl = '/auth/verify-email';
  @Input() showGoogleSignUp = true;

  @Output()
  readonly googleSignUp = new EventEmitter<void>();

  readonly loading = signal(false);
  readonly submitted = signal(false);

  readonly signUpForm = this.formBuilder.nonNullable.group({
    firstName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
      ],
    ],
    lastName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
      ],
    ],
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
    acceptTerms: [
      false,
      [
        Validators.requiredTrue,
      ],
    ],
  });

  constructor() {
    afterNextRender(() => {
      const email = this.initialEmail
        .trim()
        .toLowerCase();

      if (email) {
        this.emailControl.setValue(email);
      }

      this.focusControl('firstName');
    });
  }

  ngOnInit(): void {
    this.initSeo();
  }

  get firstNameControl() {
    return this.signUpForm.controls.firstName;
  }

  get lastNameControl() {
    return this.signUpForm.controls.lastName;
  }

  get emailControl() {
    return this.signUpForm.controls.email;
  }

  get passwordControl() {
    return this.signUpForm.controls.password;
  }

  get acceptTermsControl() {
    return this.signUpForm.controls.acceptTerms;
  }

  get firstNameError(): string {
    return this.nameError(
      this.firstNameControl,
      'First name',
    );
  }

  get lastNameError(): string {
    return this.nameError(
      this.lastNameControl,
      'Last name',
    );
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
      this.focusControl(this.firstInvalidControl());
      return;
    }

    const value = this.signUpForm.getRawValue();
    const browserContext =
      this.getBrowserRegistrationContext();

    const credentials: RegisterCredentials = {
      firstName: this.normalizeName(value.firstName),
      lastName: this.normalizeName(value.lastName),
      email: value.email
        .trim()
        .toLowerCase(),
      password: value.password,

      termsAccepted: value.acceptTerms,
      privacyPolicyAccepted: value.acceptTerms,

      // Collected silently from the browser.
      timezoneCode: browserContext.timezoneCode,
      locale: browserContext.locale,

      // This is only a hint. The backend should validate
      // it or use the configured India default.
      ...(browserContext.countryCodeHint && {
        countryCodeHint:
          browserContext.countryCodeHint,
      }),
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

  private getBrowserRegistrationContext():
    BrowserRegistrationContext {
    return {
      locale: this.resolveBrowserLocale(),
      timezoneCode: this.resolveBrowserTimezone(),

      // Application is currently India-only.
      countryCodeHint: 'IN',
    };
  }

  private resolveBrowserLocale(): string {
    if (typeof navigator === 'undefined') {
      return 'en-IN';
    }

    return (
      navigator.languages?.find(Boolean) ||
      navigator.language ||
      'en-IN'
    );
  }

  private resolveBrowserTimezone(): string {
    try {
      const timezone =
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone ||
        'Asia/Kolkata';

      // Normalize the older IANA alias used by some browsers/systems.
      return timezone === 'Asia/Calcutta'
        ? 'Asia/Kolkata'
        : timezone;
    } catch {
      return 'Asia/Kolkata';
    }
  }

  private normalizeName(value: string): string {
    return value
      .trim()
      .replace(/\s+/g, ' ');
  }

  private nameError(
    control: AbstractControl,
    label: string,
  ): string {
    if (!this.shouldShowError(control)) {
      return '';
    }

    if (control.hasError('required')) {
      return `${label} is required.`;
    }

    if (control.hasError('minlength')) {
      return `${label} must contain at least 2 characters.`;
    }

    if (control.hasError('maxlength')) {
      return `${label} cannot exceed 50 characters.`;
    }

    return '';
  }

  private handleSuccess(
    response: RegisterResponse,
  ): void {
    if (!response?.success) {
      this.toastService.error(
        response?.message ||
        AUTH_MESSAGES.ERROR.SIGN_UP_FAILED,
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
      AUTH_MESSAGES.SUCCESS.ACCOUNT_CREATED,
      {
        title: 'Welcome to Sticky Ji!',
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
    const message = extractErrorMessage(error, '');

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
      AUTH_MESSAGES.ERROR.SIGN_UP_FAILED
    );
  }

  private firstInvalidControl(): SignUpControl {
    if (this.firstNameControl.invalid) {
      return 'firstName';
    }

    if (this.lastNameControl.invalid) {
      return 'lastName';
    }

    if (this.emailControl.invalid) {
      return 'email';
    }

    if (this.passwordControl.invalid) {
      return 'password';
    }

    return 'acceptTerms';
  }

  private focusControl(
    control: SignUpControl,
  ): void {
    const ids: Record<SignUpControl, string> = {
      firstName: 'sign-up-first-name',
      lastName: 'sign-up-last-name',
      email: 'sign-up-email',
      password: 'sign-up-password',
      acceptTerms: 'signup-terms',
    };

    const tryFocus = () => {
      const el = document.getElementById(ids[control]) as HTMLInputElement | null;
      if (el) {
        el.focus();
        return true;
      }
      return false;
    };

    if (!tryFocus()) {
      requestAnimationFrame(() => {
        if (!tryFocus()) {
          setTimeout(tryFocus, 60);
        }
      });
    }
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
      control.invalid && this.submitted(),
    );
  }

  private initSeo(): void {
    const registerSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      '@id': 'https://stickyji.app/#webapplication',
      name: 'Sticky Ji',
      url: 'https://stickyji.app/auth/signup',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'All modern web browsers, Windows, macOS, iOS, Android',
      description:
        'Create your free Sticky Ji account. Organize notes, tasks, and creative projects on a calm, visual digital sticky notes canvas.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Unlimited digital sticky notes with custom colors & markdown',
        'Smart folders & project workspaces',
        'Mindful Today daily focus dashboard',
        'Team collaboration & live board sharing',
        'Encrypted cloud auto-save & sync',
      ],
    };

    this.seoService.update({
      title: 'Sign Up Free | Sticky Ji — Digital Sticky Notes & Visual Productivity Workspace',
      description:
        'Create your free Sticky Ji account today. Organize ideas with colorful digital sticky notes, smart folders, visual kanban boards, and team collaboration.',
      keywords: [
        'sticky ji sign up',
        'create sticky ji account',
        'free digital sticky notes',
        'visual productivity board',
        'online note taking register',
        'kanban task manager sign up',
        'visual workspace register',
      ],
      canonicalUrl: '/auth/signup',
      ogTitle: 'Sign Up Free | Sticky Ji — Digital Sticky Notes & Visual Productivity Workspace',
      ogDescription:
        'Start for free on Sticky Ji. Capture raw thoughts, plan daily goals, and organize your ideas visually.',
      ogType: 'website',
      jsonLd: registerSchema,
    });
  }
}
