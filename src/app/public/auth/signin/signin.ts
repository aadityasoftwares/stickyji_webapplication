import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCalendarDays,
  LucideCheckCircle2,
  LucideCircle,
  LucideClock3,
  LucideLightbulb,
  LucideLockKeyhole,
  LucideMail,
  LucideShieldCheck,
  LucideSparkles,
  LucideUsersRound,
} from '@lucide/angular';

import { AppIcon } from '../../../shared/components/icon/icon';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { Divider } from '../../../shared/components/divider/divider';
import { Input as AppInput } from '../../../shared/components/input/input';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';

export interface SignInCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AppIcon,
    Badge,
    Button,
    Checkbox,
    Divider,
    AppInput,
    StickyCard,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-signin',
  styleUrl: './signin.scss',
  templateUrl: './signin.html',
})
export class Signin {

  private readonly formBuilder = inject(FormBuilder);

  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideCircle = LucideCircle;
  readonly LucideClock3 = LucideClock3;
  readonly LucideLightbulb = LucideLightbulb;
  readonly LucideLockKeyhole = LucideLockKeyhole;
  readonly LucideMail = LucideMail;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideUsersRound = LucideUsersRound;

  @Input() brandName = 'MyStickyNotes';
  @Input() brandHref = '/';
  @Input() logoSrc?: string | null;
  @Input() logoAlt = '';
  @Input() loading = false;
  @Input() serverError = '';
  @Input() initialEmail = '';
  @Input() showGoogleSignIn = true;

  @Output() signIn = new EventEmitter<SignInCredentials>();
  @Output() googleSignIn = new EventEmitter<void>();
  @Output() forgotPasswordClick = new EventEmitter<void>();
  @Output() createAccountClick = new EventEmitter<void>();

  readonly signInForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [true],
  });

  submitted = false;

  ngOnInit(): void {
    if (this.initialEmail) {
      this.signInForm.controls.email.setValue(this.initialEmail);
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

    return this.emailControl.hasError('required')
      ? 'Add the email connected to your workspace.'
      : 'That email address does not look quite right.';
  }

  get passwordError(): string {
    if (!this.shouldShowError(this.passwordControl)) {
      return '';
    }

    return this.passwordControl.hasError('required')
      ? 'Your password is still missing.'
      : 'Password must contain at least 8 characters.';
  }

  submit(): void {
    this.submitted = true;

    if (this.loading || this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.signIn.emit(this.signInForm.getRawValue());
  }

  private shouldShowError(control: AbstractControl): boolean {
    return this.submitted && control.invalid;
  }
}