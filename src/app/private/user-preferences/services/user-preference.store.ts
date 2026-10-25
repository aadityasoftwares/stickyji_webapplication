import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Subject, finalize, takeUntil } from 'rxjs';
import { UserPreferenceService } from './user-preference.service';
import {
  DEFAULT_USER_PREFERENCES,
  USER_PREFERENCE_KEYS,
} from '../../../shared/constants/common.constants';
import { extractErrorMessage } from '../../../shared/functions/api.functions';
import { USER_PREFERENCE_MESSAGES } from '../messages/user-preference.messages';
import { extractList } from '../../../shared/functions/common.function';

@Injectable({
  providedIn: 'root',
})
export class UserPreferenceStore {
  private readonly userPreferenceService = inject(UserPreferenceService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sessionEnd$ = new Subject<void>();

  private readonly _preferences = signal<any>({
    ...DEFAULT_USER_PREFERENCES,
  });
  private readonly _persistedKeys = signal<readonly string[]>([]);
  private readonly _savingKeys = signal<readonly string[]>([]);
  private readonly _loading = signal(false);
  private readonly _loaded = signal(false);
  private readonly _ready = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly queuedSaves = new Map<string, unknown>();

  readonly preferences = this._preferences.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  /** The initial request settled, either with saved preferences or safe defaults. */
  readonly ready = this._ready.asReadonly();
  readonly ready$ = toObservable(this.ready);
  readonly error = this._error.asReadonly();
  readonly saving = computed(() => this._savingKeys().length > 0);

  readonly theme = computed(() => this._preferences()[USER_PREFERENCE_KEYS.THEME]);
  readonly sidebarCollapsed = computed(() => {
    const val = this._preferences()[USER_PREFERENCE_KEYS.SIDEBAR_COLLAPSED];
    return val === true || val === 'true';
  });

  readonly selectedWorkspaceId = computed(() =>
    String(this._preferences()[USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID] ?? '').trim(),
  );

  readonly selectedFolderId = computed(() =>
    String(this._preferences()[USER_PREFERENCE_KEYS.SELECTED_FOLDER_ID] ?? '').trim(),
  );

  readonly defaultNoteColor = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.DEFAULT_NOTE_COLOR] || 'YELLOW',
  );

  readonly defaultNoteShape = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.DEFAULT_NOTE_SHAPE] || 'SQUARE',
  );

  readonly defaultNoteVariant = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.DEFAULT_NOTE_VARIANT] || 'PLAIN',
  );

  readonly defaultNoteBackgroundPattern = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.DEFAULT_NOTE_BACKGROUND_PATTERN] || 'NONE',
  );

  readonly todayView = computed(() => this._preferences()[USER_PREFERENCE_KEYS.TODAY_VIEW]);

  readonly overdueView = computed(() => this._preferences()[USER_PREFERENCE_KEYS.OVERDUE_VIEW]);

  readonly workspaceView = computed(() => this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_VIEW]);

  readonly workspaceStatusFilter = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_STATUS_FILTER],
  );

  readonly workspaceAccessFilter = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_ACCESS_FILTER],
  );

  readonly workspaceSortOrder = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_SORT_ORDER],
  );

  readonly workspaceFolderView = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_FOLDER_VIEW],
  );

  readonly workspaceFolderStatusFilter = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_FOLDER_STATUS_FILTER],
  );

  readonly workspaceFolderSortOrder = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_FOLDER_SORT_ORDER],
  );

  readonly workspaceMemberView = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_MEMBER_VIEW],
  );

  readonly workspaceMemberStatusFilter = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_MEMBER_STATUS_FILTER],
  );

  readonly workspaceMemberSortOrder = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_MEMBER_SORT_ORDER],
  );

  readonly workspaceRoleView = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_ROLE_VIEW],
  );

  readonly workspaceRoleStatusFilter = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_ROLE_STATUS_FILTER],
  );

  readonly workspaceRoleSortOrder = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_ROLE_SORT_ORDER],
  );

  readonly favouriteStatusFilter = computed(
    () =>
      this._preferences()[USER_PREFERENCE_KEYS.FAVOURITE_STATUS_FILTER] ??
      this._preferences()[USER_PREFERENCE_KEYS.FAVORITE_STATUS_FILTER],
  );

  readonly favouriteSortOrder = computed(
    () =>
      this._preferences()[USER_PREFERENCE_KEYS.FAVOURITE_SORT_ORDER] ??
      this._preferences()[USER_PREFERENCE_KEYS.FAVORITE_SORT_ORDER],
  );

  readonly favouriteView = computed(
    () =>
      this._preferences()[USER_PREFERENCE_KEYS.FAVOURITE_VIEW] ??
      this._preferences()[USER_PREFERENCE_KEYS.FAVORITE_VIEW],
  );

  readonly favoriteStatusFilter = this.favouriteStatusFilter;
  readonly favoriteSortOrder = this.favouriteSortOrder;
  readonly favoriteView = this.favouriteView;

  readonly favouriteSelectedWorkspace = computed(() =>
    String(
      this._preferences()[USER_PREFERENCE_KEYS.FAVOURITE_SELECTED_WORKSPACE] ??
      this._preferences()[USER_PREFERENCE_KEYS.FAVORITE_SELECTED_WORKSPACE] ??
      '',
    ).trim(),
  );

  readonly favoriteSelectedWorkspace = this.favouriteSelectedWorkspace;

  readonly myNotesStatusFilter = computed(
    () =>
      this._preferences()[USER_PREFERENCE_KEYS.MY_NOTES_STATUS_FILTER] ??
      this._preferences()[USER_PREFERENCE_KEYS.MY_NOTE_STATUS_FILTER],
  );

  readonly myNotesSortOrder = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.MY_NOTES_SORT_ORDER],
  );

  readonly myNotesView = computed(
    () =>
      this._preferences()[USER_PREFERENCE_KEYS.MY_NOTES_VIEW] ??
      this._preferences()[USER_PREFERENCE_KEYS.MY_NOTE_VIEW],
  );

  readonly myNoteStatusFilter = this.myNotesStatusFilter;
  readonly myNoteSortOrder = this.myNotesSortOrder;
  readonly myNoteView = this.myNotesView;

  readonly myNotesSelectedWorkspace = computed(() =>
    String(this._preferences()[USER_PREFERENCE_KEYS.MY_NOTES_SELECTED_WORKSPACE] ?? '').trim(),
  );

  readonly myNotesSelectedFolder = computed(() =>
    String(this._preferences()[USER_PREFERENCE_KEYS.MY_NOTES_SELECTED_FOLDER] ?? '').trim(),
  );

  readonly myNoteSelectedWorkspace = this.myNotesSelectedWorkspace;
  readonly myNoteSelectedFolder = this.myNotesSelectedFolder;

  readonly autosaveEnabled = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.AUTOSAVE_ENABLED],
  );

  readonly autosaveInterval = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.AUTOSAVE_INTERVAL],
  );

  readonly emailNotifications = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.EMAIL_NOTIFICATIONS],
  );

  readonly pushNotifications = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.PUSH_NOTIFICATIONS],
  );

  readonly inAppNotifications = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.IN_APP_NOTIFICATIONS],
  );

  readonly marketingEmails = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.MARKETING_EMAILS],
  );

  readonly profileVisible = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.PROFILE_VISIBLE],
  );

  readonly showOnlineStatus = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.SHOW_ONLINE_STATUS],
  );

  readonly reduceMotion = computed(() => this._preferences()[USER_PREFERENCE_KEYS.REDUCE_MOTION]);

  readonly highContrast = computed(() => this._preferences()[USER_PREFERENCE_KEYS.HIGH_CONTRAST]);

  readonly dateFormat = computed(() => this._preferences()[USER_PREFERENCE_KEYS.DATE_FORMAT]);

  readonly timeFormat = computed(() => this._preferences()[USER_PREFERENCE_KEYS.TIME_FORMAT]);

  readonly timezone = computed(() => this._preferences()[USER_PREFERENCE_KEYS.TIMEZONE]);

  readonly locale = computed(() => this._preferences()[USER_PREFERENCE_KEYS.LOCALE]);

  readonly weekStartsOn = computed(() => this._preferences()[USER_PREFERENCE_KEYS.WEEK_STARTS_ON]);

  readonly stickyNoteLayout = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.STICKY_NOTE_LAYOUT],
  );

  readonly stickyNoteFont = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.STICKY_NOTE_FONT],
  );

  readonly stickyNoteFontSize = computed(
    () => this._preferences()[USER_PREFERENCE_KEYS.STICKY_NOTE_FONT_SIZE],
  );

  load(force = false): void {
    if (this._ready() && !force) {
      return;
    }

    if (this._loading()) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.userPreferenceService
      .getMyPreferences()
      .pipe(
        takeUntil(this.sessionEnd$),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._loading.set(false)),
      )
      .subscribe({
        next: (response: any) => {
          this.applyResponse(response);
        },
        error: (error: any) => {
          this._ready.set(true);
          this._error.set(extractErrorMessage(error, 'Failed to load preferences'));
        },
      });
  }

  updatePreference(key: string, value: any): void {
    const preferenceKey = String(key ?? '').trim();

    if (!preferenceKey) {
      return;
    }

    this._preferences.update((current) => ({
      ...current,
      [preferenceKey]: value,
    }));
  }

  setAndSave(key: string, value: any): void {
    const preferenceKey = String(key ?? '').trim();

    if (!preferenceKey) {
      return;
    }

    const previousValue = this._preferences()[preferenceKey];

    if (this.valuesEqual(previousValue, value)) {
      return;
    }

    this.updatePreference(preferenceKey, value);

    if (this.isSaving(preferenceKey)) {
      this.queuedSaves.set(preferenceKey, value);
      return;
    }

    this.persistPreference(preferenceKey, value, previousValue);
  }

  resetPreference(key: string): void {
    const preferenceKey = String(key ?? '').trim();

    if (!preferenceKey || this.isSaving(preferenceKey)) {
      return;
    }

    const previousValue = this._preferences()[preferenceKey];

    this.setSaving(preferenceKey, true);
    this._error.set(null);

    this.userPreferenceService
      .resetPreference(preferenceKey)
      .pipe(
        takeUntil(this.sessionEnd$),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setSaving(preferenceKey, false)),
      )
      .subscribe({
        next: (response: any) => {
          const preference = response?.data;

          if (preference?.key) {
            this.updatePreference(preference.key, preference.value);
          }

          this._persistedKeys.update((keys) =>
            keys.includes(preferenceKey) ? keys : [...keys, preferenceKey],
          );

          this._loaded.set(true);
        },
        error: (error: any) => {
          this.updatePreference(preferenceKey, previousValue);

          this._error.set(extractErrorMessage(error, USER_PREFERENCE_MESSAGES.FAIL_TO_SAVE));
        },
      });
  }

  resetAllPreferences(): void {
    if (this._savingKeys().length) {
      return;
    }

    this._error.set(null);

    this.userPreferenceService
      .resetAllPreferences()
      .pipe(takeUntil(this.sessionEnd$), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.applyResponse(response);
        },
        error: (error: any) => {
          this._error.set(extractErrorMessage(error, USER_PREFERENCE_MESSAGES.FAIL_TO_SAVE));
        },
      });
  }

  getPreference(key: string): any {
    return this._preferences()[String(key ?? '').trim()];
  }

  isSaving(key: string): boolean {
    return this._savingKeys().includes(String(key ?? '').trim());
  }

  clearError(): void {
    this._error.set(null);
  }

  refresh(): void {
    this.load(true);
  }

  reset(): void {
    this.queuedSaves.clear();
    this.sessionEnd$.next();
    this._preferences.set({
      ...DEFAULT_USER_PREFERENCES,
    });
    this._persistedKeys.set([]);
    this._savingKeys.set([]);
    this._loading.set(false);
    this._loaded.set(false);
    this._ready.set(false);
    this._error.set(null);
  }

  private applyResponse(response: unknown): void {
    const data = (response as { data?: unknown } | null)?.data ?? response;
    const records = extractList<{ key?: string; value?: unknown }>(data);
    const values: Record<string, unknown> = {};
    for (const record of records) {
      const key = String(record?.key ?? '').trim();
      if (key && key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
        values[key] = record.value;
      }
    }
    // The existing API model also permits a flat preference object.
    if (!records.length && data && typeof data === 'object' && !Array.isArray(data)) {
      for (const key of Object.keys(DEFAULT_USER_PREFERENCES)) {
        if (Object.hasOwn(data, key)) values[key] = (data as Record<string, unknown>)[key];
      }
    }
    this._preferences.set({ ...DEFAULT_USER_PREFERENCES, ...values });
    this._persistedKeys.set(Object.keys(values));
    this._loaded.set(true);
    this._ready.set(true);
  }

  private setSaving(key: string, saving: boolean): void {
    this._savingKeys.update((keys) => {
      if (saving) {
        return keys.includes(key) ? keys : [...keys, key];
      }

      return keys.filter((currentKey) => currentKey !== key);
    });
  }

  private persistPreference(key: string, value: any, previousValue: any): void {
    const exists = this._persistedKeys().includes(key);
    let saved = false;

    this.setSaving(key, true);
    this._error.set(null);

    const request = exists
      ? this.userPreferenceService.updatePreference(key, value)
      : this.userPreferenceService.createPreference(key, value);

    request
      .pipe(
        takeUntil(this.sessionEnd$),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.setSaving(key, false);

          if (!this.queuedSaves.has(key)) return;

          const queuedValue = this.queuedSaves.get(key);
          this.queuedSaves.delete(key);
          if (saved && this.valuesEqual(queuedValue, value)) return;

          this.persistPreference(key, queuedValue, saved ? value : previousValue);
        }),
      )
      .subscribe({
        next: (response: any) => {
          saved = true;
          const preference = response?.data;
          const responseKey = String(preference?.key ?? key).trim();

          if (
            responseKey &&
            !this.queuedSaves.has(key) &&
            this.valuesEqual(this._preferences()[key], value)
          ) {
            this.updatePreference(responseKey, preference?.value ?? value);
          }

          if (!exists) {
            this._persistedKeys.update((keys) => (keys.includes(key) ? keys : [...keys, key]));
          }

          this._loaded.set(true);
        },
        error: (error: any) => {
          if (!this.queuedSaves.has(key) && this.valuesEqual(this._preferences()[key], value)) {
            this.updatePreference(key, previousValue);
          }
          this._error.set(extractErrorMessage(error, USER_PREFERENCE_MESSAGES.FAIL_TO_SAVE));
        },
      });
  }

  private valuesEqual(currentValue: any, nextValue: any): boolean {
    return JSON.stringify(currentValue) === JSON.stringify(nextValue);
  }
}
