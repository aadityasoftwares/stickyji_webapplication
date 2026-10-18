export const WORKSPACE_FOLDER_MESSAGES = {
  SUCCESS: {
    CREATED: 'Folder created successfully.',
    CHANGES_SAVED: 'Folder changes were saved.',
    RENAMED: (name: string) => `Folder renamed to “${name}”.`,
    MOVED_TO_TRASH: (name: string) => `“${name}” moved to trash.`,
    RESTORED: (name: string) => `“${name}” was restored.`,
    ARCHIVED: (name: string) => `“${name}” was archived.`,
    ACTIVATED: (name: string) => `“${name}” is active again.`,
  },
  ERROR: {
    LOAD_FAILED: 'Unable to load workspace folders.',
    CREATE_FAILED: 'Unable to create folder.',
    RENAME_FAILED: 'Unable to rename folder.',
    MOVE_TO_TRASH_FAILED: 'Unable to move folder to trash.',
    RESTORE_FAILED: 'Unable to restore folder.',
    UPDATE_FAILED: 'Unable to update folder.',
  },
  VALIDATION: {
    WORKSPACE_REQUIRED: 'Select a workspace before creating a folder.',
    NAME_REQUIRED: 'Folder name cannot be empty.',
    DEFAULT_MUST_REMAIN_ACTIVE: 'The default folder must remain active.',
    DEFAULT_CANNOT_DELETE: 'The default folder cannot be moved to trash.',
  },
} as const;
