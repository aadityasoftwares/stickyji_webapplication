export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  LARGE_LIMIT: 100,
} as const;

export const STORAGE_KEYS = {
  DEVICE_ID: 'mysticky_device_id',
  SIDEBAR_COLLAPSED: 'mystickynotes.sidebar-collapsed',
  WORKSPACE_ID: 'mystickynotes.workspace-id',
  STICKY_NOTE_FONT: 'mystickynotes.note-font',
  STICKY_NOTE_FONT_SIZE: 'mystickynotes.note-font-size',
} as const;
