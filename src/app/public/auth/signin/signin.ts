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
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheckCircle2,
  LucideHeart,
  LucideLightbulb,
  LucideLock,
  LucideMail,
  LucidePencil,
  LucideShieldCheck,
  LucideSparkles,
  LucideZap,
} from '@lucide/angular';

import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { Button } from '../../../shared/components/button/button';
import { Divider } from '../../../shared/components/divider/divider';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput } from '../../../shared/components/input/input';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { extractErrorMessage } from '../../../shared/functions/api.functions';
import { SeoService } from '../../../shared/services/seo.service';
import { AUTH_MESSAGES } from '../messages/auth.messages';

import type { LoginCredentials, LoginResponse } from '../interfaces/auth.interface';
import { AuthService } from '../services/auth-service';

type LoginControl = 'email' | 'password';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppIcon, Checkbox, AppInput, Button, Divider],
  templateUrl: './signin.html',
  styleUrl: './signin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signin implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seoService = inject(SeoService);

  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideHeart = LucideHeart;
  readonly LucideLightbulb = LucideLightbulb;
  readonly LucideLock = LucideLock;
  readonly LucideMail = LucideMail;
  readonly LucidePencil = LucidePencil;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideZap = LucideZap;

  @Input() brandName = 'Sticky Ji';
  @Input() brandHref = '/';
  @Input() logoSrc?: string | null = 'StickyJiHorizontalLogo.png';
  @Input() logoAlt = 'Sticky Ji';
  @Input() initialEmail = '';
  @Input() redirectUrl = '/app';
  @Input() showGoogleSignIn = true;

  @Output()
  readonly googleSignIn = new EventEmitter<void>();

  readonly loading = signal(false);
  readonly submitted = signal(false);

  private routeRedirectUrl = '';

  readonly signInForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(200)]],
    rememberMe: [true],
  });

  constructor() {
    afterNextRender(() => {
      this.focusControl('email');
    });
  }

  ngOnInit(): void {
    this.initSeo();

    const inputEmail = this.initialEmail.trim().toLowerCase();

    const queryEmail = (this.route.snapshot.queryParamMap.get('email') ?? '').trim().toLowerCase();

    this.routeRedirectUrl = (this.route.snapshot.queryParamMap.get('redirectUrl') ?? '').trim();

    const email = inputEmail || queryEmail;

    if (email) {
      this.emailControl.setValue(email);
    }
  }

  get emailControl() {
    return this.signInForm.controls.email;
  }

  get passwordControl() {
    return this.signInForm.controls.password;
  }

  get emailError(): string {
    if (!this.shouldShowError(this.emailControl)) {
      return '';
    }

    if (this.emailControl.hasError('required')) {
      return 'Enter the email connected to your workspace.';
    }

    if (this.emailControl.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (this.emailControl.hasError('maxlength')) {
      return 'Email address is too long.';
    }

    return 'Please check your email address.';
  }

  get passwordError(): string {
    if (!this.shouldShowError(this.passwordControl)) {
      return '';
    }

    if (this.passwordControl.hasError('required')) {
      return 'Enter your password.';
    }

    if (this.passwordControl.hasError('minlength')) {
      return 'Password must contain at least 8 characters.';
    }

    if (this.passwordControl.hasError('maxlength')) {
      return 'Password cannot exceed 200 characters.';
    }

    return 'Please check your password.';
  }

  submit(): void {
    if (this.loading()) {
      return;
    }

    this.submitted.set(true);

    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();

      this.focusControl(this.emailControl.invalid ? 'email' : 'password');

      return;
    }

    const credentials: LoginCredentials = this.signInForm.getRawValue();

    this.loading.set(true);

    this.signInForm.disable({
      emitEvent: false,
    });

    this.authService
      .login(credentials)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);

          this.signInForm.enable({
            emitEvent: false,
          });
        }),
      )
      .subscribe({
        next: (response) => {
          this.handleLoginSuccess(response);
        },
        error: (error: HttpErrorResponse) => {
          this.handleLoginFailure(error);
        },
      });
  }

  onSignup(): void {
    if (this.loading()) {
      return;
    }

    const email = this.emailControl.value.trim().toLowerCase();

    void this.router.navigate(['/auth/signup'], {
      queryParams: email ? { email } : undefined,
    });
  }

  onForgotPassword(): void {
    if (this.loading()) {
      return;
    }

    const email = this.emailControl.value.trim().toLowerCase();

    void this.router.navigate(['/auth/forgot-password'], {
      queryParams: email ? { email } : undefined,
    });
  }

  onGoogleSignIn(): void {
    if (this.loading()) {
      return;
    }

    this.googleSignIn.emit();
  }

  private handleLoginSuccess(response: LoginResponse): void {
    if (!response?.success) {
      this.toastService.error(response?.message || AUTH_MESSAGES.ERROR.SIGN_IN_FAILED, {
        title: 'Sign-in failed',
      });

      return;
    }

    this.toastService.success(response.message || AUTH_MESSAGES.SUCCESS.SIGNED_IN, {
      title: 'Welcome back!',
    });

    void this.router.navigateByUrl(this.safeRedirectUrl());
  }

  private handleLoginFailure(error: HttpErrorResponse): void {
    this.toastService.error(this.resolveErrorMessage(error), {
      title: this.resolveErrorTitle(error),
      duration: error.status === 423 || error.status === 429 ? 8_000 : 6_000,
      dedupeKey: 'signin-error',
    });

    if (error.status === 401) {
      this.passwordControl.markAsTouched();
      this.focusControl('password');
    }
  }

  private resolveErrorTitle(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Connection unavailable';
    }

    if (error.status === 401) {
      return 'Incorrect credentials';
    }

    if (error.status === 403) {
      return 'Access unavailable';
    }

    if (error.status === 423) {
      return 'Account temporarily locked';
    }

    if (error.status === 429) {
      return 'Too many attempts';
    }

    return 'Sign-in failed';
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const message = extractErrorMessage(error, '');

    if (error.status === 0) {
      return 'Unable to reach the server. ' + 'Check your connection and try again.';
    }

    if (error.status === 400) {
      return message || 'Please check your sign-in details.';
    }

    if (error.status === 401) {
      return message || 'Email or password is incorrect.';
    }

    if (error.status === 403) {
      return message || 'Your account does not currently have access.';
    }

    if (error.status === 423) {
      return message || 'Your account is temporarily locked. Please try again later.';
    }

    if (error.status === 429) {
      return message || 'Too many sign-in attempts. Please wait and try again.';
    }

    if (error.status >= 500) {
      return 'The sign-in service is temporarily unavailable. ' + 'Please try again shortly.';
    }

    return message || AUTH_MESSAGES.ERROR.SIGN_IN_FAILED;
  }

  private safeRedirectUrl(): string {
    const requestedUrl = this.routeRedirectUrl || this.redirectUrl;

    if (!requestedUrl.startsWith('/') || requestedUrl.startsWith('//')) {
      return '/app';
    }

    if (
      requestedUrl.startsWith('/auth/login') ||
      requestedUrl.startsWith('/auth/signup') ||
      requestedUrl.startsWith('/auth/forgot-password') ||
      requestedUrl.startsWith('/auth/reset-password')
    ) {
      return '/app';
    }

    return requestedUrl;
  }

  private focusControl(control: LoginControl): void {
    const id = control === 'email' ? 'sign-in-email' : 'sign-in-password';

    const tryFocus = () => {
      const el = document.getElementById(id) as HTMLInputElement | null;
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

  private shouldShowError(control: AbstractControl): boolean {
    return Boolean(control.invalid && this.submitted());
  }

  private initSeo(): void {
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      '@id': 'https://stickyji.app/#webapplication',
      name: 'Sticky Ji',
      url: 'https://stickyji.app/auth/login',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'All modern web browsers, Windows, macOS, iOS, Android',
      description:
        'Sign in to Sticky Ji to manage your digital sticky notes, visual boards, smart folders, and daily tasks.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Digital Sticky Notes with custom colors & markdown',
        'Smart Folders and Workspace organization',
        'Today Daily Focus board',
        'Team Collaboration with role-based permissions',
        'Encrypted cloud auto-save and sync',
      ],
    };

    this.seoService.update({
      title: 'Sign In to Sticky Ji | Digital Sticky Notes & Visual Workspace',
      description:
        'Sign in to your Sticky Ji workspace. Access your digital sticky notes, visual boards, daily focus tasks, and collaborative workspaces. Safe, encrypted, and distraction-free.',
      keywords: [
        'sticky ji login',
        'sign in sticky ji',
        'digital sticky notes',
        'visual workspace',
        'online sticky notes login',
        'kanban board login',
        'task planner',
        'calm productivity',
      ],
      canonicalUrl: '/auth/login',
      ogTitle: 'Sign In to Sticky Ji | Digital Sticky Notes & Visual Workspace',
      ogDescription:
        'Access your digital sticky notes, visual boards, daily focus tasks, and collaborative workspaces on Sticky Ji.',
      ogType: 'website',
      jsonLd: webAppSchema,
    });
  }
}
