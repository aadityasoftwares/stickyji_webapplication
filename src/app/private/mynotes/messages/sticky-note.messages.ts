export const STICKY_NOTE_MESSAGES = {
    SUCCESS: {
        ARCHIVED: 'The note was archived.',
        RESTORED: 'The note is active again.',
        RESTORED_FROM_TRASH: 'Note restored successfully.',
        MOVED_TO_TRASH: 'The note was moved to trash.',
        MOVED_TO_TRASH_WITH_RETENTION: 'Moved to Trash. You can restore this note for 60 days.',
        PERMANENTLY_DELETED: 'The note was permanently deleted.',
    },
    ERROR: {
        LOAD_FAILED: 'Unable to load notes for this folder.',
        TRASH_LOAD_FAILED: 'Unable to load sticky note trash.',
        ARCHIVE_FAILED: 'Unable to archive the note.',
        RESTORE_FAILED: 'Unable to restore the note.',
        DELETE_FAILED: 'Unable to delete the note.',
        PERMANENT_DELETE_FAILED: 'Unable to permanently delete note.',
        MOVE_TO_TRASH_FAILED: 'Unable to move note to Trash.',
        RENAME_FAILED: 'Unable to rename the note.',
        DESCRIPTION_UPDATE_FAILED: 'Unable to update the note description.',
        REORDER_FAILED: 'Unable to reorder notes.',
        CHECKLIST_UPDATE_FAILED: 'Unable to update the checklist item.',
        WORKSPACES_LOAD_FAILED: 'Unable to load your workspaces.',
        FOLDERS_LOAD_FAILED: 'Unable to load folders for this workspace.',
    },
    VALIDATION: {
        FOLDER_REQUIRED: 'Select a folder before creating a note.',
        COLUMN_REQUIRED: 'This folder does not have a note column yet.',
    },
} as const;
