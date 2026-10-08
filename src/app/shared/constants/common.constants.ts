import {
    LucideBell,
    LucideCircle,
    LucideFrame,
    LucideGrid2X2,
    LucideLayers,
    LucideLink,
    LucideList,
    LucideListChecks,
    LucidePanelsTopLeft,
    LucidePaperclip,
    LucideScissors,
    LucideSquare,
    LucideStickyNote,
    LucideTicket
} from "@lucide/angular";

export const VIEW = {
    KANBAN: 'kanban',
    TABLE: 'table',
    GRID: 'grid',
} as const;

export type View = (typeof VIEW)[keyof typeof VIEW];
export type ViewMode = View;

export const USER_PREFERENCE_KEYS = {
    THEME: 'theme',
    SELECTED_WORKSPACE_ID: 'selectedWorkspaceId',
    SELECTED_FOLDER_ID: 'selectedFolderId',
    DEFAULT_NOTE_COLOR: 'defaultNoteColor',
    WORKSPACE_VIEW: 'workspaceView',
    WORKSPACE_STATUS_FILTER: 'workspaceStatusFilter',
    WORKSPACE_SORT_ORDER: 'workspaceSortOrder',
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
    STICKY_NOTE_FONT: 'stickyNoteFont',
    STICKY_NOTE_SIZE: 'stickyNoteSize',
    STICKY_NOTE_FONT_SIZE: 'stickyNoteFontSize',
    STICKY_NOTE_LAYOUT: 'stickyNoteLayout',
} as const;

export const DEFAULT_USER_PREFERENCES: Readonly<any> = {
    theme: 'SYSTEM',
    selectedWorkspaceId: '',
    selectedFolderId: '',
    workspaceView: 'GRID',
    workspaceStatusFilter: 'ALL',
    workspaceSortOrder: 'RECENTLY_UPDATED',
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
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    locale: 'en-US',
    timeFormat: '12h',
    timezone: 'UTC',
    weekStartsOn: 'monday',
    stickyNoteFont: 'DM_SANS',
    stickyNoteFontSize: 14,
    stickyNoteLayout: 'DETAIL',
};

export const STICKY_NOTE_VIEW_OPTIONS: any[] = [
    {
        label: 'Kanban',
        value: VIEW.KANBAN,
        icon: LucidePanelsTopLeft,
        ariaLabel: 'Kanban view',
    },
    {
        label: 'Table',
        value: VIEW.TABLE,
        icon: LucideList,
        ariaLabel: 'Table view',
    },
];

export const VIEW_OPTIONS = STICKY_NOTE_VIEW_OPTIONS;

export const VIEW_TABS: any[] = [
    { value: 'grid', label: 'Grid', icon: LucideGrid2X2, ariaLabel: 'Grid view' },
    { value: 'list', label: 'List', icon: LucideList, ariaLabel: 'List view' },
];

export const GRID_LIST_VIEW_OPTIONS = VIEW_TABS;

export const COMMON_SORT_OPTIONS: any[] = [
    { label: 'Recently updated', value: 'recent' },
    { label: 'Name (A to Z)', value: 'name-asc' },
    { label: 'Name (Z to A)', value: 'name-desc' },
    { label: 'Oldest first', value: 'oldest' },
];

export const SORT_OPTIONS = COMMON_SORT_OPTIONS;

export const COMMON_STATUS_TABS: any[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
];

export const STATUS_TABS = COMMON_STATUS_TABS;

export function buildStatusTabs(counts: { all?: number; active?: number; archived?: number } = {}): any[] {
    return [
        { value: 'all', label: 'All', count: counts.all ?? 0 },
        { value: 'active', label: 'Active', count: counts.active ?? 0 },
        { value: 'archived', label: 'Archived', count: counts.archived ?? 0 },
    ];
}

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

