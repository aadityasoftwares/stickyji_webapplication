export const APP_ROUTES = {
    ROOT: '/',
    APP: '/app',
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    TODAY: '/app/today',
    WORKSPACES: '/app/workspaces/my',
    WORKSPACE_FOLDERS: '/app/workspacefolders/my',
    WORKSPACE_MEMBERS: '/app/workspace/members',
    ROLES_PERMISSIONS: '/app/workspace/roles-permissions',
    MY_NOTES: '/app/stickynotes/my',
    FAVORITE_NOTES: '/app/stickynotes/favorites',
    TRASH: '/app/stickynotes/trash',
    PROFILE: '/app/account/profile',
    PREFERENCES: '/app/account/preferences',
} as const;

export const routeCommands = (path: string): string[] => [path];
