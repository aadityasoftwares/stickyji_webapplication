import { Tooltip } from '../../../shared/components/tooltip/tooltip';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { filter, finalize, forkJoin, map, switchMap, tap } from 'rxjs';

import {
  LucideBookOpen,
  LucideBriefcaseBusiness,
  LucideCalendarDays,
  LucideCamera,
  LucideCheck,
  LucideCircleUserRound,
  LucideClock3,
  LucideCoins,
  LucideGlobe2,
  LucideGraduationCap,
  LucideInfo,
  LucideLanguages,
  LucideLoaderCircle,
  LucideMail,
  LucideMapPin,
  LucidePlus,
  LucideRotateCcw,
  LucideSave,
  LucideShield,
  LucideSparkles,
  LucideTag,
  LucideTrash2,
  LucideUpload,
  LucideUser,
  LucideUserRound,
  LucideX,
} from '@lucide/angular';

import { Avatar } from '../../../shared/components/avatar/avatar';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { Divider } from '../../../shared/components/divider/divider';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput } from '../../../shared/components/input/input';
import { Select, type SelectOption } from '../../../shared/components/select/select';
import { Modal } from '../../../shared/components/modal/modal';
import { DeleteConfirmModal } from '../../../shared/components/delete-confirm-modal/delete-confirm-modal';
import { ToastService } from '../../../shared/components/toast/services/toast.service';

import type {
  ProfileReferenceData,
  UpdateUserProfilePayload,
  UserProfile,
  UserProfileType,
} from '../interfaces/user-profile.interface';

