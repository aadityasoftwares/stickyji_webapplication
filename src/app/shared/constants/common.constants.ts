import { LucideList, LucidePanelsTopLeft } from "@lucide/angular";

export const USER_PREFERENCE_KEYS = {
    THEME: 'theme',
    SELECTED_WORKSPACE_ID: 'selectedWorkspaceId',
    DEFAULT_NOTE_COLOR: 'defaultNoteColor',
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
    STICKY_NOTE_FONT: 'stickyNoteFont',
    STICKY_NOTE_SIZE: 'stickyNoteSize',
    STICKY_NOTE_FONT_SIZE: 'stickyNoteFontSize',
    STICKY_NOTE_LAYOUT: 'stickyNoteLayout',
} as const;

export const DEFAULT_USER_PREFERENCES: Readonly<any> = {
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

export const STICKY_NOTE_LAYOUT_OPTIONS: any[] = [
    {
        label: 'Compact',
        value: 'COMPACT',
        icon: LucideList,
    },
    {
        label: 'Detail',
        value: 'DETAIL',
        icon: LucidePanelsTopLeft,
    },
];

export const STICKY_NOTE_FONT_OPTIONS: any[] = [
    { label: 'Clean · DM Sans', value: 'DM_SANS', family: '"DM Sans", sans-serif' },
    { label: 'Caveat', value: 'CAVEAT', family: '"Caveat", cursive' },
    { label: 'Patrick Hand', value: 'PATRICK_HAND', family: '"Patrick Hand", cursive' },
    { label: 'Kalam', value: 'KALAM', family: '"Kalam", cursive' },
    { label: 'Architects Daughter', value: 'ARCHITECTS_DAUGHTER', family: '"Architects Daughter", cursive' },
    { label: 'Indie Flower', value: 'INDIE_FLOWER', family: '"Indie Flower", cursive' },
    { label: 'Nanum Pen', value: 'NANUM_PEN', family: '"Nanum Pen Script", cursive' },
    { label: 'Shadows Into Light', value: 'SHADOWS_INTO_LIGHT', family: '"Shadows Into Light", cursive' },
    { label: 'Comic Neue', value: 'COMIC_NEUE', family: '"Comic Neue", cursive' },
    { label: 'Sriracha', value: 'SRIRACHA', family: '"Sriracha", cursive' },
    { label: 'Short Stack', value: 'SHORT_STACK', family: '"Short Stack", cursive' },
    { label: 'Gochi Hand', value: 'GOCHI_HAND', family: '"Gochi Hand", cursive' },
];

export const STICKY_NOTE_FONT_SIZE_OPTIONS: any[] = [
    { label: '13 px', value: 13 },
    { label: '14 px', value: 14 },
    { label: '15 px', value: 15 },
    { label: '16 px', value: 16 },
];