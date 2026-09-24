export const USER_PREFERENCE_KEYS = {
    THEME: 'theme',
    DEFAULT_NOTE_COLOR: 'defaultNoteColor',
    NOTE_VIEW: 'noteView',
    WORKSPACE_VIEW: 'workspaceView',
    WORKSPACE_SORT: 'workspaceSort',
    AUTOSAVE_ENABLED: 'autosaveEnabled',
    AUTOSAVE_INTERVAL: 'autosaveInterval',
    EMAIL_NOTIFICATIONS: 'emailNotifications',
    PUSH_NOTIFICATIONS: 'pushNotifications',
    IN_APP_NOTIFICATIONS: 'inAppNotifications',
    MARKETING_EMAILS: 'marketingEmails',
    PROFILE_VISIBLE: 'profileVisible',
    SHOW_ONLINE_STATUS: 'showOnlineStatus',
    REDUCE_MOTION: 'reduceMotion',
    HIGH_CONTRAST: 'highContrast',
} as const;

export type UserPreferenceKey =
    typeof USER_PREFERENCE_KEYS[
    keyof typeof USER_PREFERENCE_KEYS
    ];

export type UserTheme =
    | 'SYSTEM'
    | 'LIGHT'
    | 'DARK';

export type DefaultNoteColor =
    | 'YELLOW'
    | 'ORANGE'
    | 'PINK'
    | 'RED'
    | 'GREEN'
    | 'BLUE'
    | 'PURPLE'
    | 'BROWN'
    | 'BLACK';

export type NoteView =
    | 'GRID'
    | 'LIST'
    | 'KANBAN';

export type WorkspacePreferenceView =
    | 'GRID'
    | 'LIST';

export type WorkspacePreferenceSort =
    | 'UPDATED_AT'
    | 'CREATED_AT'
    | 'NAME_ASC'
    | 'NAME_DESC';

export type UserPreferenceValue =
    | string
    | number
    | boolean
    | Record<string, unknown>
    | unknown[];

export type UserPreferenceValueType =
    | 'STRING'
    | 'NUMBER'
    | 'BOOLEAN'
    | 'OBJECT'
    | 'ARRAY';

export type UserPreferenceCategory =
    | 'APPEARANCE'
    | 'NOTES'
    | 'EDITOR'
    | 'NOTIFICATIONS'
    | 'PRIVACY'
    | 'ACCESSIBILITY';

export interface UserPreferenceRecord {
    _id: string;
    userId: string;
    key:
    | UserPreferenceKey
    | string;
    value: UserPreferenceValue;
    valueType: UserPreferenceValueType;
    category: UserPreferenceCategory;
    createdAt?: string;
    updatedAt?: string;
}

export interface UserPreferencesM {

    theme: UserTheme;
    workspaceView: WorkspacePreferenceView;
    workspaceSort: WorkspacePreferenceSort;
    defaultNoteColor: DefaultNoteColor;
    noteView: NoteView;
    autosaveEnabled: boolean;
    autosaveInterval: number;
    emailNotifications: boolean;
    pushNotifications: boolean;
    inAppNotifications: boolean;
    marketingEmails: boolean;
    profileVisible: boolean;
    showOnlineStatus: boolean;
    reduceMotion: boolean;
    highContrast: boolean;
}

export interface UpdateUserPreferenceItem {
    key: UserPreferenceKey;
    value: UserPreferenceValue;
}

export interface UpdateUserPreferencesPayload {
    preferences: UpdateUserPreferenceItem[];
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export type UserPreferencesResponseData =
    | UserPreferenceRecord[]
    | Partial<UserPreferencesM>
    | {
        preferences?: UserPreferenceRecord[];
        items?: UserPreferenceRecord[];
        rows?: UserPreferenceRecord[];
        records?: UserPreferenceRecord[];
    };


export const DEFAULT_USER_PREFERENCES:
    Readonly<UserPreferencesM> = {

    theme: 'SYSTEM',
    workspaceView: 'GRID',
    workspaceSort: 'UPDATED_AT',
    defaultNoteColor: 'YELLOW',
    noteView: 'GRID',
    autosaveEnabled: true,
    autosaveInterval: 5,
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    marketingEmails: false,
    profileVisible: true,
    showOnlineStatus: true,
    reduceMotion: false,
    highContrast: false,
};

export const USER_PREFERENCE_KEY_LIST =
    Object.values(
        USER_PREFERENCE_KEYS,
    ) as UserPreferenceKey[];