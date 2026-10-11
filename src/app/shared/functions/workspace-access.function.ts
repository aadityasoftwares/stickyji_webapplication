export type WorkspaceAction =
  | 'canView'
  | 'canEdit'
  | 'canManageSettings'
  | 'canArchive'
  | 'canTrash'
  | 'canRestore'
  | 'canPermanentlyDelete'
  | 'canLeave';

export function canWorkspaceAction(
  workspace: any,
  action: WorkspaceAction | string,
): boolean {
  if (!workspace) return false;

  const status = String(workspace.status ?? 'ACTIVE').toUpperCase();
  const trashed = status === 'DELETED' || status === 'TRASHED';

  // If explicit allowedActions grant is provided (e.g. in test suites), respect it alongside state invariants
  if (workspace.allowedActions && workspace.allowedActions[action] !== undefined) {
    if (workspace.allowedActions[action] !== true) return false;

    const membership = workspace.access?.membership;
    if (workspace.access?.isOwner !== true && membership?.status && membership.status !== 'ACTIVE') {
      return false;
    }

    if (action === 'canRestore' || action === 'canPermanentlyDelete') return trashed;
    if (trashed) return false;
    if (action === 'canArchive') return status === 'ACTIVE' || status === 'ARCHIVED';
    return true;
  }

  // Determine permissions directly from backend response properties
  const isOwner = Boolean(
    workspace.isOwner === true ||
    workspace.access?.isOwner === true ||
    String(workspace.role ?? '').toLowerCase() === 'owner'
  );
  const isPersonal = Boolean(
    workspace.isPersonal === true ||
    workspace.workspaceType === 'PERSONAL' ||
    workspace.label === 'PERSONAL'
  );
  const isInvited = Boolean(
    workspace.isInvited === true ||
    (!isOwner && workspace.label === 'INVITED')
  );

  const membership = workspace.access?.membership;
  if (!isOwner && membership?.status && membership.status !== 'ACTIVE') {
    return false;
  }

  if (trashed) {
    if (action === 'canRestore') return isOwner;
    if (action === 'canPermanentlyDelete') return isOwner && !isPersonal;
    return false;
  }

  switch (action) {
    case 'canRestore':
    case 'canPermanentlyDelete':
      return false;

    case 'canView':
      if (status === 'INACTIVE' || status === 'SUSPENDED') {
        return isOwner;
      }
      return true;

    case 'canEdit':
      if (isOwner) return true;
      if (isInvited) {
        const role = String(workspace.role ?? workspace.access?.role ?? '').toLowerCase();
        return role !== 'viewer';
      }
      return false;

    case 'canManageSettings':
      // Personal workspaces always stay private, settings can only be managed by owners on team spaces
      if (isPersonal) return false;
      return isOwner;

    case 'canArchive':
      return isOwner && (status === 'ACTIVE' || status === 'ARCHIVED');

    case 'canTrash':
      // Personal workspaces cannot be deleted or moved to trash
      if (isPersonal) return false;
      return isOwner && (status === 'ACTIVE' || status === 'ARCHIVED');

    case 'canLeave':
      return isInvited && !isOwner;

    default:
      return false;
  }
}

