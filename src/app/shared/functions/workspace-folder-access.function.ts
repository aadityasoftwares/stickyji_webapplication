import type { WorkspaceFolder } from '../../private/workspacefolders/models/workspace-folder.models';
import { canWorkspaceAction } from './workspace-access.function';

export type FolderAction =
  | 'canView'
  | 'canCreate'
  | 'canEdit'
  | 'canArchive'
  | 'canTrash'
  | 'canRestore'
  | 'canPermanentlyDelete';
export interface FolderWorkspaceAccess {
  id?: string;
  status?: string;
  isOwner?: boolean;
  isInvited?: boolean;
  label?: string;
  role?: string;
  allowedActions?: Record<string, boolean>;
  access?: {
    isOwner?: boolean;
    role?: string;
    membership?: { status?: string };
  };
}

// Folder creation and editing follow the workspace editor's access policy.
// Successful reads alone do not grant writes; the API authorizes each mutation.
export function canFolderAction(
  workspace: FolderWorkspaceAccess | null | undefined,
  folder: WorkspaceFolder | null,
  action: FolderAction,
  readConfirmed = false,
): boolean {
  if (!workspace || !['ACTIVE', 'ARCHIVED'].includes(workspace.status ?? '')) return false;
  if (
    folder &&
    (typeof folder.workspaceId === 'string' ? folder.workspaceId : folder.workspaceId.id) !==
      workspace.id
  )
    return false;
  if (action === 'canView')
    return !!folder && folder.status === 'ACTIVE' && (workspace.isOwner === true || readConfirmed);
  if (action === 'canCreate' || action === 'canEdit') {
    if (!canWorkspaceAction(workspace, 'canEdit')) return false;
    return action === 'canCreate' || (!!folder && folder.status !== 'DELETED');
  }
  if (workspace.isOwner !== true) return false;
  if (!folder) return false;
  if (action === 'canRestore')
    return (
      folder.status === 'DELETED' &&
      (!folder.purgeAfter || Date.parse(folder.purgeAfter) > Date.now())
    );
  if (action === 'canPermanentlyDelete') return folder.status === 'DELETED' && !folder.isDefault;
  if (folder.status === 'DELETED') return false;
  if (action === 'canArchive' || action === 'canTrash') return !folder.isDefault;
  return false;
}
