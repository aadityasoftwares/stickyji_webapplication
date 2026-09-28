import { idOf } from './common.function';

/**
 * Safely extracts the identifier of a workspace member or its nested user entity.
 *
 * @param member Workspace member object.
 * @returns Member or user ID string.
 */
export function getWorkspaceMemberId(member: any): string {
  try {
    if (!member) {
      return '';
    }
    const userId = idOf(member?.user);
    if (userId) {
      return userId;
    }
    return idOf(member);
  } catch (error) {
    console.error('Error in getWorkspaceMemberId:', error);
    return '';
  }
}

/**
 * Extracts a human-readable display name for a workspace member.
 * Falls back to username from email, or 'Workspace member'.
 *
 * @param member Workspace member object.
 * @param fallback Optional fallback name.
 * @returns Display name string.
 */
export function getWorkspaceMemberName(member: any, fallback: any = 'Workspace member'): string {
  try {
    const defaultFallback = String(fallback ?? 'Workspace member');
    const displayName = String(member?.user?.displayName ?? '').trim();
    if (displayName) {
      return displayName;
    }

    const email = String(member?.user?.email ?? '').trim();
    if (email) {
      return email.split('@')[0] || email;
    }

    const name = String(member?.name ?? '').trim();
    if (name) {
      return name;
    }

    return defaultFallback;
  } catch (error) {
    console.error('Error in getWorkspaceMemberName:', error);
    return String(fallback ?? 'Workspace member');
  }
}

/**
 * Extracts the role name or code for a workspace member.
 *
 * @param member Workspace member object.
 * @param fallback Optional fallback role name.
 * @returns Role title string.
 */
export function getWorkspaceMemberRole(member: any, fallback: any = 'Member'): string {
  try {
    const defaultFallback = String(fallback ?? 'Member');
    const roleName = String(member?.role?.name ?? member?.role?.code ?? member?.role ?? '').trim();
    return roleName || defaultFallback;
  } catch (error) {
    console.error('Error in getWorkspaceMemberRole:', error);
    return String(fallback ?? 'Member');
  }
}

/**
 * Extracts the avatar image URL for a workspace member, or null if none is available.
 *
 * @param member Workspace member object.
 * @returns Avatar URL string or null.
 */
export function getWorkspaceMemberAvatar(member: any): string | null {
  try {
    const user = member?.user;
    const profile = user?.profile;
    const value =
      user?.avatarUrl ??
      user?.profileImage ??
      user?.imageUrl ??
      profile?.avatarUrl ??
      profile?.profileImage ??
      member?.avatarUrl;

    return typeof value === 'string' && value.trim() ? value.trim() : null;
  } catch (error) {
    console.error('Error in getWorkspaceMemberAvatar:', error);
    return null;
  }
}
