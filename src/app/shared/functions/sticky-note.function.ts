import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import type { BadgeVariant } from '../components/badge/badge';
import type { SidePanelTone } from '../components/side-panel/side-panel';
import type { SelectOption } from '../components/select/select';
import { NOTE_LIMITS } from '../constants/common.constants';
import { idOf } from './common.function';

/**
 * Map of note/column color names to corresponding badge variants.
 */
export const NOTE_COLOR_BADGE_VARIANT_MAP: Readonly<Record<string, BadgeVariant>> = {
  WHITE: 'neutral',
  YELLOW: 'noteYellow',
  ORANGE: 'noteOrange',
  PINK: 'notePink',
  RED: 'noteRed',
  GREEN: 'noteGreen',
  BLUE: 'noteBlue',
  PURPLE: 'notePurple',
  BROWN: 'noteBrown',
  BLACK: 'noteBlack'
};

/**
 * Returns the badge variant matching the provided color name, or 'neutral' by default.
 *
 * @param color Color name string (e.g. 'YELLOW', 'PINK', etc.)
 * @returns BadgeVariant
 */
export function getNoteColorBadgeVariant(color?: any): BadgeVariant {
  try {
    if (!color) {
      return 'neutral';
    }
    const key = String(color).trim().toUpperCase();
    return NOTE_COLOR_BADGE_VARIANT_MAP[key] ?? 'neutral';
  } catch (error) {
    console.error('Error in getNoteColorBadgeVariant:', error);
    return 'neutral';
  }
}

/**
 * Returns the side panel tone corresponding to a note color.
 *
 * @param color Note color string (e.g. 'yellow', 'blue', etc.)
 * @returns SidePanelTone ('paper' by default)
 */
export function getNotePanelTone(color?: any): SidePanelTone {
  try {
    const normalized = String(color ?? '').trim().toLowerCase();
    if (['yellow', 'blue', 'pink', 'green', 'purple'].includes(normalized)) {
      return normalized as SidePanelTone;
    }
    return 'paper';
  } catch (error) {
    console.error('Error in getNotePanelTone:', error);
    return 'paper';
  }
}

/**
 * Resolves the folder ID to select, prioritizing the preferred ID if present in the folders list,
 * followed by the default folder, and finally falling back to the first available non-deleted folder.
 *
 * @param folders List of workspace folders.
 * @param preferredFolderId Optional preferred folder ID.
 * @returns Resolved folder ID or empty string.
 */
export function resolveDefaultFolderId(
  folders: any,
  preferredFolderId?: any
): string {
  try {
    if (!folders || !Array.isArray(folders) || folders.length === 0) {
      return '';
    }

    const validFolders = folders.filter((folder: any) => folder && folder?.status !== 'DELETED');
    if (validFolders.length === 0) {
      return '';
    }

    const preferred = preferredFolderId ? String(preferredFolderId).trim() : '';
    if (preferred && validFolders.some((folder: any) => idOf(folder) === preferred)) {
      return preferred;
    }

    const defaultFolder = validFolders.find((folder: any) => folder?.isDefault) ?? validFolders[0];
    return idOf(defaultFolder);
  } catch (error) {
    console.error('Error in resolveDefaultFolderId:', error);
    return '';
  }
}

/**
 * Resolves the column ID to select, prioritizing the preferred ID if present in the columns list,
 * followed by the first non-COMPLETED column, and finally falling back to the first available column.
 *
 * @param columns List of columns.
 * @param preferredColumnId Optional preferred column ID.
 * @returns Resolved column ID or empty string.
 */
export function resolveDefaultColumnId(
  columns: any,
  preferredColumnId?: any
): string {
  try {
    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return '';
    }

    const validColumns = columns.filter((col: any) => col && col?.status !== 'DELETED');
    if (validColumns.length === 0) {
      return '';
    }

    const preferred = preferredColumnId ? String(preferredColumnId).trim() : '';
    if (preferred && validColumns.some((column: any) => idOf(column) === preferred)) {
      return preferred;
    }

    const defaultColumn = validColumns.find((column: any) => column?.type !== 'COMPLETED') ?? validColumns[0];
    return idOf(defaultColumn);
  } catch (error) {
    console.error('Error in resolveDefaultColumnId:', error);
    return '';
  }
}