export const STICKY_NOTE_COLORS = {
    WHITE: 'WHITE',
    YELLOW: 'YELLOW',
    ORANGE: 'ORANGE',
    PINK: 'PINK',
    RED: 'RED',
    GREEN: 'GREEN',
    BLUE: 'BLUE',
    PURPLE: 'PURPLE',
    BROWN: 'BROWN',
    BLACK: 'BLACK',
} as const;

export const STICKY_NOTE_COLOR_OPTIONS: any[] = [
    { label: 'White', value: 'WHITE', description: 'Neutral white paper', color: 'var(--app-select-swatch-white)' },
    { label: 'Yellow', value: 'YELLOW', description: 'Classic sticky yellow', color: 'var(--app-select-swatch-yellow)' },
    { label: 'Orange', value: 'ORANGE', description: 'Warm orange note', color: 'var(--app-select-swatch-orange)' },
    { label: 'Pink', value: 'PINK', description: 'Soft pink note', color: 'var(--app-select-swatch-pink)' },
    { label: 'Red', value: 'RED', description: 'Attention red note', color: 'var(--app-select-swatch-red)' },
    { label: 'Green', value: 'GREEN', description: 'Fresh green note', color: 'var(--app-select-swatch-green)' },
    { label: 'Blue', value: 'BLUE', description: 'Calm blue note', color: 'var(--app-select-swatch-blue)' },
    { label: 'Purple', value: 'PURPLE', description: 'Soft purple note', color: 'var(--app-select-swatch-purple)' },
    { label: 'Brown', value: 'BROWN', description: 'Earthy brown note', color: 'var(--app-select-swatch-brown)' },
    { label: 'Black', value: 'BLACK', description: 'Dark paper', color: 'var(--app-select-swatch-black)' },
];

export const NOTE_COLOR_OPTIONS = STICKY_NOTE_COLOR_OPTIONS;

export const STICKY_NOTE_SHAPES = {
    SQUARE: 'SQUARE',
    RECTANGLE: 'RECTANGLE',
    PORTRAIT: 'PORTRAIT',
    LANDSCAPE: 'LANDSCAPE',
    STRIP: 'STRIP',
} as const;

export const STICKY_NOTE_SHAPE_OPTIONS: any[] = [
    { label: 'Strip', value: 'STRIP', description: 'Narrow paper strip', icon: LucideFrame },
    { label: 'Square', value: 'SQUARE', description: 'Classic square note', icon: LucideSquare },
    { label: 'Rectangle', value: 'RECTANGLE', description: 'Rectangular note', icon: LucideFrame },
    { label: 'Portrait', value: 'PORTRAIT', description: 'Tall note', icon: LucideFrame },
    { label: 'Landscape', value: 'LANDSCAPE', description: 'Wide note', icon: LucideFrame },
];

export const STICKY_NOTE_VARIANTS = {
    PLAIN: 'PLAIN',
    ROUNDED: 'ROUNDED',
    SOFT: 'SOFT',
    FOLDED: 'FOLDED',
    CUT_CORNER: 'CUT_CORNER',
    TICKET: 'TICKET',
} as const;

export const STICKY_NOTE_VARIANT_OPTIONS: any[] = [
    { label: 'Plain', value: 'PLAIN', description: 'Simple paper edges', icon: LucideStickyNote },
    { label: 'Rounded', value: 'ROUNDED', description: 'Rounded corners', icon: LucideCircle },
    { label: 'Soft', value: 'SOFT', description: 'Soft modern edges', icon: LucideFrame },
    { label: 'Folded', value: 'FOLDED', description: 'Folded paper corner', icon: LucideLayers },
    { label: 'Cut corner', value: 'CUT_CORNER', description: 'Trimmed paper corner', icon: LucideScissors },
    { label: 'Ticket', value: 'TICKET', description: 'Ticket-style edges', icon: LucideTicket },
];

export const STICKY_NOTE_BACKGROUND_PATTERNS = {
    NONE: 'NONE',
    HORIZONTAL_LINES: 'HORIZONTAL_LINES',
    VERTICAL_LINES: 'VERTICAL_LINES',
    GRID: 'GRID',
} as const;