import { UserProfileService } from '../services/user-profile.service';
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
    Tooltip,
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
    Modal,
    DeleteConfirmModal,
  ],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly profileService = inject(UserProfileService);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly LucideBookOpen = LucideBookOpen;
  readonly LucideBriefcaseBusiness = LucideBriefcaseBusiness;
  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideCamera = LucideCamera;
  readonly LucideCheck = LucideCheck;
  readonly LucideCircleUserRound = LucideCircleUserRound;
  readonly LucideClock3 = LucideClock3;
  readonly LucideCoins = LucideCoins;
  readonly LucideGlobe2 = LucideGlobe2;
  readonly LucideGraduationCap = LucideGraduationCap;
  readonly LucideInfo = LucideInfo;
  readonly LucideLanguages = LucideLanguages;
  readonly LucideLoaderCircle = LucideLoaderCircle;
  readonly LucideMail = LucideMail;
  readonly LucideMapPin = LucideMapPin;
  readonly LucidePlus = LucidePlus;
  readonly LucideRotateCcw = LucideRotateCcw;
  readonly LucideSave = LucideSave;
  readonly LucideShield = LucideShield;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideTag = LucideTag;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideUpload = LucideUpload;
  readonly LucideUser = LucideUser;
  readonly LucideUserRound = LucideUserRound;
  readonly LucideX = LucideX;

  readonly currentAvatarUrl = computed(() => this.profileService.currentUserAvatarUrl());
  readonly selectedFile = signal<File | null>(null);
  readonly pendingPreviewUrl = signal<string | null>(null);
  readonly previewModalOpen = signal(false);
  readonly removeConfirmOpen = signal(false);
  readonly uploading = signal(false);
  readonly uploadProgress = signal<number | null>(null);
  readonly uploadStep = signal<string>('');
  readonly removing = signal(false);
  readonly imageErrorCount = signal(0);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saved = signal(false);

  readonly profile = signal<UserProfile | null>(null);
  readonly profileExists = signal(false);

  readonly interests = signal<string[]>([]);
  readonly interestInputValue = signal('');
  readonly completionPercent = signal(0);

  readonly popularInterests: readonly string[] = [
    'Productivity',
    'Design',
    'Engineering',
    'Reading',
    'Writing',
    'Research',
    'Side Projects',
  ];

  readonly previewName = signal('Your profile');
  readonly previewOccupation = signal('Sticky Ji member');

  readonly userEmail = computed(() => this.authStore.user()?.email ?? '');

  readonly completionMessage = computed(() => {
    const percent = this.completionPercent();
    if (percent >= 100) {
      return 'All done! Your profile details are completely up to date.';
    }
    if (percent >= 75) {
      return 'Almost there! Add remaining details to complete your profile.';
    }
    if (percent >= 50) {
      return 'Good progress! Add a bio and interests to connect with peers.';
    }
    return 'Complete optional details to help collaborators recognize you.';
  });

  readonly lastUpdatedText = computed(() => {
    const p = this.profile();
    if (!p?.updatedAt) return null;
    try {
      const date = new Date(p.updatedAt);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  });

  readonly countryOptions = signal<SelectOption[]>([]);
  readonly timezoneOptions = signal<SelectOption[]>([]);
  readonly languageOptions = signal<SelectOption[]>([]);
  readonly currencyOptions = signal<SelectOption[]>([]);

  readonly profileTypeOptions: readonly SelectOption[] = [
    {
      label: 'Personal',
      value: 'PERSONAL',
      description: 'Personal notes, daily journaling and habits',
      icon: LucideUser,
    },
    {
      label: 'Student',
      value: 'STUDENT',
      description: 'Lectures, study schedules and exam checklists',
      icon: LucideGraduationCap,
    },
    {
      label: 'Professional',
      value: 'PROFESSIONAL',
      description: 'Work projects, meeting minutes and career notes',
      icon: LucideBriefcaseBusiness,
    },
    {
      label: 'Business',
      value: 'BUSINESS',
      description: 'Team operations, clients and shared workspaces',
      icon: LucideShield,
    },
  ];

  readonly profileForm = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],

    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],

    displayName: ['', [Validators.minLength(2), Validators.maxLength(80)]],

    bio: ['', [Validators.maxLength(280)]],

    // UTC ISO string or null
    dateOfBirth: [null as string | null],

    profileType: ['PERSONAL' as UserProfileType, [Validators.required]],

    occupation: ['', [Validators.maxLength(100)]],

    education: ['', [Validators.maxLength(150)]],

    countryId: [''],
    timezoneId: [''],
    languageId: [''],
  });

  readonly minimumDateOfBirth = new Date(1900, 0, 1);

  readonly maximumDateOfBirth = new Date();

  constructor() {
    this.destroyRef.onDestroy(() => {
      const pending = this.pendingPreviewUrl();
      if (pending) {
        URL.revokeObjectURL(pending);
      }
    });
  }

  ngOnInit(): void {
    this.watchFormChanges();
    this.loadScreen();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.toast.error('Unsupported format. Please select a JPEG, PNG, or WebP image.');
      input.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      this.toast.error('File size exceeds 5 MB. Please choose a smaller image.');
      input.value = '';
      return;
    }

    const oldUrl = this.pendingPreviewUrl();
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    this.selectedFile.set(file);
    this.pendingPreviewUrl.set(objectUrl);
    this.uploadProgress.set(null);
    this.uploadStep.set('');
    this.previewModalOpen.set(true);

    input.value = '';
  }

  cancelPreview(): void {
    if (this.uploading()) return;

    const oldUrl = this.pendingPreviewUrl();
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }

    this.pendingPreviewUrl.set(null);
    this.selectedFile.set(null);
    this.uploadProgress.set(null);
    this.uploadStep.set('');
    this.previewModalOpen.set(false);
  }

  confirmUpload(): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) return;

    this.uploading.set(true);
    this.uploadStep.set('Requesting secure upload...');
    this.uploadProgress.set(10);

    this.profileService
      .requestProfileImageUpload({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((uploadRes) => {
          this.uploadStep.set('Uploading photo to cloud storage...');
          this.uploadProgress.set(25);

          return this.profileService.uploadToR2(uploadRes.uploadUrl, file).pipe(
            filter(
              (event): event is HttpEvent<unknown> =>
                event.type === HttpEventType.UploadProgress ||
                event.type === HttpEventType.Response,
            ),
            tap((event) => {
              if (event.type === HttpEventType.UploadProgress && event.total) {
                const percent = Math.round(25 + (event.loaded / event.total) * 55);
                this.uploadProgress.set(percent);
              }
            }),
            filter((event) => event.type === HttpEventType.Response),
            map(() => uploadRes.mediaId),
          );
        }),
        switchMap((mediaId) => {
          this.uploadStep.set('Verifying uploaded photo...');
          this.uploadProgress.set(85);
          return this.profileService.completeMediaUpload(mediaId).pipe(map(() => mediaId));
        }),
        switchMap((mediaId) => {
          this.uploadStep.set('Updating profile...');
          this.uploadProgress.set(95);
          return this.profileService.setProfileImage(mediaId);
        }),
        finalize(() => {
          this.uploading.set(false);
        }),
      )
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.cancelPreview();
          this.toast.success('Profile photo updated successfully.');
        },
        error: (error) => {
          this.uploadProgress.set(null);
          this.uploadStep.set('');
          this.toast.error(
            extractErrorMessage(error, 'Failed to update profile photo. Please try again.'),
          );
        },
      });
  }

  openRemoveConfirm(): void {
    this.removeConfirmOpen.set(true);
  }

  closeRemoveConfirm(): void {
    if (!this.removing()) {
      this.removeConfirmOpen.set(false);
    }
  }

  confirmRemove(): void {
    if (this.removing()) return;

    this.removing.set(true);

    this.profileService
      .removeProfileImage()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.removing.set(false);
          this.removeConfirmOpen.set(false);
        }),
      )
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.toast.success('Profile photo removed.');
        },
        error: (error) => {
          this.toast.error(
            extractErrorMessage(error, 'Could not remove profile photo. Please try again.'),
          );
        },
      });
  }

  onAvatarImageError(): void {
    if (this.imageErrorCount() < 2) {
      this.imageErrorCount.update((count) => count + 1);
      this.profileService.refreshProfileImageIfStale(true).subscribe({
        error: () => {},
      });
    }
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
        next: (profile) => {
          this.profile.set(profile);
          this.profileExists.set(true);
          this.interests.set(profile.interests ?? []);

          this.patchProfile(profile);
          this.syncAuthenticatedUser(profile);

          this.profileForm.markAsPristine();
          this.saved.set(true);
          this.updateCompletion();
        },

        error: (error) => {
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

  addInterest(inputOrValue: HTMLInputElement | string): void {
    const rawValue = typeof inputOrValue === 'string' ? inputOrValue : inputOrValue.value;
    const interest = rawValue.trim();
    const currentInterests = this.interests();

    const alreadyExists = currentInterests.some(
      (item) => item.toLowerCase() === interest.toLowerCase(),
    );

    if (!interest || interest.length > 40 || currentInterests.length >= 10 || alreadyExists) {
      return;
    }

    this.interests.set([...currentInterests, interest]);

    this.profileForm.markAsDirty();
    if (typeof inputOrValue !== 'string') {
      inputOrValue.value = '';
    }
    this.interestInputValue.set('');

    this.saved.set(false);
    this.updateCompletion();
  }

  addCurrentInterest(): void {
    const value = this.interestInputValue();
    if (value) {
      this.addInterest(value);
    }
  }

  addSuggestedInterest(interest: string): void {
    this.addInterest(interest);
  }

  onInterestInputChange(value: string | number | null): void {
    this.interestInputValue.set(typeof value === 'string' ? value : '');
  }

  handleInterestKeydown(event: KeyboardEvent, input?: HTMLInputElement): void {
    if (event.key !== 'Enter' && event.key !== ',') {
      return;
    }

    event.preventDefault();
    if (input) {
      this.addInterest(input);
    } else {
      this.addCurrentInterest();
    }
  }

  removeInterest(interest: string): void {
    this.interests.update((items) => items.filter((item) => item !== interest));

    this.profileForm.markAsDirty();
    this.saved.set(false);
    this.updateCompletion();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardSave(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (!this.profileForm.pristine && !this.saving()) {
        this.saveProfile();
      }
    }
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
    this.saveError.set(null);
    this.saved.set(false);

    forkJoin({
      profile: this.profileService.getMyProfile(),
      references: this.profileService.getReferenceData(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ profile, references }) => {
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

        error: (error) => {
          this.loadError.set(
            extractErrorMessage(error, 'We could not load your profile right now.'),
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

        // Datepicker accepts the backend ISO value directly
        dateOfBirth: profile.dateOfBirth ?? null,

        profileType: profile.profileType ?? 'PERSONAL',

        occupation: profile.occupation ?? '',

        education: profile.education ?? '',

        countryId: profile.countryId ?? '',

        timezoneId: profile.timezoneId ?? '',

        languageId: profile.languageId ?? '',
      },
      {
        emitEvent: false,
      },
    );

    this.interests.set(profile.interests ?? []);

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

  private buildPayload(): UpdateUserProfilePayload {
    const value = this.profileForm.getRawValue();

    return {
      firstName: value.firstName?.trim() ?? '',

      lastName: value.lastName?.trim() ?? '',

      displayName: this.nullIfEmpty(value.displayName),

      bio: this.nullIfEmpty(value.bio),

      // Already UTC ISO:
      // 2026-08-31T00:00:00.000Z
      dateOfBirth: value.dateOfBirth ?? null,

      profileType: value.profileType as UserProfileType,

      occupation: this.nullIfEmpty(value.occupation),

      education: this.nullIfEmpty(value.education),

      interests: this.interests(),

      countryId: this.nullIfEmpty(value.countryId),

      timezoneId: this.nullIfEmpty(value.timezoneId),

      languageId: this.nullIfEmpty(value.languageId),
    };
  }

  private setReferenceOptions(references: ProfileReferenceData): void {
    this.countryOptions.set(
      references.countries.map((country) => ({
        value: country._id,
        label: `${country.flag ? `${country.flag} ` : ''}${country.name}`,
      })),
    );

    this.timezoneOptions.set(
      references.timezones.map((timezone) => ({
        value: timezone._id,
        label: `${timezone.offset ? `(${timezone.offset}) ` : ''}${timezone.name}`,
      })),
    );

    this.languageOptions.set(
      references.languages.map((language) => ({
        value: language._id,
        label: `${language.name}${language.code ? ` · ${language.code.toUpperCase()}` : ''}`,
      })),
    );
  }

  private watchFormChanges(): void {
    this.profileForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.saved.set(false);
      this.updatePreview();
      this.updateCompletion();
    });
  }

  private updatePreview(): void {
    const value = this.profileForm.getRawValue();

    const fullName = `${value.firstName ?? ''} ${value.lastName ?? ''}`.trim();

    const name = value.displayName?.trim() || fullName || 'Your profile';

    this.previewName.set(name);

    this.previewOccupation.set(value.occupation?.trim() || 'Sticky Ji member');
  }

  private updateCompletion(): void {
    const value = this.profileForm.getRawValue();

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
      this.interests().length ? 'has-interests' : '',
    ];

    const completed = fields.filter((field) => Boolean(field)).length;

    this.completionPercent.set(Math.round((completed / fields.length) * 100));
  }

  private syncAuthenticatedUser(profile: UserProfile): void {
    const currentUser = this.authStore.user();

    if (!currentUser) {
      return;
    }

    const avatarUrl = profile.profileImage?.url ?? profile.avatarUrl ?? null;

    // Keeping `id` in the patch makes this compatible even when the
    // profile fields are optional additions on AuthenticatedUser.
    const userPatch = {
      id: currentUser.id,
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      displayName: profile.displayName ?? '',
      avatarUrl,
      profileImage: profile.profileImage ?? null,
    };

    this.authStore.patchUser(userPatch);
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

    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }
}
