export const WORKSPACE_MESSAGES = {
    SUCCESS: {
        RENAMED: 'Workspace renamed successfully.',
        MOVED_TO_TRASH: (name: string) => `“${name}” moved to trash.`,
        ARCHIVED: (name: string) => `“${name}” has been archived.`,
        ACTIVATED: (name: string) => `“${name}” is active again.`,
        RESTORED: (name: string) => `“${name}” restored successfully.`,
        RESTORED_FROM_TRASH: 'Workspace restored successfully.',
        PERMANENTLY_DELETED: 'The workspace was permanently deleted.',
    },
    ERROR: {
        LOAD_FAILED: 'Unable to load your workspaces right now.',
        TRASH_LOAD_FAILED: 'Unable to load workspace trash right now.',
        RENAME_FAILED: 'Could not rename this workspace.',
        MOVE_TO_TRASH_FAILED: 'Unable to move workspace to trash.',
        RESTORE_FAILED: 'Unable to restore workspace.',
        STATUS_UPDATE_FAILED: 'Unable to update workspace status.',
        PERMANENT_DELETE_FAILED: 'Unable to permanently delete workspace.',
    },
} as const;