/**
 * Single checklist item representation for validation.
 */
export interface NoteChecklistValidationItem {
  title?: any;
  items?: any;
}

/**
 * Validates a collection of note checklists:
 * - Ensures there is at least one checklist
 * - Enforces title presence and max length
 * - Checks for duplicate checklist titles
 * - Ensures every checklist has at least one item
 * - Enforces item title presence and max length
 * - Checks for duplicate items within each checklist
 *
 * @param checklists Array of checklists to validate.
 * @param limits Optional max length overrides.
 * @returns Error message string if invalid, or null if valid.
 */
export function validateNoteChecklists(
  checklists?: any,
  limits: any = {}
): string | null {
  try {
    if (!checklists || !Array.isArray(checklists) || checklists.length === 0) {
      return 'Add at least one checklist.';
    }

    const maxTitleLength = Number(limits?.checklistTitleMaxLength) || NOTE_LIMITS.CHECKLIST_TITLE_MAX_LENGTH;
    const maxItemLength = Number(limits?.checklistItemTitleMaxLength) || NOTE_LIMITS.CHECKLIST_ITEM_TITLE_MAX_LENGTH;
    const listTitles = new Set<string>();

    for (let i = 0; i < checklists.length; i++) {
      const list = checklists[i];
      const title = String(list?.title ?? '').trim();

      if (!title) {
        return `Enter a title for checklist ${i + 1}.`;
      }

      if (title.length > maxTitleLength) {
        return `Checklist titles must be at most ${maxTitleLength} characters.`;
      }

      const normalizedTitle = title.toLowerCase();
      if (listTitles.has(normalizedTitle)) {
        return `Checklist "${title}" is repeated. Use a different title.`;
      }
      listTitles.add(normalizedTitle);

      const items = Array.isArray(list?.items) ? list.items : [];
      if (items.length === 0) {
        return `Add at least one item to "${title}".`;
      }

      const itemTitles = new Set<string>();
      for (let j = 0; j < items.length; j++) {
        const itemTitle = String(items[j]?.title ?? '').trim();

        if (!itemTitle) {
          return `Fill or remove empty items from "${title}" before saving.`;
        }

        if (itemTitle.length > maxItemLength) {
          return `Checklist items must be at most ${maxItemLength} characters.`;
        }

        const normalizedItem = itemTitle.toLowerCase();
        if (itemTitles.has(normalizedItem)) {
          return `"${itemTitle}" is repeated inside "${title}".`;
        }
        itemTitles.add(normalizedItem);
      }
    }

    return null;
  } catch (error) {
    console.error('Error in validateNoteChecklists:', error);
    return null;
  }
}

/**
 * Input structure for validating note form fields.
 */
export interface NoteFormValidationInput {
  workspaceId: any;
  workspaceFolderId: any;
  columnId: any;
  title: any;
  content: any;
  color: any;
  shape: any;
  variant: any;
  backgroundPattern: any;
  withChecklist: any;
  checklists?: any;
  colorOptions?: any;
  shapeOptions?: any;
  variantOptions?: any;
  backgroundPatternOptions?: any;
  titleMaxLength?: any;
  contentMaxLength?: any;
  checklistTitleMaxLength?: any;
  checklistItemTitleMaxLength?: any;
}

/**
 * Validates note form fields before persisting.
 *
 * @param input Note form values and configuration.
 * @returns Error message string or null if validation passes.
 */
