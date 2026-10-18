export const TODAY_MESSAGES = {
  SUCCESS: {
    COLUMNS_REORDERED: 'Columns rearranged successfully.',
  },
  ERROR: {
    NETWORK: 'Please check your internet connection and try again.',
    WORKSPACES_LOAD_FAILED: 'Unable to load your workspaces.',
    FOLDERS_LOAD_FAILED: 'Unable to load folders for this workspace.',
    COLUMNS_LOAD_FAILED: 'Unable to load columns.',
    COLUMNS_REORDER_FAILED: 'Unable to rearrange columns.',
    NOTES_LOAD_FAILED: 'Unable to load notes for today.',
    NOTE_MOVE_FAILED: 'Unable to move note.',
  },
  EMPTY: {
    NO_WORKSPACE: 'Create a workspace to start organizing your notes.',
    NO_WORKSPACE_SELECTED: "Select a workspace to see today's notes.",
    NO_FOLDERS: 'Create a folder to organize your notes.',
    NO_FOLDER_SELECTED: 'Select a folder to see its Kanban board and list.',
    NO_NOTES: 'Create your first note to get started.',
    NO_SEARCH_RESULTS: 'Try changing your search or clear it to see all notes.',
  },
} as const;
