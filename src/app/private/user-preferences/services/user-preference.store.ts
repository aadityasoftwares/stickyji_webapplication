import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { UserPreferenceService } from './user-preference.service';
import {
    DEFAULT_USER_PREFERENCES,
    USER_PREFERENCE_KEYS,
} from '../../../shared/constants/common.constants';
import { extractErrorMessage } from '../../../shared/functions/api.functions';
import { USER_PREFERENCE_MESSAGES } from '../messages/user-preference.messages';

@Injectable({
    providedIn: 'root',
})
export class UserPreferenceStore {
    private readonly userPreferenceService = inject(UserPreferenceService);

    private readonly _preferences = signal<any>({
        ...DEFAULT_USER_PREFERENCES,
    });
    private readonly _persistedKeys = signal<readonly string[]>([]);
    private readonly _savingKeys = signal<readonly string[]>([]);
    private readonly _loading = signal(false);
    private readonly _loaded = signal(false);
    private readonly _error = signal<string | null>(null);

    readonly preferences = this._preferences.asReadonly();
    readonly loading = this._loading.asReadonly();
    readonly loaded = this._loaded.asReadonly();
    readonly error = this._error.asReadonly();
    readonly saving = computed(() => this._savingKeys().length > 0);

    readonly theme = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.THEME]
    );

    readonly selectedWorkspaceId = computed(() =>
        String(this._preferences()[USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID] ?? '').trim()
    );

    readonly selectedFolderId = computed(() =>
        String(this._preferences()[USER_PREFERENCE_KEYS.SELECTED_FOLDER_ID] ?? '').trim()
    );

    readonly defaultNoteColor = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.DEFAULT_NOTE_COLOR]
    );

    readonly workspaceView = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_VIEW]
    );

    readonly workspaceSort = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.WORKSPACE_SORT]
    );

    readonly autosaveEnabled = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.AUTOSAVE_ENABLED]
    );

    readonly autosaveInterval = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.AUTOSAVE_INTERVAL]
    );

    readonly emailNotifications = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.EMAIL_NOTIFICATIONS]
    );

    readonly pushNotifications = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.PUSH_NOTIFICATIONS]
    );

    readonly inAppNotifications = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.IN_APP_NOTIFICATIONS]
    );

    readonly marketingEmails = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.MARKETING_EMAILS]
    );

    readonly profileVisible = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.PROFILE_VISIBLE]
    );

    readonly showOnlineStatus = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.SHOW_ONLINE_STATUS]
    );

    readonly reduceMotion = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.REDUCE_MOTION]
    );

    readonly highContrast = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.HIGH_CONTRAST]
    );

    readonly stickyNoteLayout = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.STICKY_NOTE_LAYOUT]
    );

    readonly stickyNoteFont = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.STICKY_NOTE_FONT]
    );

    readonly stickyNoteFontSize = computed(() =>
        this._preferences()[USER_PREFERENCE_KEYS.STICKY_NOTE_FONT_SIZE]
    );

    load(force = false): void {
        if (this._loaded() && !force) {
            return;
        }

        if (this._loading()) {
            return;
        }

        this._loading.set(true);
        this._error.set(null);

        this.userPreferenceService
            .getMyPreferences()
            .pipe(finalize(() => this._loading.set(false)))
            .subscribe({
                next: (response: any) => {
                    const records = Array.isArray(response?.data)
                        ? response.data
                        : [];

                    const preferences = records.reduce(
                        (result: any, preference: any) => {
                            const key = String(preference?.key ?? '').trim();

                            if (key) {
                                result[key] = preference?.value;
                            }

                            return result;
                        },
                        {},
                    );

                    this._preferences.set({
                        ...DEFAULT_USER_PREFERENCES,
                        ...preferences,
                    });

                    const persistedKeys: string[] = records
                        .map((preference: any) => String(preference?.key ?? '').trim())
                        .filter((key: string) => Boolean(key));

                    this._persistedKeys.set([...new Set<string>(persistedKeys)]);

                    this._loaded.set(true);
                },
                error: (error: any) => {
                    this._error.set(extractErrorMessage(error, 'Failed to load preferences'));
                },
            });
    }

    updatePreference(key: string, value: any): void {
        const preferenceKey = String(key ?? '').trim();

        if (!preferenceKey) {
            return;
        }

        this._preferences.update(current => ({
            ...current,
            [preferenceKey]: value,
        }));
    }

    setAndSave(key: string, value: any): void {
        const preferenceKey = String(key ?? '').trim();

        if (!preferenceKey || this.isSaving(preferenceKey)) {
            return;
        }

        const previousValue = this._preferences()[preferenceKey];

        if (this.valuesEqual(previousValue, value)) {
            return;
        }

        const exists = this._persistedKeys().includes(preferenceKey);

        this.updatePreference(preferenceKey, value);
        this.setSaving(preferenceKey, true);
        this._error.set(null);

        const request = exists
            ? this.userPreferenceService.updatePreference(preferenceKey, value)
            : this.userPreferenceService.createPreference(preferenceKey, value);

        request
            .pipe(finalize(() => this.setSaving(preferenceKey, false)))
            .subscribe({
                next: (response: any) => {
                    const preference = response?.data;
                    const responseKey = String(
                        preference?.key ?? preferenceKey
                    ).trim();

                    if (responseKey) {
                        this.updatePreference(
                            responseKey,
                            preference?.value ?? value,
                        );
                    }

                    if (!exists) {
                        this._persistedKeys.update(keys =>
                            keys.includes(preferenceKey)
                                ? keys
                                : [...keys, preferenceKey]
                        );
                    }

                    this._loaded.set(true);
                },
                error: (error: any) => {
                    this.updatePreference(
                        preferenceKey,
                        previousValue,
                    );

                    this._error.set(extractErrorMessage(error, USER_PREFERENCE_MESSAGES.FAIL_TO_SAVE));
                },
            });
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
            .pipe(finalize(() => this.setSaving(preferenceKey, false)))
            .subscribe({
                next: (response: any) => {
                    const preference = response?.data;

                    if (preference?.key) {
                        this.updatePreference(
                            preference.key,
                            preference.value,
                        );
                    }

                    this._persistedKeys.update(keys =>
                        keys.includes(preferenceKey)
                            ? keys
                            : [...keys, preferenceKey]
                    );

                    this._loaded.set(true);
                },
                error: (error: any) => {
                    this.updatePreference(
                        preferenceKey,
                        previousValue,
                    );

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
            .subscribe({
                next: (response: any) => {
                    const records = Array.isArray(response?.data)
                        ? response.data
                        : [];

                    const preferences = records.reduce(
                        (result: any, preference: any) => {
                            const key = String(preference?.key ?? '').trim();

                            if (key) {
                                result[key] = preference?.value;
                            }

                            return result;
                        },
                        {},
                    );

                    this._preferences.set({
                        ...DEFAULT_USER_PREFERENCES,
                        ...preferences,
                    });

                    this._persistedKeys.set(
                        records
                            .map((preference: any) =>
                                String(preference?.key ?? '').trim()
                            )
                            .filter(Boolean),
                    );

                    this._loaded.set(true);
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
        return this._savingKeys().includes(
            String(key ?? '').trim()
        );
    }

    clearError(): void {
        this._error.set(null);
    }

    refresh(): void {
        this.load(true);
    }

    reset(): void {
        this._preferences.set({
            ...DEFAULT_USER_PREFERENCES,
        });
        this._persistedKeys.set([]);
        this._savingKeys.set([]);
        this._loading.set(false);
        this._loaded.set(false);
        this._error.set(null);
    }

    private setSaving(key: string, saving: boolean): void {
        this._savingKeys.update(keys => {
            if (saving) {
                return keys.includes(key)
                    ? keys
                    : [...keys, key];
            }

            return keys.filter(
                currentKey => currentKey !== key
            );
        });
    }

    private valuesEqual(currentValue: any, nextValue: any): boolean {
        return JSON.stringify(currentValue) === JSON.stringify(nextValue);
    }
}
