import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, } from '@angular/core';
import { takeUntilDestroyed, } from '@angular/core/rxjs-interop';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  finalize,
  forkJoin,
} from 'rxjs';

import {
  LucideBookOpen,
  LucideBriefcaseBusiness,
  LucideCalendarDays,
  LucideCheck,
  LucideCircleUserRound,
  LucideClock3,
  LucideCoins,
  LucideGlobe2,
  LucideLanguages,
  LucideMapPin,
  LucideRotateCcw,
  LucideSave,
  LucideSparkles,
  LucideUserRound,
} from '@lucide/angular';

import {
  Avatar,
} from '../../../shared/components/avatar/avatar';

import {
  Badge,
} from '../../../shared/components/badge/badge';

import {
  Button,
} from '../../../shared/components/button/button';

import {
  StickyCard,
} from '../../../shared/components/sticky-card/sticky-card';

import {
  Divider,
} from '../../../shared/components/divider/divider';

import {
  AppIcon,
} from '../../../shared/components/icon/icon';

import {
  Input as AppInput,
} from '../../../shared/components/input/input';

import {
  Select,
  type SelectOption,
} from '../../../shared/components/select/select';

import {
  ProfileReferenceData,
  UpdateUserProfilePayload,
  UserProfile,
  UserProfileType,
} from '../models/user-profile.models';

import {
  UserProfileService,
} from '../services/user-profile.service';
import { DatepickerInput } from '../../../shared/components/datepicker-input/datepicker-input';
import { AuthStore } from '../../../public/auth/state/auth.store';
import { extractErrorMessage } from '../../../shared/functions/api.functions';

