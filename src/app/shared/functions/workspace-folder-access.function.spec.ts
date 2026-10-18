import { canFolderAction, type FolderAction } from './workspace-folder-access.function';
import type { WorkspaceFolder } from '../../private/workspacefolders/models/workspace-folder.models';

describe('Folder permissions and lifecycle', () => {
  const owner = { id: 'w', isOwner: true, status: 'ACTIVE' };
  const folder = {
    id: 'f',
    workspaceId: 'w',
    status: 'ACTIVE',
    isDefault: false,
  } as WorkspaceFolder;
  const writes: FolderAction[] = [
    'canCreate',
    'canEdit',
    'canArchive',
    'canTrash',
    'canRestore',
    'canPermanentlyDelete',
  ];

  it('never infers write access from membership or successful READ', () => {
    for (const action of writes)
      expect(canFolderAction({ ...owner, isOwner: false }, folder, action, true)).toBe(false);
    expect(canFolderAction({ ...owner, isOwner: false }, folder, 'canView', true)).toBe(true);
    expect(canFolderAction({ ...owner, isOwner: false }, folder, 'canView')).toBe(false);
  });

  it('enforces parent state even for an owner', () => {
    for (const status of ['INACTIVE', 'SUSPENDED', 'DELETED', 'TRASHED']) {
      for (const action of [...writes, 'canView'] as FolderAction[]) {
        expect(canFolderAction({ ...owner, status }, folder, action, true)).toBe(false);
      }
    }
    expect(canFolderAction({ ...owner, status: 'ARCHIVED' }, folder, 'canCreate')).toBe(true);
  });

  it('allows invited editors to create and edit folders using workspace access', () => {
    const invited = { ...owner, isOwner: false, isInvited: true, role: 'editor' };
    expect(canFolderAction(invited, null, 'canCreate')).toBe(true);
    expect(canFolderAction(invited, folder, 'canEdit')).toBe(true);
    expect(canFolderAction(invited, { ...folder, status: 'DELETED' }, 'canEdit')).toBe(false);
    expect(canFolderAction(invited, { ...folder, workspaceId: 'other' }, 'canEdit')).toBe(false);
    expect(canFolderAction(invited, folder, 'canTrash')).toBe(false);
  });

  it('honors viewer restrictions, explicit denials and inactive memberships', () => {
    const invited = { ...owner, isOwner: false, isInvited: true, role: 'editor' };
    for (const workspace of [
      { ...invited, role: 'viewer' },
      { ...invited, allowedActions: { canEdit: false } },
      { ...invited, access: { membership: { status: 'INACTIVE' } } },
    ]) {
      expect(canFolderAction(workspace, null, 'canCreate')).toBe(false);
      expect(canFolderAction(workspace, folder, 'canEdit')).toBe(false);
    }
    const granted = { ...invited, allowedActions: { canEdit: true } };
    expect(canFolderAction(granted, null, 'canCreate')).toBe(true);
    expect(canFolderAction(granted, folder, 'canEdit')).toBe(true);
  });

  it('protects default folders and rejects a different workspace', () => {
    expect(canFolderAction(owner, { ...folder, isDefault: true }, 'canArchive')).toBe(false);
    expect(canFolderAction(owner, { ...folder, isDefault: true }, 'canTrash')).toBe(false);
    expect(canFolderAction(owner, { ...folder, workspaceId: 'other' }, 'canEdit')).toBe(false);
  });

  it('allows only valid trash operations and respects the server deadline', () => {
    const trash: WorkspaceFolder = { ...folder, status: 'DELETED' };
    expect(canFolderAction(owner, trash, 'canEdit')).toBe(false);
    expect(canFolderAction(owner, trash, 'canArchive')).toBe(false);
    expect(canFolderAction(owner, trash, 'canView', true)).toBe(false);
    expect(canFolderAction(owner, trash, 'canRestore')).toBe(true);
    expect(canFolderAction(owner, { ...trash, purgeAfter: '2000-01-01' }, 'canRestore')).toBe(
      false,
    );
    expect(canFolderAction(owner, trash, 'canPermanentlyDelete')).toBe(true);
    expect(canFolderAction(owner, folder, 'canPermanentlyDelete')).toBe(false);
  });
});
