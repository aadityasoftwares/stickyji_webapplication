import type { SelectOption } from '../../../shared/components/select/select';

export type MemberTab = 'all' | 'active' | 'invitations' | 'removed';

export type MemberView = 'grid' | 'list';

export type MemberSort = 'updatedAt' | 'createdAt' | 'name' | 'role';

export const WORKSPACE_MEMBER_STATUS_PREFERENCES: Record<MemberTab, string> = {
  all: 'ALL',
  active: 'ACTIVE',
  invitations: 'INVITATIONS',
  removed: 'REMOVED',
};

export const PREFERENCE_TO_MEMBER_STATUS: Readonly<Partial<Record<string, MemberTab>>> = {
  ALL: 'all',
  ACTIVE: 'active',
  INVITED: 'invitations',
  INVITATIONS: 'invitations',
  REMOVED: 'removed',
};

export const PREFERENCE_TO_MEMBER_SORT: Readonly<Partial<Record<string, MemberSort>>> = {
  RECENTLY_UPDATED: 'updatedAt',
  RECENTLY_CREATED: 'createdAt',
  NAME_ASC: 'name',
  NAME_DESC: 'name',
  OLDEST_FIRST: 'createdAt',
  ROLE: 'role',
  ROLE_ASC: 'role',
};

export const WORKSPACE_MEMBER_PAGE_SIZE = 100;
export const WORKSPACE_MEMBER_SORT_OPTIONS: readonly SelectOption[] = [
  {
    label: 'Recently updated',
    value: 'updatedAt',
  },
  {
    label: 'Recently added',
    value: 'createdAt',
  },
  {
    label: 'Member / email A–Z',
    value: 'name',
  },
  {
    label: 'Role A–Z',
    value: 'role',
  },
];