type ProfileControlName =
  | 'firstName'
  | 'lastName'
  | 'displayName'
  | 'bio'
  | 'dateOfBirth'
  | 'profileType'
  | 'occupation'
  | 'education'
  | 'countryId'
  | 'timezoneId'
  | 'languageId';
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppIcon,
    Avatar,
    Badge,
    Button,
    StickyCard,
    Divider,
    AppInput,
    DatepickerInput,
    Select,
  ],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly profileService = inject(UserProfileService);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly LucideBookOpen = LucideBookOpen;
  readonly LucideBriefcaseBusiness = LucideBriefcaseBusiness;
  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideCheck = LucideCheck;
  readonly LucideCircleUserRound = LucideCircleUserRound;
  readonly LucideClock3 = LucideClock3;
  readonly LucideCoins = LucideCoins;
  readonly LucideGlobe2 = LucideGlobe2;
  readonly LucideLanguages = LucideLanguages;
  readonly LucideMapPin = LucideMapPin;
  readonly LucideRotateCcw = LucideRotateCcw;
  readonly LucideSave = LucideSave;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideUserRound = LucideUserRound;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saved = signal(false);

  readonly profile = signal<UserProfile | null>(null);
  readonly profileExists = signal(false);

  readonly interests = signal<string[]>([]);
  readonly completionPercent = signal(0);

  readonly previewName = signal('Your profile');
  readonly previewOccupation = signal('Sticky Ji member');

  readonly countryOptions = signal<SelectOption[]>([]);
  readonly timezoneOptions = signal<SelectOption[]>([]);
  readonly languageOptions = signal<SelectOption[]>([]);
  readonly currencyOptions = signal<SelectOption[]>([]);

  readonly profileTypeOptions: readonly SelectOption[] = [
    {
      label: 'Personal',
      value: 'PERSONAL',
    },
    {
      label: 'Student',
      value: 'STUDENT',
    },
    {
      label: 'Professional',
      value: 'PROFESSIONAL',
    },
    {
      label: 'Business',
      value: 'BUSINESS',
    },
  ];

  readonly profileForm = this.formBuilder.group({
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

    displayName: [
      '',
      [
        Validators.minLength(2),
        Validators.maxLength(80),
      ],
    ],

    bio: [
      '',
      [
        Validators.maxLength(280),
      ],
    ],

    // UTC ISO string or null
    dateOfBirth: [
      null as string | null,
    ],

    profileType: [
      'PERSONAL' as UserProfileType,
      [
        Validators.required,
      ],
    ],

    occupation: [
      '',
      [
        Validators.maxLength(100),
      ],
    ],

    education: [
      '',
      [
        Validators.maxLength(150),
      ],
    ],

    countryId: [''],
    timezoneId: [''],
    languageId: [''],
  });

  readonly minimumDateOfBirth =
    new Date(1900, 0, 1);

  readonly maximumDateOfBirth =
    new Date();

  ngOnInit(): void {
    this.watchFormChanges();
    this.loadScreen();
  }

  saveProfile(): void {
    this.saved.set(false);
    this.saveError.set(null);

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const payload = this.buildPayload();

    const request = this.profileExists()
      ? this.profileService.updateMyProfile(payload)
      : this.profileService.createMyProfile(payload);

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: profile => {
          this.profile.set(profile);
          this.profileExists.set(true);
          this.interests.set(profile.interests ?? []);

          this.patchProfile(profile);
          this.syncAuthenticatedUser(profile);

          this.profileForm.markAsPristine();
          this.saved.set(true);
          this.updateCompletion();
        },

        error: error => {
          this.saveError.set(
            extractErrorMessage(error, 'We could not save your profile. Please try again.'),
          );
        },
      });
  }

  resetForm(): void {
    const profile = this.profile();

    if (profile) {
      this.patchProfile(profile);
    } else {
      this.resetEmptyForm();
    }

    this.saved.set(false);
    this.saveError.set(null);
  }

  reload(): void {
    this.loadScreen();
  }

  addInterest(input: HTMLInputElement): void {
    const interest = input.value.trim();
    const currentInterests = this.interests();

    const alreadyExists = currentInterests.some(
      item => item.toLowerCase() === interest.toLowerCase(),
    );

    if (
      !interest ||
      interest.length > 40 ||
      currentInterests.length >= 10 ||
      alreadyExists
    ) {
      return;
    }

    this.interests.set([
      ...currentInterests,
      interest,
    ]);

    this.profileForm.markAsDirty();
    input.value = '';

    this.saved.set(false);
    this.updateCompletion();
  }

  handleInterestKeydown(
    event: KeyboardEvent,
    input: HTMLInputElement,
  ): void {
    if (
      event.key !== 'Enter' &&
      event.key !== ','
    ) {
      return;
    }

    event.preventDefault();
    this.addInterest(input);
  }

  removeInterest(interest: string): void {
    this.interests.update(items =>
      items.filter(item => item !== interest),
    );

    this.profileForm.markAsDirty();
    this.saved.set(false);
    this.updateCompletion();
  }

  fieldMessage(
    controlName: ProfileControlName,
  ): string {
    const control =
      this.profileForm.controls[controlName];

    if (
      !control.touched ||
      !control.errors
    ) {
      return '';
    }

    if (control.hasError('required')) {
      return 'This field is required.';
    }

    if (control.hasError('minlength')) {
      return 'Please enter at least 2 characters.';
    }

    if (control.hasError('maxlength')) {
      return 'This value is too long.';
    }

    return 'Please enter a valid value.';
  }

  isInvalid(
    controlName: ProfileControlName,
  ): boolean {
    const control: AbstractControl =
      this.profileForm.controls[controlName];

    return control.invalid && control.touched;
  }

  private loadScreen(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.saveError.set(null);
    this.saved.set(false);

    forkJoin({
      profile: this.profileService.getMyProfile(),
      references:
        this.profileService.getReferenceData(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({
          profile,
          references,
        }) => {
          this.setReferenceOptions(references);

          if (profile) {
            this.profile.set(profile);
            this.profileExists.set(true);
            this.patchProfile(profile);
            this.syncAuthenticatedUser(profile);
            return;
          }

          this.profile.set(null);
          this.profileExists.set(false);
          this.resetEmptyForm();
        },

        error: error => {
          this.loadError.set(
            extractErrorMessage(error, 'We could not load your profile right now.'),
          );
        },
      });
  }

  private patchProfile(
    profile: UserProfile,
  ): void {
    this.profileForm.reset(
      {
        firstName:
          profile.firstName ?? '',

        lastName:
          profile.lastName ?? '',

        displayName:
          profile.displayName ?? '',

        bio:
          profile.bio ?? '',

        // Datepicker accepts the backend ISO value directly
        dateOfBirth:
          profile.dateOfBirth ?? null,

        profileType:
          profile.profileType ??
          'PERSONAL',

        occupation:
          profile.occupation ?? '',

        education:
          profile.education ?? '',

        countryId:
          profile.countryId ?? '',

        timezoneId:
          profile.timezoneId ?? '',

        languageId:
          profile.languageId ?? '',

      },
      {
        emitEvent: false,
      },
    );

    this.interests.set(
      profile.interests ?? [],
    );

    this.profileForm.markAsPristine();

    this.updatePreview();
    this.updateCompletion();
  }

  private resetEmptyForm(): void {
    this.profileForm.reset(
      {
        firstName: '',
        lastName: '',
        displayName: '',
        bio: '',
        dateOfBirth: null,
        profileType: 'PERSONAL',
        occupation: '',
        education: '',
        countryId: '',
        timezoneId: '',
        languageId: '',
      },
      {
        emitEvent: false,
      },
    );

    this.interests.set([]);
    this.profileForm.markAsPristine();

    this.updatePreview();
    this.updateCompletion();
  }

  private buildPayload():
    UpdateUserProfilePayload {
    const value =
      this.profileForm.getRawValue();

    return {
      firstName:
        value.firstName?.trim() ?? '',

      lastName:
        value.lastName?.trim() ?? '',

      displayName:
        this.nullIfEmpty(
          value.displayName,
        ),

      bio:
        this.nullIfEmpty(value.bio),

      // Already UTC ISO:
      // 2026-08-31T00:00:00.000Z
      dateOfBirth:
        value.dateOfBirth ?? null,

      profileType:
        value.profileType as UserProfileType,

      occupation:
        this.nullIfEmpty(
          value.occupation,
        ),

      education:
        this.nullIfEmpty(
          value.education,
        ),

      interests: this.interests(),

      countryId:
        this.nullIfEmpty(
          value.countryId,
        ),

      timezoneId:
        this.nullIfEmpty(
          value.timezoneId,
        ),

      languageId:
        this.nullIfEmpty(
          value.languageId,
        ),
    };
  }

  private setReferenceOptions(
    references: ProfileReferenceData,
  ): void {
    this.countryOptions.set(
      references.countries.map(country => ({
        value: country._id,
        label:
          `${country.flag
            ? `${country.flag} `
            : ''
          }${country.name}`,
      })),
    );

    this.timezoneOptions.set(
      references.timezones.map(timezone => ({
        value: timezone._id,
        label:
          `${timezone.offset
            ? `(${timezone.offset}) `
            : ''
          }${timezone.name}`,
      })),
    );

    this.languageOptions.set(
      references.languages.map(language => ({
        value: language._id,
        label:
          `${language.name}${language.code
            ? ` · ${language.code.toUpperCase()}`
            : ''
          }`,
      })),
    );

  }

  private watchFormChanges(): void {
    this.profileForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.saved.set(false);
        this.updatePreview();
        this.updateCompletion();
      });
  }

  private updatePreview(): void {
    const value =
      this.profileForm.getRawValue();

    const fullName =
      `${value.firstName ?? ''} ${value.lastName ?? ''
        }`.trim();

    const name =
      value.displayName?.trim() ||
      fullName ||
      'Your profile';

    this.previewName.set(name);

    this.previewOccupation.set(
      value.occupation?.trim() ||
      'Sticky Ji member',
    );
  }

  private updateCompletion(): void {
    const value =
      this.profileForm.getRawValue();

    const fields = [
      value.firstName,
      value.lastName,
      value.displayName,
      value.bio,
      value.dateOfBirth,
      value.profileType,
      value.occupation,
      value.education,
      value.countryId,
      value.timezoneId,
      value.languageId,
      this.interests().length
        ? 'has-interests'
        : '',
    ];

    const completed =
      fields.filter(field => Boolean(field)).length;

    this.completionPercent.set(
      Math.round(
        (completed / fields.length) * 100,
      ),
    );
  }

  private syncAuthenticatedUser(
    profile: UserProfile,
  ): void {
    const currentUser = this.authStore.user();

    if (!currentUser) {
      return;
    }

    // Keeping `id` in the patch makes this compatible even when the
    // profile fields are optional additions on AuthenticatedUser.
    const userPatch = {
      id: currentUser.id,
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      displayName: profile.displayName ?? '',
    };

    this.authStore.patchUser(userPatch);
  }

  private nullIfEmpty(
    value: string | null | undefined,
  ): string | null {
    const normalized = value?.trim();

    return normalized
      ? normalized
      : null;
  }

  private toDateInputValue(
    value: string | null,
  ): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? ''
      : date.toISOString().slice(0, 10);
  }
}
