import { canWorkspaceAction } from './workspace-access.function';

describe('Workspace action authorization', () => {
  it('respects explicit allowedActions grants or restrictions', () => {
    expect(canWorkspaceAction({ allowedActions: { canTrash: false } }, 'canTrash')).toBe(false);
    expect(canWorkspaceAction({ isPersonal: true, isOwner: true }, 'canTrash')).toBe(false);
    expect(
      canWorkspaceAction({ isPersonal: false, isOwner: true, status: 'ACTIVE' }, 'canTrash'),
    ).toBe(true);
  });
  it('combines grants with trash and membership state', () => {
    expect(
      canWorkspaceAction({ status: 'ACTIVE', allowedActions: { canRestore: true } }, 'canRestore'),
    ).toBe(false);
    expect(
      canWorkspaceAction({ status: 'TRASHED', allowedActions: { canRestore: true } }, 'canRestore'),
    ).toBe(true);
    expect(
      canWorkspaceAction({ status: 'DELETED', allowedActions: { canEdit: true } }, 'canEdit'),
    ).toBe(false);
    expect(
      canWorkspaceAction(
        {
          status: 'ACTIVE',
          access: { membership: { status: 'PENDING' } },
          allowedActions: { canView: true },
        },
        'canView',
      ),
    ).toBe(false);
  });
});
