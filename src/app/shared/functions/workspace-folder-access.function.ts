import type { WorkspaceFolder } from '../../private/workspacefolders/models/workspace-folder.models';

export type FolderAction = 'canView' | 'canCreate' | 'canEdit' | 'canArchive' | 'canTrash' | 'canRestore' | 'canPermanentlyDelete';
export interface FolderWorkspaceAccess { id?: string; status?: string; isOwner?: boolean; }

// Responses omit members' effective FOLDERS grants. Successful reads prove READ only.
// Owner access follows backend assertFolderAccess; role names never grant writes.
export function canFolderAction(workspace: FolderWorkspaceAccess | null | undefined,
  folder: WorkspaceFolder | null, action: FolderAction, readConfirmed = false): boolean {
  if (!workspace || !['ACTIVE', 'ARCHIVED'].includes(workspace.status ?? '')) return false;
  if (folder && (typeof folder.workspaceId === 'string' ? folder.workspaceId : folder.workspaceId.id) !== workspace.id) return false;
  if (action === 'canView') return !!folder && folder.status === 'ACTIVE' && (workspace.isOwner === true || readConfirmed);
  if (workspace.isOwner !== true) return false;
  if (action === 'canCreate') return true;
  if (!folder) return false;
  if (action === 'canRestore') return folder.status === 'DELETED' && (!folder.purgeAfter || Date.parse(folder.purgeAfter) > Date.now());
  if (action === 'canPermanentlyDelete') return folder.status === 'DELETED' && !folder.isDefault;
  if (folder.status === 'DELETED') return false;
  if (action === 'canArchive' || action === 'canTrash') return !folder.isDefault;
  return action === 'canEdit';
}
