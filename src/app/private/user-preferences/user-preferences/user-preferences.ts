import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import {
  LucideAccessibility,
  LucideBell,
  LucideCheck,
  LucideContrast,
  LucideEye,
  LucideGauge,
  LucideLayoutGrid,
  LucideMail,
  LucidePalette,
  LucideRefreshCcw,
  LucideRotateCcw,
  LucideSave,
  LucideShieldCheck,
  LucideSmartphone,
  LucideSparkles,
  LucideStickyNote,
  LucideZap,
} from '@lucide/angular';

import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Divider } from '../../../shared/components/divider/divider';
import { AppIcon } from '../../../shared/components/icon/icon';

import {
  Select,
  type SelectOption,
} from '../../../shared/components/select/select';

import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { Switch } from '../../../shared/components/switch/switch';

import {
  DEFAULT_USER_PREFERENCES,
  UserPreferencesM,
} from '../models/user-preference.models';

import { UserPreferenceStore } from '../services/user-preference.store';


/* ==========================================================================
   Form value
   ========================================================================== */

interface UserPreferencesFormValue {
  theme: string;

  defaultNoteColor: string;
  noteView: string;
  todayView: string;
  overdueView: string;

  autosaveEnabled: boolean;
  autosaveInterval: string;

  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  marketingEmails: boolean;

  profileVisible: boolean;
  showOnlineStatus: boolean;

  reduceMotion: boolean;
  highContrast: boolean;
}


