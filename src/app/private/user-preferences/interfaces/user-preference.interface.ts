import type { USER_PREFERENCE_KEYS } from '../../../shared/constants/common.constants';

export type UserPreferenceKey = (typeof USER_PREFERENCE_KEYS)[keyof typeof USER_PREFERENCE_KEYS];

export type UserTheme = 'SYSTEM' | 'LIGHT' | 'DARK';

export type DefaultNoteColor =
  'YELLOW' | 'ORANGE' | 'PINK' | 'RED' | 'GREEN' | 'BLUE' | 'PURPLE' | 'BROWN' | 'BLACK';

export type DefaultNoteShape = 'STRIP' | 'SQUARE' | 'RECTANGLE' | 'PORTRAIT' | 'LANDSCAPE' | string;

export type DefaultNoteVariant =
  'PLAIN' | 'ROUNDED' | 'SOFT' | 'FOLDED' | 'CUT_CORNER' | 'TICKET' | string;

export type DefaultNoteBackgroundPattern =
  'NONE' | 'HORIZONTAL_LINES' | 'VERTICAL_LINES' | 'GRID' | string;

export type NoteView = 'GRID' | 'LIST' | 'TABLE' | 'KANBAN';

export type TodayPreferenceView = 'NOTES' | 'KANBAN' | 'TABLE';
export type OverduePreferenceView = 'BAR' | 'BUTTON';

export type WorkspacePreferenceView = 'GRID' | 'LIST';

export type WorkspacePreferenceStatusFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED' | 'TRASHED';

export type WorkspacePreferenceAccessFilter = 'ALL' | 'OWNED' | 'SHARED';

export type WorkspacePreferenceSortOrder =
  'RECENTLY_UPDATED' | 'RECENTLY_CREATED' | 'NAME_ASC' | 'NAME_DESC' | 'OLDEST_FIRST';

export type WorkspaceMemberPreferenceView = 'GRID' | 'LIST';

export type WorkspaceMemberPreferenceStatusFilter =
  'ALL' | 'ACTIVE' | 'INVITED' | 'INVITATIONS' | 'REMOVED';

export type WorkspaceMemberPreferenceSortOrder =
  | 'RECENTLY_UPDATED'
  | 'RECENTLY_CREATED'
  | 'NAME_ASC'
  | 'NAME_DESC'
  | 'OLDEST_FIRST'
  | 'ROLE'
  | 'ROLE_ASC';

export type WorkspaceRolePreferenceView = 'GRID' | 'LIST';

export type WorkspaceRolePreferenceStatusFilter = 'ALL' | 'SYSTEM' | 'CUSTOM' | 'INACTIVE';

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

export type UserPreferenceValue = string | number | boolean | Record<string, unknown> | unknown[];

export type UserPreferenceValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'OBJECT' | 'ARRAY';

export type UserPreferenceCategory =
  'APPEARANCE' | 'WORKSPACE' | 'NOTES' | 'EDITOR' | 'NOTIFICATIONS' | 'PRIVACY' | 'ACCESSIBILITY';

export interface UserPreferenceRecord {
  _id: string;
  userId: string;
  key: UserPreferenceKey | string;
  value: UserPreferenceValue;
  valueType: UserPreferenceValueType;
  category: UserPreferenceCategory;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreferences {
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
  defaultNoteShape?: DefaultNoteShape;
  defaultNoteVariant?: DefaultNoteVariant;
  defaultNoteBackgroundPattern?: DefaultNoteBackgroundPattern;
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

export type UserPreferencesResponseData =
  | UserPreferenceRecord[]
  | Partial<UserPreferences>
  | {
      preferences?: UserPreferenceRecord[];
      items?: UserPreferenceRecord[];
      rows?: UserPreferenceRecord[];
      records?: UserPreferenceRecord[];
    };
