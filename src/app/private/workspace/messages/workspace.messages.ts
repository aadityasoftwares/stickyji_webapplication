export const WORKSPACE_MESSAGES = {
    SUCCESS: {
        RENAMED: 'Workspace renamed successfully.',
        MOVED_TO_TRASH: (name: string) => `“${name}” moved to trash.`,
        ARCHIVED: (name: string) => `“${name}” has been archived.`,
        ACTIVATED: (name: string) => `“${name}” is active again.`,
    },
    ERROR: {
        LOAD_FAILED: 'Unable to load your workspaces right now.',
        RENAME_FAILED: 'Could not rename this workspace.',
        MOVE_TO_TRASH_FAILED: 'Unable to move workspace to trash.',
        STATUS_UPDATE_FAILED: 'Unable to update workspace status.',
    },
} as const;