@Component({
  selector: 'app-user-preferences',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,

    AppIcon,
    Badge,
    Button,
    Divider,
    Select,
    StickyCard,
    Switch,
  ],

  templateUrl: './user-preferences.html',
  styleUrl: './user-preferences.scss',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPreferences implements OnInit {

  /* ==========================================================================
     Dependencies
     ========================================================================== */

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly preferenceStore = inject(UserPreferenceStore);

  private readonly destroyRef =
    inject(DestroyRef);


  /* ==========================================================================
     Icons
     ========================================================================== */

  readonly LucideAccessibility =
    LucideAccessibility;

  readonly LucideBell =
    LucideBell;

  readonly LucideCheck =
    LucideCheck;

  readonly LucideContrast =
    LucideContrast;

  readonly LucideEye =
    LucideEye;

  readonly LucideGauge =
    LucideGauge;

  readonly LucideLayoutGrid =
    LucideLayoutGrid;

  readonly LucideMail =
    LucideMail;

  readonly LucidePalette =
    LucidePalette;

  readonly LucideRefreshCcw =
    LucideRefreshCcw;

  readonly LucideRotateCcw =
    LucideRotateCcw;

  readonly LucideSave =
    LucideSave;

  readonly LucideShieldCheck =
    LucideShieldCheck;

  readonly LucideSmartphone =
    LucideSmartphone;

  readonly LucideSparkles =
    LucideSparkles;

  readonly LucideStickyNote =
    LucideStickyNote;

  readonly LucideZap =
    LucideZap;


  /* ==========================================================================
     State
     ========================================================================== */

  readonly loading =
    signal(true);

  readonly saving =
    signal(false);

  readonly saved =
    signal(false);

  readonly loadError =
    signal<string | null>(null);

  readonly saveError =
    signal<string | null>(null);

  readonly changedCount =
    signal(0);


  /**
   * Complete saved preference object.
   *
   * Important:
   * Workspace-specific values such as workspaceView, workspaceStatusFilter and workspaceSortOrder
   * are kept here even though they are not fields on this settings form.
   */
  private readonly savedPreferences =
    signal<UserPreferencesM>({
      ...DEFAULT_USER_PREFERENCES,
    });


  /* ==========================================================================
     Options
     ========================================================================== */

  readonly themeOptions:
    readonly SelectOption[] = [
      {
        label: 'Use device setting',
        value: 'SYSTEM',
      },
      {
        label: 'Light',
        value: 'LIGHT',
      },
      {
        label: 'Dark',
        value: 'DARK',
      },
    ];


  readonly noteColorOptions:
    readonly SelectOption[] = [
      {
        label: 'Yellow',
        value: 'YELLOW',
      },
      {
        label: 'Orange',
        value: 'ORANGE',
      },
      {
        label: 'Pink',
        value: 'PINK',
      },
      {
        label: 'Red',
        value: 'RED',
      },
      {
        label: 'Green',
        value: 'GREEN',
      },
      {
        label: 'Blue',
        value: 'BLUE',
      },
      {
        label: 'Purple',
        value: 'PURPLE',
      },
      {
        label: 'Brown',
        value: 'BROWN',
      },
      {
        label: 'Black',
        value: 'BLACK',
      },
    ];


  readonly noteViewOptions:
    readonly SelectOption[] = [
      {
        label: 'Grid',
        value: 'GRID',
      },
      {
        label: 'Table',
        value: 'TABLE',
      },
      {
        label: 'Kanban',
        value: 'KANBAN',
      },
    ];

  readonly todayViewOptions: readonly SelectOption[] = [
    { label: 'Kanban', value: 'KANBAN' },
    { label: 'Table', value: 'TABLE' },
  ];

  readonly overdueViewOptions: readonly SelectOption[] = [
    { label: 'Top bar', value: 'BAR' },
    { label: 'Toolbar button', value: 'BUTTON' },
  ];


  readonly autosaveIntervalOptions:
    readonly SelectOption[] = [
      {
        label: 'Every 3 seconds',
        value: '3',
      },
      {
        label: 'Every 5 seconds',
        value: '5',
      },
      {
        label: 'Every 10 seconds',
        value: '10',
      },
      {
        label: 'Every 15 seconds',
        value: '15',
      },
      {
        label: 'Every 30 seconds',
        value: '30',
      },
    ];


  /* ==========================================================================
     Form
     ========================================================================== */

  readonly preferenceForm =
    this.formBuilder.nonNullable.group({

      theme: 'SYSTEM',

      defaultNoteColor: 'YELLOW',

      noteView: 'GRID',

      todayView: 'KANBAN',

      overdueView: 'BAR',

      autosaveEnabled: true,

      autosaveInterval: '5',

      emailNotifications: true,

      pushNotifications: true,

      inAppNotifications: true,

      marketingEmails: false,

      profileVisible: true,

      showOnlineStatus: true,

      reduceMotion: false,

      highContrast: false,
    });


  /* ==========================================================================
     Lifecycle
     ========================================================================== */

  constructor() {
    effect(() => {
      const loading = this.preferenceStore.loading();
      const ready = this.preferenceStore.ready();
      const preferences = this.preferenceStore.preferences();
      const error = this.preferenceStore.error();
      this.loading.set(loading || !ready);
      if (!ready || loading) return;
      this.loadError.set(this.preferenceStore.loaded() ? null : error);
      if (!this.saving() && !this.preferenceForm.dirty) {
        untracked(() => {
          this.savedPreferences.set(preferences);
          this.patchForm(preferences);
        });
      }
    });

    effect(() => {
      if (!this.saving() || this.preferenceStore.saving()) return;
      const error = this.preferenceStore.error();
      const preferences = this.preferenceStore.preferences();
      untracked(() => {
        this.saving.set(false);
        this.saveError.set(error);
        this.savedPreferences.set(preferences);
        this.saved.set(!error);
        if (error) this.updateChangedCount();
        else this.patchForm(preferences);
      });
    });
  }

  ngOnInit(): void {

    this.watchFormChanges();

    this.loadPreferences();
  }


  /* ==========================================================================
     Save
     ========================================================================== */

  savePreferences(): void {

    if (
      this.preferenceForm.invalid ||
      this.saving() || this.preferenceStore.saving()
    ) {

      this.preferenceForm.markAllAsTouched();

      return;
    }


    this.saving.set(true);

    this.saved.set(false);

    this.saveError.set(null);


    const preferences =
      this.toPreferences(
        this.preferenceForm.getRawValue(),
      );


    this.preferenceStore.clearError();
    // Save only fields owned by this form; preserve date and workspace settings.
    for (const key of Object.keys(this.preferenceForm.controls) as (keyof UserPreferencesFormValue)[]) {
      this.preferenceStore.setAndSave(key, preferences[key]);
      if (this.preferenceStore.error()) break;
    }
  }


  /* ==========================================================================
     Discard
     ========================================================================== */

  discardChanges(): void {

    this.patchForm(
      this.savedPreferences(),
    );

    this.saved.set(false);

    this.saveError.set(null);
  }


  /* ==========================================================================
     Restore defaults
     ========================================================================== */

  restoreDefaults(): void {

    this.patchForm(
      DEFAULT_USER_PREFERENCES,
      true,
    );

    this.saved.set(false);

    this.saveError.set(null);
  }


  /* ==========================================================================
     Reload
     ========================================================================== */

  reload(): void {

    this.preferenceForm.markAsPristine();
    this.loadPreferences(true);
  }


  /* ==========================================================================
     Load
     ========================================================================== */

  private loadPreferences(force = false): void {
    this.loadError.set(null);
    this.saveError.set(null);
    this.saved.set(false);
    this.preferenceStore.load(force);
  }


  /* ==========================================================================
     Watch form
     ========================================================================== */

  private watchFormChanges(): void {

    this.preferenceForm
      .valueChanges
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe(() => {

        this.saved.set(false);

        this.updateChangedCount();
      });
  }


  /* ==========================================================================
     Patch form
     ========================================================================== */

  private patchForm(
    preferences:
      Readonly<UserPreferencesM>,

    markAsDirty = false,
  ): void {

    this.preferenceForm.reset(
      this.toFormValue(
        preferences,
      ),
      {
        emitEvent: false,
      },
    );


    if (
      markAsDirty
    ) {

      this.preferenceForm.markAsDirty();

      this.updateChangedCount();

      return;
    }


    this.preferenceForm.markAsPristine();

    this.changedCount.set(0);
  }


  /* ==========================================================================
     Count changes
     ========================================================================== */

  private updateChangedCount(): void {

    const current =
      this.toPreferences(
        this.preferenceForm.getRawValue(),
      );


    const saved =
      this.savedPreferences();


    /**
     * Only compare values controlled by this Preferences page.
     *
     * workspaceView/workspaceStatusFilter/workspaceSortOrder are intentionally not counted here
     * because those values are controlled from Workspace itself.
     */
    const formKeys:
      readonly (keyof UserPreferencesM)[] = [

        'theme',

        'defaultNoteColor',
        'noteView',
        'todayView',
        'overdueView',

        'autosaveEnabled',
        'autosaveInterval',

        'emailNotifications',
        'pushNotifications',
        'inAppNotifications',
        'marketingEmails',

        'profileVisible',
        'showOnlineStatus',

        'reduceMotion',
        'highContrast',
      ];


    const count =
      formKeys.filter(
        key =>
          current[key] !==
          saved[key],
      ).length;


    this.changedCount.set(
      count,
    );


    if (
      count > 0
    ) {

      this.preferenceForm.markAsDirty();

    } else {

      this.preferenceForm.markAsPristine();
    }
  }


  /* ==========================================================================
     Preference -> Form
     ========================================================================== */

  private toFormValue(
    preferences:
      Readonly<UserPreferencesM>,
  ): UserPreferencesFormValue {

    return {

      theme:
        preferences.theme,

      defaultNoteColor:
        preferences.defaultNoteColor,

      noteView:
        preferences.noteView === 'LIST' ? 'TABLE' : preferences.noteView,

      todayView:
        preferences.todayView,

      overdueView:
        preferences.overdueView,

      autosaveEnabled:
        preferences.autosaveEnabled,

      autosaveInterval:
        String(
          preferences.autosaveInterval,
        ),

      emailNotifications:
        preferences.emailNotifications,

      pushNotifications:
        preferences.pushNotifications,

      inAppNotifications:
        preferences.inAppNotifications,

      marketingEmails:
        preferences.marketingEmails,

      profileVisible:
        preferences.profileVisible,

      showOnlineStatus:
        preferences.showOnlineStatus,

      reduceMotion:
        preferences.reduceMotion,

      highContrast:
        preferences.highContrast,
    };
  }


  /* ==========================================================================
     Form -> Complete Preferences
     ========================================================================== */

  private toPreferences(
    value:
      UserPreferencesFormValue,
  ): UserPreferencesM {

    /**
     * Start with the complete saved object.
     *
     * This preserves:
     *
     * workspaceView
     * workspaceStatusFilter
     * workspaceSortOrder
     *
     * even though those values are not displayed on this settings screen.
     */
    return {

      ...this.savedPreferences(),

      theme:
        value.theme as
        UserPreferencesM['theme'],

      defaultNoteColor:
        value.defaultNoteColor as
        UserPreferencesM['defaultNoteColor'],

      noteView:
        value.noteView as
        UserPreferencesM['noteView'],

      todayView:
        value.todayView as
        UserPreferencesM['todayView'],

      overdueView:
        value.overdueView as
        UserPreferencesM['overdueView'],

      autosaveEnabled:
        value.autosaveEnabled,

      autosaveInterval:
        Number(
          value.autosaveInterval,
        ) || 5,

      emailNotifications:
        value.emailNotifications,

      pushNotifications:
        value.pushNotifications,

      inAppNotifications:
        value.inAppNotifications,

      marketingEmails:
        value.marketingEmails,

      profileVisible:
        value.profileVisible,

      showOnlineStatus:
        value.showOnlineStatus,

      reduceMotion:
        value.reduceMotion,

      highContrast:
        value.highContrast,
    };
  }
}
