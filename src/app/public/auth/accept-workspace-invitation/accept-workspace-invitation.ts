import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnInit,
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
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import {
  finalize,
  switchMap,
  throwError,
} from 'rxjs';

import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheckCircle2,
  LucideClock3,
  LucideLockKeyhole,
  LucideMail,
  LucideShieldCheck,
  LucideSparkles,
  LucideUserRound,
  LucideUsers,
} from '@lucide/angular';

import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput } from '../../../shared/components/input/input';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { ToastService } from '../../../shared/components/toast/services/toast.service';

import { AuthService } from '../services/auth-service';
import {
  LoginCredentials,
  RegisterCredentials,
} from '../models/auth.models';
import {
  WorkspaceInvitationAcceptResult,
  WorkspaceInvitationApiResponse,
  WorkspaceInvitationPreview,
  WorkspaceInvitationPublicService,
} from '../services/workspace-invitation-public.service';

type InvitationPageState =
  | 'loading'
  | 'ready'
  | 'invalid'
  | 'accepted';

type InvitationFormControl =
  | 'firstName'
  | 'lastName'
  | 'password'
  | 'acceptTerms';

interface BrowserRegistrationContext {
  timezoneCode: string;
  locale: string;
  countryCodeHint?: string;
}

@Component({
  selector: 'app-accept-workspace-invitation',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AppIcon,
    Badge,
    Button,
    Checkbox,
    AppInput,
    StickyCard,
  ],
  templateUrl: './accept-workspace-invitation.html',
  styleUrl: './accept-workspace-invitation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptWorkspaceInvitation implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly invitationService =
    inject(WorkspaceInvitationPublicService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideClock3 = LucideClock3;
  readonly LucideLockKeyhole = LucideLockKeyhole;
  readonly LucideMail = LucideMail;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideUserRound = LucideUserRound;
  readonly LucideUsers = LucideUsers;

  @Input() brandName = 'MyStickyNotes';
  @Input() brandHref = '/';
  @Input() logoSrc?: string | null;
  @Input() logoAlt = '';
  @Input() redirectUrl = '/app';

  readonly pageState =
    signal<InvitationPageState>('loading');

  readonly invitation =
    signal<WorkspaceInvitationPreview | null>(null);

  readonly accepted =
    signal<WorkspaceInvitationAcceptResult | null>(null);

  readonly loading =
    signal(false);

  readonly submitted =
    signal(false);

  readonly pageError =
    signal<string | null>(null);

  /**
   * Becomes true after login/register succeeds and before /accept finishes.
   * Keeping this state prevents a newly-created user from accidentally being
   * submitted through registration a second time if accepting the invitation
   * fails because of a temporary network/server error.
   */
  readonly authCompleted =
    signal(false);

  private token = '';
  private authenticatedAccessToken = '';

  readonly invitationForm =
    this.formBuilder.nonNullable.group({
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
        {
          value: '',
          disabled: true,
        },
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
        ],
      ],

      rememberMe: [true],

      acceptTerms: [
        false,
        [Validators.requiredTrue],
      ],
    });

  ngOnInit(): void {
    this.token =
      this.route.snapshot.queryParamMap
        .get('token')
        ?.trim() || '';

    if (!this.token) {
      this.setInvalidInvitation(
        'This invitation link is incomplete. Ask the workspace owner to send a new invitation.',
      );
      return;
    }

    this.loadInvitation();
  }

  get firstNameControl() {
    return this.invitationForm.controls.firstName;
  }

  get lastNameControl() {
    return this.invitationForm.controls.lastName;
  }

  get emailControl() {
    return this.invitationForm.controls.email;
  }

  get passwordControl() {
    return this.invitationForm.controls.password;
  }

  get rememberMeControl() {
    return this.invitationForm.controls.rememberMe;
  }

  get acceptTermsControl() {
    return this.invitationForm.controls.acceptTerms;
  }

  get isExistingUser(): boolean {
    return this.invitation()?.userExists === true;
  }

  get invitationEmail(): string {
    return (
      this.invitation()?.email
        ?.trim()
        .toLowerCase() || ''
    );
  }

  get workspaceName(): string {
    return (
      this.invitation()?.workspace?.name?.trim() ||
      'Shared workspace'
    );
  }

  get roleName(): string {
    const role = this.invitation()?.role;

    return (
      role?.displayName?.trim() ||
      role?.name?.trim() ||
      'Member'
    );
  }

  get inviterName(): string {
    return (
      this.invitation()?.invitedBy?.name?.trim() ||
      'A workspace member'
    );
  }

  get invitationMessage(): string {
    return this.invitation()?.message?.trim() || '';
  }

  get invitationExpiry(): string {
    const value = this.invitation()?.expiresAt;

    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    ).format(date);
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
    if (this.isExistingUser) {
      return '';
    }

    return this.shouldShowError(this.acceptTermsControl)
      ? 'Please accept the Terms of Service and Privacy Policy.'
      : '';
  }

  get primaryActionLabel(): string {
    return this.isExistingUser
      ? 'Sign in & join workspace'
      : 'Create account & join workspace';
  }

  get primaryLoadingLabel(): string {
    return this.isExistingUser
      ? 'Signing in & joining…'
      : 'Creating account & joining…';
  }

  loadInvitation(): void {
    if (!this.token || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.pageError.set(null);
    this.pageState.set('loading');
    this.authCompleted.set(false);
    this.authenticatedAccessToken = '';

    this.invitationService
      .validateToken(this.token)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: response => {
          if (!response?.success || !response?.data) {
            this.setInvalidInvitation(
              response?.message ||
              'This invitation could not be opened.',
            );
            return;
          }

          this.invitation.set(response.data);

          this.emailControl.setValue(
            response.data.email.trim().toLowerCase(),
            {
              emitEvent: false,
            },
          );

          this.configureFormForInvitation(
            response.data.userExists,
          );

          this.pageState.set('ready');
          this.focusInitialField();
        },

        error: (error: HttpErrorResponse) => {
          this.setInvalidInvitation(
            this.resolveInvitationError(error),
          );
        },
      });
  }

  submit(): void {
    if (
      this.loading() ||
      this.pageState() !== 'ready' ||
      this.authCompleted()
    ) {
      return;
    }

    this.submitted.set(true);
    this.pageError.set(null);

    if (this.isExistingUser) {
      this.submitExistingUser();
      return;
    }

    this.submitNewUser();
  }

  retryAccept(): void {
    if (
      this.loading() ||
      this.pageState() !== 'ready' ||
      !this.authCompleted()
    ) {
      return;
    }

    this.pageError.set(null);
    this.loading.set(true);

    this.invitationService
      .accept(
        this.token,
        this.authenticatedAccessToken || undefined,
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: response => {
          this.handleAcceptSuccess(response);
        },
        error: error => {
          this.handleSubmitError(
            error,
            this.isExistingUser,
          );
        },
      });
  }

  onSignIn(): void {
    if (this.loading()) {
      return;
    }

    void this.router.navigate(
      ['/auth/login'],
      {
        queryParams: {
          email:
            this.invitationEmail || undefined,
          returnUrl:
            this.router.url,
        },
      },
    );
  }

  openWorkspace(): void {
    const workspaceId =
      this.accepted()?.workspaceId ||
      this.invitation()?.workspace?.id ||
      '';

    void this.router.navigate(
      [this.safeRedirectUrl()],
      {
        queryParams: workspaceId
          ? { workspaceId }
          : undefined,
      },
    );
  }

  private submitExistingUser(): void {
    this.passwordControl.markAsTouched();

    if (this.passwordControl.invalid) {
      this.focusControl('password');
      return;
    }

    const credentials: LoginCredentials = {
      email: this.invitationEmail,
      password: this.passwordControl.value,
      rememberMe: this.rememberMeControl.value,
    };

    this.loading.set(true);

    this.authService
      .login(credentials)
      .pipe(
        switchMap(response => {
          if (!response?.success) {
            return throwError(
              () =>
                new Error(
                  response?.message ||
                  'Unable to sign in.',
                ),
            );
          }

          const accessToken =
            this.extractAccessToken(response);

          this.markAuthenticationComplete(
            accessToken,
            false,
          );

          return this.invitationService.accept(
            this.token,
            accessToken || undefined,
          );
        }),

        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: response => {
          this.handleAcceptSuccess(response);
        },

        error: error => {
          this.handleSubmitError(error, true);
        },
      });
  }

  private submitNewUser(): void {
    const controls: AbstractControl[] = [
      this.firstNameControl,
      this.lastNameControl,
      this.passwordControl,
      this.acceptTermsControl,
    ];

    controls.forEach(
      control => control.markAsTouched(),
    );

    if (
      controls.some(
        control => control.invalid,
      )
    ) {
      this.focusControl(
        this.firstInvalidControl(),
      );
      return;
    }

    const browserContext =
      this.getBrowserRegistrationContext();

    const credentials: RegisterCredentials = {
      firstName:
        this.normalizeName(
          this.firstNameControl.value,
        ),

      lastName:
        this.normalizeName(
          this.lastNameControl.value,
        ),

      email:
        this.invitationEmail,

      password:
        this.passwordControl.value,

      termsAccepted:
        this.acceptTermsControl.value,

      privacyPolicyAccepted:
        this.acceptTermsControl.value,

      timezoneCode:
        browserContext.timezoneCode,

      locale:
        browserContext.locale,

      ...(browserContext.countryCodeHint
        ? {
          countryCodeHint:
            browserContext.countryCodeHint,
        }
        : {}),
    };

    this.loading.set(true);

    this.authService
      .register(credentials)
      .pipe(
        switchMap(response => {
          if (!response?.success) {
            return throwError(
              () =>
                new Error(
                  response?.message ||
                  'Unable to create your account.',
                ),
            );
          }

          const accessToken =
            this.extractAccessToken(response);

          this.markAuthenticationComplete(
            accessToken,
            true,
          );

          return this.invitationService.accept(
            this.token,
            accessToken || undefined,
          );
        }),

        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: response => {
          this.handleAcceptSuccess(response);
        },

        error: error => {
          this.handleSubmitError(error, false);
        },
      });
  }

  private markAuthenticationComplete(
    accessToken: string,
    accountCreated: boolean,
  ): void {
    this.authenticatedAccessToken =
      accessToken.trim();

    this.authCompleted.set(true);

    if (!accountCreated) {
      return;
    }

    const currentInvitation =
      this.invitation();

    if (!currentInvitation) {
      return;
    }

    /**
     * The account now exists. If /accept fails and the user needs to fall back
     * to normal login, the invitation page must not try registration again.
     */
    this.invitation.set({
      ...currentInvitation,
      userExists: true,
    });
  }

  private configureFormForInvitation(
    userExists: boolean,
  ): void {
    this.submitted.set(false);
    this.authCompleted.set(false);
    this.authenticatedAccessToken = '';

    this.passwordControl.reset(
      '',
      {
        emitEvent: false,
      },
    );

    if (userExists) {
      this.firstNameControl.disable({
        emitEvent: false,
      });

      this.lastNameControl.disable({
        emitEvent: false,
      });

      this.acceptTermsControl.disable({
        emitEvent: false,
      });

      this.rememberMeControl.enable({
        emitEvent: false,
      });

      return;
    }

    this.firstNameControl.enable({
      emitEvent: false,
    });

    this.lastNameControl.enable({
      emitEvent: false,
    });

    this.acceptTermsControl.enable({
      emitEvent: false,
    });

    this.rememberMeControl.disable({
      emitEvent: false,
    });
  }

  private handleAcceptSuccess(
    response:
      WorkspaceInvitationApiResponse<WorkspaceInvitationAcceptResult>,
  ): void {
    if (!response?.success || !response?.data) {
      this.pageError.set(
        response?.message ||
        'The invitation could not be accepted.',
      );
      return;
    }

    this.accepted.set(response.data);
    this.pageState.set('accepted');
    this.pageError.set(null);

    this.toastService.success(
      response.message ||
      `You joined ${this.workspaceName}.`,
      {
        title: 'Invitation accepted',
        dedupeKey:
          'workspace-invitation-accepted',
      },
    );
  }

  private handleSubmitError(
    error: unknown,
    existingUser: boolean,
  ): void {
    const authenticationAlreadyCompleted =
      this.authCompleted();

    const message =
      this.resolveSubmitError(
        error,
        existingUser,
        authenticationAlreadyCompleted,
      );

    this.pageError.set(message);

    this.toastService.error(
      message,
      {
        title: authenticationAlreadyCompleted
          ? 'Could not join workspace'
          : existingUser
            ? 'Could not sign in'
            : 'Could not create account',

        duration: 6_000,

        dedupeKey:
          'workspace-invitation-submit-error',
      },
    );

    if (
      !authenticationAlreadyCompleted &&
      existingUser
    ) {
      this.passwordControl.markAsTouched();
      this.focusControl('password');
    }
  }

  private setInvalidInvitation(
    message: string,
  ): void {
    this.invitation.set(null);
    this.accepted.set(null);
    this.authCompleted.set(false);
    this.authenticatedAccessToken = '';
    this.pageError.set(message);
    this.pageState.set('invalid');
  }

  private getBrowserRegistrationContext():
    BrowserRegistrationContext {
    return {
      locale:
        this.resolveBrowserLocale(),

      timezoneCode:
        this.resolveBrowserTimezone(),

      countryCodeHint:
        'IN',
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

      return timezone === 'Asia/Calcutta'
        ? 'Asia/Kolkata'
        : timezone;
    } catch {
      return 'Asia/Kolkata';
    }
  }

  private normalizeName(
    value: string,
  ): string {
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

  private firstInvalidControl():
    InvitationFormControl {
    if (this.firstNameControl.invalid) {
      return 'firstName';
    }

    if (this.lastNameControl.invalid) {
      return 'lastName';
    }

    if (this.passwordControl.invalid) {
      return 'password';
    }

    return 'acceptTerms';
  }

  private focusInitialField(): void {
    this.runOnNextFrame(() => {
      if (this.isExistingUser) {
        this.focusControl('password');
        return;
      }

      this.focusControl('firstName');
    });
  }

  private focusControl(
    control: InvitationFormControl,
  ): void {
    const ids:
      Record<InvitationFormControl, string> = {
      firstName:
        'invitation-first-name',
      lastName:
        'invitation-last-name',
      password:
        'invitation-password',
      acceptTerms:
        'invitation-terms',
    };

    this.runOnNextFrame(() => {
      if (typeof document === 'undefined') {
        return;
      }

      document
        .getElementById(ids[control])
        ?.focus();
    });
  }

  private runOnNextFrame(
    callback: () => void,
  ): void {
    if (
      typeof requestAnimationFrame ===
      'function'
    ) {
      requestAnimationFrame(callback);
      return;
    }

    setTimeout(callback, 0);
  }

  private shouldShowError(
    control: AbstractControl,
  ): boolean {
    return Boolean(
      control.enabled &&
      control.invalid &&
      (
        this.submitted() ||
        control.touched ||
        control.dirty
      ),
    );
  }

  private resolveInvitationError(
    error: HttpErrorResponse,
  ): string {
    const message =
      this.backendMessage(error);

    if (error.status === 0) {
      return (
        'Unable to reach the server. ' +
        'Check your connection and try again.'
      );
    }

    if (
      error.status === 400 ||
      error.status === 404 ||
      error.status === 409 ||
      error.status === 410
    ) {
      return (
        message ||
        'This invitation is invalid, expired, cancelled, or has already been used.'
      );
    }

    return (
      message ||
      'We could not open this workspace invitation.'
    );
  }

  private resolveSubmitError(
    error: unknown,
    existingUser: boolean,
    authenticationAlreadyCompleted: boolean,
  ): string {
    if (error instanceof HttpErrorResponse) {
      const message =
        this.backendMessage(error);

      if (error.status === 0) {
        return authenticationAlreadyCompleted
          ? 'Your account is ready, but we could not finish joining the workspace. Check your connection and try joining again.'
          : 'Unable to reach the server. Check your connection and try again.';
      }

      if (
        error.status === 401 &&
        !authenticationAlreadyCompleted &&
        existingUser
      ) {
        return (
          message ||
          'The password is incorrect. Please try again.'
        );
      }

      if (authenticationAlreadyCompleted) {
        return (
          message ||
          'Your account is ready, but workspace access could not be completed. Try joining again.'
        );
      }

      if (error.status === 409) {
        return (
          message ||
          'This invitation or account has already been processed.'
        );
      }

      return (
        message ||
        (
          existingUser
            ? 'We could not sign you in and join the workspace.'
            : 'We could not create your account and join the workspace.'
        )
      );
    }

    if (
      error instanceof Error &&
      error.message.trim()
    ) {
      return error.message.trim();
    }

    if (authenticationAlreadyCompleted) {
      return (
        'Your account is ready, but workspace access could not be completed. Try joining again.'
      );
    }

    return existingUser
      ? 'We could not sign you in and join the workspace.'
      : 'We could not create your account and join the workspace.';
  }

  private backendMessage(
    error: HttpErrorResponse,
  ): string {
    if (
      typeof error.error?.message ===
      'string'
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

  private extractAccessToken(
    response: unknown,
  ): string {
    if (
      !response ||
      typeof response !== 'object'
    ) {
      return '';
    }

    const root =
      response as Record<string, unknown>;

    const data = root['data'];

    if (
      !data ||
      typeof data !== 'object'
    ) {
      return '';
    }

    const dataRecord =
      data as Record<string, unknown>;

    const directAccessToken =
      dataRecord['accessToken'];

    if (
      typeof directAccessToken === 'string' &&
      directAccessToken.trim()
    ) {
      return directAccessToken.trim();
    }

    const tokens = dataRecord['tokens'];

    if (
      !tokens ||
      typeof tokens !== 'object'
    ) {
      return '';
    }

    const nestedAccessToken =
      (tokens as Record<string, unknown>)[
      'accessToken'
      ];

    return typeof nestedAccessToken === 'string'
      ? nestedAccessToken.trim()
      : '';
  }

  private safeRedirectUrl(): string {
    return (
      this.redirectUrl.startsWith('/') &&
      !this.redirectUrl.startsWith('//')
    )
      ? this.redirectUrl
      : '/app';
  }
}