export function validateNoteForm(
  input: any
): string | null {
  try {
    if (!input || typeof input !== 'object') {
      return null;
    }

    const workspaceId = String(input.workspaceId ?? '').trim();
    if (!workspaceId) {
      return 'Choose a workspace for this note.';
    }

    const folderId = String(input.workspaceFolderId ?? '').trim();
    if (!folderId) {
      return 'Choose a folder for this note.';
    }

    const content = String(input.content ?? '').trim();
    if (!content) {
      return 'Write some details before saving your note.';
    }

    const title = String(input.title ?? '');
    const titleMax = Number(input.titleMaxLength) || NOTE_LIMITS.TITLE_MAX_LENGTH;
    if (title.length > titleMax) {
      return `Title must be at most ${titleMax} characters.`;
    }

    const contentMax = Number(input.contentMaxLength) || NOTE_LIMITS.CONTENT_MAX_LENGTH;
    if (content.length > contentMax) {
      return `Details must be at most ${contentMax} characters.`;
    }

    const columnId = String(input.columnId ?? '').trim();
    if (!columnId) {
      return 'Choose a column for this note.';
    }

    if (Array.isArray(input.colorOptions) && input.colorOptions.length > 0) {
      const inputColor = String(input.color ?? '').trim().toUpperCase();
      if (!input.colorOptions.some((o: any) => String(o?.value ?? '').trim().toUpperCase() === inputColor)) {
        return 'Choose a valid note color.';
      }
    }

    if (Array.isArray(input.shapeOptions) && input.shapeOptions.length > 0) {
      const inputShape = String(input.shape ?? '').trim().toUpperCase();
      if (!input.shapeOptions.some((o: any) => String(o?.value ?? '').trim().toUpperCase() === inputShape)) {
        return 'Choose a valid note shape.';
      }
    }

    if (Array.isArray(input.variantOptions) && input.variantOptions.length > 0) {
      const inputVariant = String(input.variant ?? '').trim().toUpperCase();
      if (!input.variantOptions.some((o: any) => String(o?.value ?? '').trim().toUpperCase() === inputVariant)) {
        return 'Choose a valid paper style.';
      }
    }

    if (Array.isArray(input.backgroundPatternOptions) && input.backgroundPatternOptions.length > 0) {
      const inputPattern = String(input.backgroundPattern ?? '').trim().toUpperCase();
      if (!input.backgroundPatternOptions.some((o: any) => String(o?.value ?? '').trim().toUpperCase() === inputPattern)) {
        return 'Choose a valid background pattern.';
      }
    }

    if (input.withChecklist) {
      return validateNoteChecklists(input.checklists ?? [], {
        checklistTitleMaxLength: input.checklistTitleMaxLength,
        checklistItemTitleMaxLength: input.checklistItemTitleMaxLength
      });
    }

    return null;
  } catch (error) {
    console.error('Error in validateNoteForm:', error);
    return null;
  }
}

/**
 * Factory for creating a checklist FormGroup.
 * Supports initialization from raw objects or existing FormControls.
 *
 * @param fb FormBuilder instance.
 * @param value Initial data for checklist and its items.
 * @param limits Optional maxLength configuration.
 * @returns FormGroup
 */
export function createChecklistFormGroup(
  fb: any,
  value: any = {},
  limits: any = {}
): FormGroup {
  try {
    const titleMaxLength = Number(limits?.checklistTitleMaxLength) || NOTE_LIMITS.CHECKLIST_TITLE_MAX_LENGTH;
    const itemMaxLength = Number(limits?.checklistItemTitleMaxLength) || NOTE_LIMITS.CHECKLIST_ITEM_TITLE_MAX_LENGTH;

    const rawItems = value?.get
      ? (value.get('items') as any)?.controls ?? []
      : Array.isArray(value?.items) ? value.items : [];

    const items = Array.isArray(rawItems) && rawItems.length > 0
      ? rawItems.map((item: any) =>
        createChecklistItemFormGroup(fb, {
          id: item?.get ? item.get('id')?.value : idOf(item),
          title: item?.get ? item.get('title')?.value : (item?.title ?? ''),
          isCompleted: (item?.get ? item.get('isCompleted')?.value : item?.isCompleted) === true,
          initialCompleted: (item?.get
            ? item.get('initialCompleted')?.value
            : (item?.initialCompleted ?? item?.isCompleted)) === true
        }, itemMaxLength)
      )
      : [createChecklistItemFormGroup(fb, {}, itemMaxLength)];

    const id = value?.get ? value.get('id')?.value : (value?.id ?? '');
    const title = value?.get ? value.get('title')?.value : (value?.title ?? '');

    return fb.group({
      id: [id],
      title: [title, Validators.maxLength(titleMaxLength)],
      items: fb.array(items)
    });
  } catch (error) {
    console.error('Error in createChecklistFormGroup:', error);
    return fb.group({
      id: [''],
      title: [''],
      items: fb.array([])
    });
  }
}

