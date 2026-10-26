export type WorkspaceInvitationStatus =
  'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export type WorkspaceInvitationSkipCode =
  | 'SELF'
  | 'OWNER'
  | 'EXISTING_MEMBER'
  | 'PENDING_INVITATION'
  | 'ROLE_NOT_FOUND'
  | 'ROLE_NOT_ALLOWED';

export interface WorkspaceInvitationReference {
  id?: string;
  _id?: string;
  name?: string;
  slug?: string;
  email?: string;
  displayName?: string;
  code?: string;
}

export type WorkspaceInvitationRef = string | WorkspaceInvitationReference;

export interface WorkspaceInvitation {
  id?: string;
  _id?: string;
  workspaceId: WorkspaceInvitationRef;
  userId?: WorkspaceInvitationRef | null;
  email: string;
  roleId: WorkspaceInvitationRef;
  invitedBy: WorkspaceInvitationRef;
  status: WorkspaceInvitationStatus;
  message?: string | null;
  expiresAt: string | Date;
  acceptedAt?: string | Date | null;
  rejectedAt?: string | Date | null;
  cancelledAt?: string | Date | null;
  createdBy?: WorkspaceInvitationRef | null;
  updatedBy?: WorkspaceInvitationRef | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface WorkspaceInvitationCreateItem {
  email: string;
  roleId: string;
  message?: string | null;
}

export interface WorkspaceInvitationBatchCreateRequest {
  workspaceId: string;
  invitations: WorkspaceInvitationCreateItem[];
}

export interface WorkspaceInvitationSingleCreateRequest {
  workspaceId: string;
  email: string;
  roleId: string;
  message?: string | null;
}

export interface WorkspaceInvitationSkipped {
  email: string;
  code: WorkspaceInvitationSkipCode;
  message: string;
}

export interface WorkspaceInvitationBatchCreateSummary {
  requested: number;
  created: number;
  skipped: number;
  emailSent: number;
  emailFailed: number;
}

export interface WorkspaceInvitationBatchCreateResult {
  invitations: WorkspaceInvitation[];
  skipped: WorkspaceInvitationSkipped[];
  summary: WorkspaceInvitationBatchCreateSummary;
}

export interface WorkspaceInvitationUpdateRequest {
  roleId?: string;
  message?: string | null;
  expiresAt?: string | Date;
}

export interface WorkspaceInvitationQuery {
  page?: number;
  limit?: number;
  workspaceId?: string;
  userId?: string;
  email?: string;
  roleId?: string;
  invitedBy?: string;
  status?: WorkspaceInvitationStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
