import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
import { finalize, forkJoin } from 'rxjs';
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

import { Avatar } from '../../../shared/components/avatar/avatar';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { Divider } from '../../../shared/components/divider/divider';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput } from '../../../shared/components/input/input';
import {
  Select,
  type SelectOption,
} from '../../../shared/components/select/select';
import { UserProfile, UserProfileType, UpdateUserProfilePayload, ProfileReferenceData } from '../models/user-profile.models';
import { UserProfileService } from '../services/user-profile.service';


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
  | 'languageId'
  | 'currencyId';

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
    Select,
  ],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class UserProfileComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly profileService = inject(UserProfileService);
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
  readonly previewOccupation = signal('MyStickyNotes member');

  readonly countryOptions = signal<SelectOption[]>([]);
  readonly timezoneOptions = signal<SelectOption[]>([]);
  readonly languageOptions = signal<SelectOption[]>([]);
  readonly currencyOptions = signal<SelectOption[]>([]);

  readonly profileTypeOptions: SelectOption[] = [
    { label: 'Personal', value: 'PERSONAL' },
    { label: 'Student', value: 'STUDENT' },
    { label: 'Professional', value: 'PROFESSIONAL' },
    { label: 'Business', value: 'BUSINESS' },
  ];

  readonly profileForm = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    displayName: ['', [Validators.minLength(2), Validators.maxLength(80)]],
    bio: ['', [Validators.maxLength(280)]],
    dateOfBirth: [''],
    profileType: ['PERSONAL' as UserProfileType, [Validators.required]],
    occupation: ['', [Validators.maxLength(100)]],
    education: ['', [Validators.maxLength(150)]],
    countryId: [''],
    timezoneId: [''],
    languageId: [''],
    currencyId: [''],
  });

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

    const request = this.profileExists()
      ? this.profileService.updateMyProfile(this.buildPayload())
      : this.profileService.createMyProfile(this.buildPayload());

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: profile => {
          this.profile.set(profile);
          this.profileExists.set(true);
          this.interests.set(profile.interests ?? []);
          this.profileForm.markAsPristine();
          this.saved.set(true);
          this.updateCompletion();
        },
        error: error => {
          this.saveError.set(
            error?.error?.message ??
            'We could not save your profile. Please try again.'
          );
        },
      });
  }

  resetForm(): void {
    const profile = this.profile();

    if (!profile) {
      return;
    }

    this.patchProfile(profile);
    this.saved.set(false);
    this.saveError.set(null);
  }

  reload(): void {
    this.loadScreen();
  }

  addInterest(input: HTMLInputElement): void {
    const interest = input.value.trim();
    const current = this.interests();

    if (
      !interest ||
      interest.length > 40 ||
      current.length >= 10 ||
      current.some(item => item.toLowerCase() === interest.toLowerCase())
    ) {
      return;
    }

    this.interests.set([...current, interest]);
    this.profileForm.markAsDirty();
    input.value = '';
    this.updateCompletion();
  }

  handleInterestKeydown(
    event: KeyboardEvent,
    input: HTMLInputElement
  ): void {
    if (event.key !== 'Enter' && event.key !== ',') {
      return;
    }

    event.preventDefault();
    this.addInterest(input);
  }

  removeInterest(interest: string): void {
    this.interests.update(items =>
      items.filter(item => item !== interest)
    );
    this.profileForm.markAsDirty();
    this.updateCompletion();
  }

  fieldMessage(controlName: ProfileControlName): string {
    const control = this.profileForm.controls[controlName];

    if (!control.touched || !control.errors) {
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

  isInvalid(controlName: ProfileControlName): boolean {
    const control: AbstractControl = this.profileForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private loadScreen(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      profile: this.profileService.getMyProfile(),
      references: this.profileService.getReferenceData(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: ({ profile, references }) => {
          this.setReferenceOptions(references);

          if (profile) {
            this.profile.set(profile);
            this.profileExists.set(true);
            this.interests.set(profile.interests ?? []);
            this.patchProfile(profile);
          } else {
            this.profile.set(null);
            this.profileExists.set(false);
            this.profileForm.reset(
              {
                firstName: '',
                lastName: '',
                displayName: '',
                bio: '',
                dateOfBirth: '',
                profileType: 'PERSONAL',
                occupation: '',
                education: '',
                countryId: '',
                timezoneId: '',
                languageId: '',
                currencyId: '',
              },
              { emitEvent: false }
            );
            this.interests.set([]);
            this.updatePreview();
            this.updateCompletion();
          }
        },
        error: error => {
          this.loadError.set(
            error?.error?.message ??
            'We could not load your profile right now.'
          );
        },
      });
  }

  private patchProfile(profile: UserProfile): void {
    this.profileForm.reset(
      {
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        displayName: profile.displayName ?? '',
        bio: profile.bio ?? '',
        dateOfBirth: this.toDateInputValue(profile.dateOfBirth),
        profileType: profile.profileType ?? 'PERSONAL',
        occupation: profile.occupation ?? '',
        education: profile.education ?? '',
        countryId: profile.countryId ?? '',
        timezoneId: profile.timezoneId ?? '',
        languageId: profile.languageId ?? '',
        currencyId: profile.currencyId ?? '',
      },
      { emitEvent: false }
    );

    this.interests.set(profile.interests ?? []);
    this.profileForm.markAsPristine();
    this.updatePreview();
    this.updateCompletion();
  }

  private buildPayload(): UpdateUserProfilePayload {
    const value = this.profileForm.getRawValue();

    return {
      firstName: value.firstName!.trim(),
      lastName: value.lastName!.trim(),
      displayName: this.nullIfEmpty(value.displayName),
      bio: this.nullIfEmpty(value.bio),
      dateOfBirth: this.nullIfEmpty(value.dateOfBirth),
      profileType: value.profileType as UserProfileType,
      occupation: this.nullIfEmpty(value.occupation),
      education: this.nullIfEmpty(value.education),
      interests: this.interests(),
      countryId: this.nullIfEmpty(value.countryId),
      timezoneId: this.nullIfEmpty(value.timezoneId),
      languageId: this.nullIfEmpty(value.languageId),
      currencyId: this.nullIfEmpty(value.currencyId),
    };
  }

  private setReferenceOptions(references: ProfileReferenceData): void {
    this.countryOptions.set(
      references.countries.map(country => ({
        value: country._id,
        label: `${country.flag ? `${country.flag} ` : ''}${country.name}`,
      }))
    );

    this.timezoneOptions.set(
      references.timezones.map(timezone => ({
        value: timezone._id,
        label: `${timezone.offset ? `(${timezone.offset}) ` : ''}${timezone.name}`,
      }))
    );

    this.languageOptions.set(
      references.languages.map(language => ({
        value: language._id,
        label: `${language.name}${language.code ? ` · ${language.code.toUpperCase()}` : ''}`,
      }))
    );

    this.currencyOptions.set(
      references.currencies.map(currency => ({
        value: currency._id,
        label: `${currency.code ?? currency.name}${currency.symbol ? ` · ${currency.symbol}` : ''}`,
      }))
    );
  }

  private watchFormChanges(): void {
    this.profileForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.saved.set(false);
        this.updatePreview();
        this.updateCompletion();
      });
  }

  private updatePreview(): void {
    const value = this.profileForm.getRawValue();
    const name =
      value.displayName?.trim() ||
      `${value.firstName ?? ''} ${value.lastName ?? ''}`.trim();

    this.previewName.set(name || 'Your profile');
    this.previewOccupation.set(
      value.occupation?.trim() || 'MyStickyNotes member'
    );
  }

  private updateCompletion(): void {
    const value = this.profileForm.getRawValue();
    const fields = [
      value.firstName,
      value.lastName,
      value.displayName,
      value.bio,
      value.dateOfBirth,
      value.occupation,
      value.education,
      value.countryId,
      value.timezoneId,
      value.languageId,
      value.currencyId,
      this.interests().length ? 'has-interests' : '',
    ];
    const completed = fields.filter(field => Boolean(field)).length;

    this.completionPercent.set(
      Math.round((completed / fields.length) * 100)
    );
  }

  private nullIfEmpty(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private toDateInputValue(value: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toISOString().slice(0, 10);
  }
}