/**
 * Factory for creating a checklist item FormGroup.
 * Supports initialization from raw objects or existing FormControls.
 *
 * @param fb FormBuilder instance.
 * @param value Initial data for checklist item.
 * @param checklistItemTitleMaxLength Optional maxLength.
 * @returns FormGroup
 */
export function createChecklistItemFormGroup(
  fb: any,
  value: any = {},
  checklistItemTitleMaxLength: any = NOTE_LIMITS.CHECKLIST_ITEM_TITLE_MAX_LENGTH
): FormGroup {
  try {
    const maxLength = Number(checklistItemTitleMaxLength) || NOTE_LIMITS.CHECKLIST_ITEM_TITLE_MAX_LENGTH;
    const id = value?.get ? value.get('id')?.value : (value?.id ?? '');
    const title = value?.get ? value.get('title')?.value : (value?.title ?? '');
    const isCompleted = (value?.get ? value.get('isCompleted')?.value : value?.isCompleted) === true;
    const initialCompleted = (value?.get
      ? value.get('initialCompleted')?.value
      : (value?.initialCompleted ?? isCompleted)) === true;

    return fb.group({
      id: [id],
      title: [title, Validators.maxLength(maxLength)],
      isCompleted: [isCompleted],
      initialCompleted: [initialCompleted]
    });
  } catch (error) {
    console.error('Error in createChecklistItemFormGroup:', error);
    return fb.group({
      id: [''],
      title: [''],
      isCompleted: [false],
      initialCompleted: [false]
    });
  }
}

/**
 * Formats checklist FormGroups or plain checklist objects into a preview-ready data structure for live preview cards.
 *
 * @param checklistGroups Array of checklist FormGroups or objects.
 * @returns Array of formatted preview checklists.
 */
export function formatLivePreviewChecklists(
  checklistGroups?: any
): any[] {
  try {
    if (!checklistGroups || !Array.isArray(checklistGroups)) {
      return [];
    }

    return checklistGroups.map((group: any, index: number) => {
      if (!group) {
        return null;
      }

      const rawItems = group?.get
        ? (group.get('items') as any)?.controls ?? []
        : Array.isArray(group?.items) ? group.items : [];

      const items = (Array.isArray(rawItems) ? rawItems : []).map((control: any, itemIndex: number) => {
        const itemTitle = control?.get ? control.get('title')?.value : control?.title;
        const isCompleted = control?.get ? control.get('isCompleted')?.value : control?.isCompleted;

        return {
          id: `preview-item-${index}-${itemIndex}`,
          title: String(itemTitle ?? ''),
          isCompleted: isCompleted === true
        };
      });

      const groupTitle = String((group?.get ? group.get('title')?.value : group?.title) ?? '');

      return {
        id: `preview-list-${index}`,
        title: groupTitle,
        items,
        totalCount: items.length,
        completedCount: items.filter((item: any) => item?.isCompleted === true).length
      };
    }).filter(Boolean) as any[];
  } catch (error) {
    console.error('Error in formatLivePreviewChecklists:', error);
    return [];
  }
}

/**
 * Map of note/column color names to CSS color variables or fallback values.
 */
