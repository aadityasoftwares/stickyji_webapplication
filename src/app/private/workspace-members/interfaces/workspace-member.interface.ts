export type WorkspaceMemberStatus = 'INVITED' | 'ACTIVE' | 'REMOVED';

/**
 * Legacy/detail user shape returned by mutation/detail endpoints.
 * Kept so existing member edit flows continue to work.
 */
export interface WorkspaceMemberUserSummary {
  id?: string;
  _id?: string;
  email?: string;
  username?: string;
  name?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  profileImage?:
    | {
        id: string;
        url: string;
      }
    | string
    | null;
  imageUrl?: string | null;
  profile?: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
    profileImage?:
      | {
          id: string;
          url: string;
        }
      | string
      | null;
  } | null;
}

/**
 * Legacy/detail role shape returned by mutation/detail endpoints.
 */
export interface WorkspaceMemberRoleSummary {
  id?: string;
  _id?: string;
  name?: string;
  displayName?: string;
  code?: string;
  slug?: string;
  description?: string;
}

export type WorkspaceMemberUserRef = string | WorkspaceMemberUserSummary;

export type WorkspaceMemberRoleRef = string | WorkspaceMemberRoleSummary;

/**
 * Full/detail member contract used by create/update/role/restore/get-by-id.
 */
export interface WorkspaceMember {
  id?: string;
  _id?: string;
  workspaceId:
    | string
    | {
        id?: string;
        _id?: string;
        name?: string;
      };
  userId: WorkspaceMemberUserRef;
  roleId: WorkspaceMemberRoleRef;
  status: WorkspaceMemberStatus;
  invitedBy?: WorkspaceMemberUserRef | null;
  joinedAt?: string | Date | null;
  createdBy?: WorkspaceMemberUserRef | null;
  updatedBy?: WorkspaceMemberUserRef | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Lightweight person returned by GET /workspacemembers/getall.
 */
export interface WorkspaceMemberListPerson {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  profileImage?:
    | {
        id: string;
        url: string;
      }
    | string
    | null;
}

/**
 * Lightweight role returned by GET /workspacemembers/getall.
 */
export interface WorkspaceMemberListRole {
  id: string;
  code: string;
  name: string;
}

/**
 * Exact row shape returned by the lightweight members list endpoint.
 */
export interface WorkspaceMemberListItem {
  id: string;
  user?: Partial<WorkspaceMemberListPerson> | null;
  role?: Partial<WorkspaceMemberListRole> | null;
  status: WorkspaceMemberStatus;
  joinedAt: string | Date | null;
  lastActiveAt: string | Date | null;
  addedBy?: Partial<WorkspaceMemberListPerson> | null;
  isOwner: boolean;
  isCurrentUser: boolean;
}

export interface WorkspaceMemberCreateRequest {
  workspaceId: string;
  userId: string;
  roleId: string;
}

export interface WorkspaceMemberUpdateRequest {
  roleId?: string;
}

export interface WorkspaceMemberAssignRoleRequest {
  roleId: string;
}

/**
 * workspaceId is required because the people page always belongs to one
 * workspace and the backend now scopes/authorizes the request by workspace.
 */
export interface WorkspaceMemberQuery {
  workspaceId: string;
  page?: number;
  limit?: number;
  userId?: string;
  roleId?: string;
  status?: WorkspaceMemberStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
