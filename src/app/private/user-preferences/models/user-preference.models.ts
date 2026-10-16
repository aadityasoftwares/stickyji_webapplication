import { DEFAULT_USER_PREFERENCES as SHARED_DEFAULT_USER_PREFERENCES } from '../../../shared/constants/common.constants';

export const USER_PREFERENCE_KEYS = {
    THEME: 'theme',
    SELECTED_WORKSPACE_ID: 'selectedWorkspaceId',
    SELECTED_FOLDER_ID: 'selectedFolderId',
    DEFAULT_NOTE_COLOR: 'defaultNoteColor',
    NOTE_VIEW: 'noteView',
    TODAY_VIEW: 'todayView',
    OVERDUE_VIEW: 'overdueView',
    WORKSPACE_VIEW: 'workspaceView',
    WORKSPACE_STATUS_FILTER: 'workspaceStatusFilter',
    WORKSPACE_ACCESS_FILTER: 'workspaceAccessFilter',
    WORKSPACE_SORT_ORDER: 'workspaceSortOrder',
    WORKSPACE_FOLDER_STATUS_FILTER: 'workspaceFolderStatusFilter',
    WORKSPACE_FOLDER_SORT_ORDER: 'workspaceFolderSortOrder',
    WORKSPACE_FOLDER_VIEW: 'workspaceFolderView',
    WORKSPACE_MEMBER_STATUS_FILTER: 'workspaceMemberStatusFilter',
    WORKSPACE_MEMBER_SORT_ORDER: 'workspaceMemberSortOrder',
    WORKSPACE_MEMBER_VIEW: 'workspaceMemberView',
    WORKSPACE_ROLE_STATUS_FILTER: 'workspaceRoleStatusFilter',
    WORKSPACE_ROLE_SORT_ORDER: 'workspaceRoleSortOrder',
    WORKSPACE_ROLE_VIEW: 'workspaceRoleView',
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
    DATE_FORMAT: 'dateFormat',
    LANGUAGE: 'language',
    LOCALE: 'locale',
    TIME_FORMAT: 'timeFormat',
    TIMEZONE: 'timezone',
    WEEK_STARTS_ON: 'weekStartsOn',
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
    | 'TABLE'
    | 'KANBAN';

export type TodayPreferenceView = 'KANBAN' | 'TABLE';
export type OverduePreferenceView = 'BAR' | 'BUTTON';

export type WorkspacePreferenceView =
    | 'GRID'
    | 'LIST';

export type WorkspacePreferenceStatusFilter =
    | 'ALL'
    | 'ACTIVE'
    | 'ARCHIVED'
    | 'TRASHED';

export type WorkspacePreferenceAccessFilter =
    | 'ALL'
    | 'OWNED'
    | 'SHARED';

export type WorkspacePreferenceSortOrder =
    | 'RECENTLY_UPDATED'
    | 'RECENTLY_CREATED'
    | 'NAME_ASC'
    | 'NAME_DESC'
    | 'OLDEST_FIRST';

export type WorkspaceMemberPreferenceView =
    | 'GRID'
    | 'LIST';

export type WorkspaceMemberPreferenceStatusFilter =
    | 'ALL'
    | 'ACTIVE'
    | 'INVITED'
    | 'INVITATIONS'
    | 'REMOVED';

export type WorkspaceMemberPreferenceSortOrder =
    | 'RECENTLY_UPDATED'
    | 'RECENTLY_CREATED'
    | 'NAME_ASC'
    | 'NAME_DESC'
    | 'OLDEST_FIRST'
    | 'ROLE'
    | 'ROLE_ASC';

export type WorkspaceRolePreferenceView =
    | 'GRID'
    | 'LIST';

export type WorkspaceRolePreferenceStatusFilter =
    | 'ALL'
    | 'SYSTEM'
    | 'CUSTOM'
    | 'INACTIVE';

export type WorkspaceRolePreferenceSortOrder =
    | 'PRIORITY'
    | 'ROLE_LEVEL'
    | 'RECENTLY_UPDATED'
    | 'UPDATED_AT'
    | 'NAME_ASC'
    | 'NAME'
    | 'RECENTLY_CREATED'
    | 'CREATED_AT'
    | 'NAME_DESC'
    | 'OLDEST_FIRST';


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
    | 'WORKSPACE'
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
    selectedWorkspaceId?: string;
    selectedFolderId?: string;
    workspaceView: WorkspacePreferenceView;
    workspaceStatusFilter: WorkspacePreferenceStatusFilter;
    workspaceAccessFilter: WorkspacePreferenceAccessFilter;
    workspaceSortOrder: WorkspacePreferenceSortOrder;
    workspaceMemberView?: WorkspaceMemberPreferenceView;
    workspaceMemberStatusFilter?: WorkspaceMemberPreferenceStatusFilter;
    workspaceMemberSortOrder?: WorkspaceMemberPreferenceSortOrder;
    workspaceRoleView?: WorkspaceRolePreferenceView;
    workspaceRoleStatusFilter?: WorkspaceRolePreferenceStatusFilter;
    workspaceRoleSortOrder?: WorkspaceRolePreferenceSortOrder;
    defaultNoteColor: DefaultNoteColor;
    noteView: NoteView;
    todayView: TodayPreferenceView;
    overdueView: OverduePreferenceView;
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
    dateFormat: string;
    language: string;
    locale: string;
    timeFormat: '12h' | '24h';
    timezone: string;
    weekStartsOn: string;
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
    selectedWorkspaceId: '',
    selectedFolderId: '',
    workspaceView: 'GRID',
    workspaceStatusFilter: 'ALL',
    workspaceAccessFilter: 'ALL',
    workspaceSortOrder: 'RECENTLY_UPDATED',
    workspaceMemberView: 'GRID',
    workspaceMemberStatusFilter: 'ALL',
    workspaceMemberSortOrder: 'RECENTLY_UPDATED',
    workspaceRoleView: 'GRID',
    workspaceRoleStatusFilter: 'ALL',
    workspaceRoleSortOrder: 'PRIORITY',
    defaultNoteColor: 'YELLOW',
    noteView: 'GRID',
    todayView: 'KANBAN',
    overdueView: 'BAR',
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
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    locale: 'en-US',
    timeFormat: '12h',
    timezone: SHARED_DEFAULT_USER_PREFERENCES['timezone'],
    weekStartsOn: 'monday',
};

export const USER_PREFERENCE_KEY_LIST =
    Object.values(
        USER_PREFERENCE_KEYS,
    ) as UserPreferenceKey[];