export const STICKY_NOTE_COLOR_ACCENTS: Readonly<Record<string, string>> = {
  YELLOW: 'var(--note-yellow, #eab308)',
  BLUE: 'var(--note-blue, #3b82f6)',
  GREEN: 'var(--note-green, #22c55e)',
  PINK: 'var(--note-pink, #ec4899)',
  PURPLE: 'var(--note-purple, #a855f7)',
  ORANGE: 'var(--note-orange, #f97316)',
  RED: 'var(--note-red, #ef4444)',
  BROWN: 'var(--note-brown, #92400e)',
  BLACK: 'var(--note-black, #171717)',
  WHITE: 'var(--note-white, #f8fafc)'
};

/**
 * Returns the CSS accent color corresponding to a note or column color.
 *
 * @param color Color name string (e.g. 'YELLOW', 'BLUE').
 * @returns CSS color variable or hex string.
 */
export function getNoteColorAccent(color?: any): string {
  try {
    const key = String(color || 'YELLOW').trim().toUpperCase();
    return STICKY_NOTE_COLOR_ACCENTS[key] ?? STICKY_NOTE_COLOR_ACCENTS['YELLOW'];
  } catch (error) {
    console.error('Error in getNoteColorAccent:', error);
    return STICKY_NOTE_COLOR_ACCENTS['YELLOW'];
  }
}

/**
 * Returns a human-friendly column eyebrow label based on column type.
 *
 * @param type Column type ('COMPLETED', 'IN_PROGRESS', 'TODO', 'CUSTOM', etc.)
 * @returns Eyebrow label string ('Completed', 'In progress', 'To do', 'Note').
 */
export function getNoteColumnEyebrow(type?: any): string {
  try {
    switch (String(type ?? '').toUpperCase()) {
      case 'COMPLETED':
        return 'Completed';
      case 'IN_PROGRESS':
        return 'In progress';
      case 'TODO':
        return 'To do';
      default:
        return 'Note';
    }
  } catch (error) {
    console.error('Error in getNoteColumnEyebrow:', error);
    return 'Note';
  }
}

/**
 * Normalizes an array of checklists for notes:
 * Filters out DELETED lists and items, sorts by position ascending,
 * and attaches calculated item counts.
 *
 * @param checklists Array of checklist entities.
 * @returns Array of mapped checklists with totalCount and completedCount.
 */
export function mapStickyNoteChecklists(checklists: any): any[] {
  try {
    if (!checklists || !Array.isArray(checklists)) {
      return [];
    }

    return [...checklists]
      .filter((checklist: any) => checklist && checklist?.status !== 'DELETED')
      .sort((a: any, b: any) => (Number(a?.position) || 0) - (Number(b?.position) || 0))
      .map((checklist: any) => {
        const rawItems = Array.isArray(checklist?.items) ? checklist.items : [];
        const items = [...rawItems]
          .filter((item: any) => item && item?.status !== 'DELETED')
          .sort((a: any, b: any) => (Number(a?.position) || 0) - (Number(b?.position) || 0))
          .map((item: any) => ({
            ...item,
            id: idOf(item),
            title: String(item?.title || '').trim(),
            isCompleted: item?.isCompleted === true
          }));

        return {
          ...checklist,
          id: idOf(checklist),
          title: String(checklist?.title || '').trim() || 'Checklist',
          items,
          totalCount: items.length,
          completedCount: items.filter((item: any) => item?.isCompleted === true).length
        };
      });
  } catch (error) {
    console.error('Error in mapStickyNoteChecklists:', error);
    return [];
  }
}

/**
 * Normalizes a sticky note column with display properties:
 * label, type, position, color accent, and checkbox variant.
 *
 * @param column Raw column data object.
 * @returns Normalized column object.
 */
export function mapStickyNoteColumn(column: any): any {
  try {
    if (!column) return null;
    const color = String(column?.color || 'YELLOW').toUpperCase();
    return {
      ...column,
      id: idOf(column),
      label: column?.name || column?.title || 'Untitled column',
      type: column?.type || 'CUSTOM',
      color,
      position: Number(column?.position) || 0,
      accent: getNoteColorAccent(color),
      checkboxVariant: getNoteColorBadgeVariant(color)
    };
  } catch (error) {
    console.error('Error in mapStickyNoteColumn:', error);
    return column ? { ...column, id: idOf(column) } : null;
  }
}