export const STICKY_NOTE_BACKGROUND_PATTERN_OPTIONS: any[] = [
    { label: 'None', value: 'NONE', description: 'Unprinted paper', icon: LucideSquare },
    { label: 'Horizontal lines', value: 'HORIZONTAL_LINES', description: 'Ruled paper', icon: LucideLayers },
    { label: 'Vertical lines', value: 'VERTICAL_LINES', description: 'Vertical ruling', icon: LucideFrame },
    { label: 'Grid', value: 'GRID', description: 'Grid paper', icon: LucidePanelsTopLeft },
];

export const NOTE_LIMITS = {
    BULK_UPDATE_MAX: 100,
    TITLE_MAX_LENGTH: 200,
    CONTENT_MAX_LENGTH: 10000,
    CHECKLIST_TITLE_MAX_LENGTH: 120,
    CHECKLIST_ITEM_TITLE_MAX_LENGTH: 300,
} as const;

export const COLUMN_LIMITS = {
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 50,
} as const;

export const STICKY_NOTE_COLUMN_TYPES = {
    TODO: 'TODO',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CUSTOM: 'CUSTOM',
} as const;

export const DATE_SORT_ORDER = {
    OLDEST_FIRST: 'OLDEST_FIRST',
    NEWEST_FIRST: 'NEWEST_FIRST',
} as const;

export const STICKY_NOTE_COLUMN_COLORS = {
    YELLOW: 'YELLOW',
    BLUE: 'BLUE',
    GREEN: 'GREEN',
    PINK: 'PINK',
    PURPLE: 'PURPLE',
    ORANGE: 'ORANGE',
} as const;

export const STICKY_NOTE_COLUMN_COLOR_OPTIONS: any[] = [
    { label: 'Yellow', value: 'YELLOW', description: 'Classic sticky yellow', color: 'var(--app-select-swatch-yellow)' },
    { label: 'Blue', value: 'BLUE', description: 'Calm blue note', color: 'var(--app-select-swatch-blue)' },
    { label: 'Green', value: 'GREEN', description: 'Fresh green note', color: 'var(--app-select-swatch-green)' },
    { label: 'Pink', value: 'PINK', description: 'Soft pink note', color: 'var(--app-select-swatch-pink)' },
    { label: 'Purple', value: 'PURPLE', description: 'Soft purple note', color: 'var(--app-select-swatch-purple)' },
    { label: 'Orange', value: 'ORANGE', description: 'Warm orange note', color: 'var(--app-select-swatch-orange)' },
];

export const COLUMN_COLOR_OPTIONS = STICKY_NOTE_COLUMN_COLOR_OPTIONS;

export const NOTE_BLOCK_TYPES = {
    CHECKLIST: 'CHECKLIST',
    REMINDER: 'REMINDER',
    ATTACHMENT: 'ATTACHMENT',
    LINK: 'LINK',
} as const;

export type NoteBlockType = (typeof NOTE_BLOCK_TYPES)[keyof typeof NOTE_BLOCK_TYPES];

export interface NoteBlockOption {
    type: NoteBlockType;
    label: string;
    description: string;
    icon: any;
}

export const NOTE_BLOCK_OPTIONS: readonly NoteBlockOption[] = [
    {
        type: NOTE_BLOCK_TYPES.CHECKLIST,
        label: 'Checklist',
        description: 'Add tasks you can check off',
        icon: LucideListChecks,
    },
    {
        type: NOTE_BLOCK_TYPES.REMINDER,
        label: 'Reminder',
        description: 'Get reminded about this note',
        icon: LucideBell,
    },
    {
        type: NOTE_BLOCK_TYPES.ATTACHMENT,
        label: 'Attachment',
        description: 'Add files or images',
        icon: LucidePaperclip,
    },
    {
        type: NOTE_BLOCK_TYPES.LINK,
        label: 'Link',
        description: 'Save a useful URL',
        icon: LucideLink,
    },
];
