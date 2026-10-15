import { Injectable, computed, effect, inject, signal, } from '@angular/core';
import { WorkspaceRoleApiService } from '../../../private/roles-permissions/services/workspace-role.service';
import type { WorkspaceRole } from '../../../private/roles-permissions/models/workspace-role.models';
import { UserPreferenceStore } from '../../../private/user-preferences/services/user-preference.store';
import { AuthSession, AuthenticatedUser, } from '../models/auth.models';

@Injectable({
    providedIn: 'root',
})

export class AuthStore {
    private readonly roles = inject(WorkspaceRoleApiService);
    private readonly permissionsRequested = signal(false);
    private readonly resolvedGlobalRole = signal<WorkspaceRole | null>(null);

    readonly canCreateWorkspace = computed(() => {
        const role = this.resolvedGlobalRole() ?? this.role();
        if (!this.user() || !role || role.isActive === false || role.scope !== 'GLOBAL') return false;
        return role.permissions?.some(permission => {
            if (typeof permission === 'string') return permission === 'WORKSPACE_CREATE' || permission === 'WORKSPACE.CREATE';
            if (!permission || typeof permission !== 'object') return false;
            const grant = permission as { module?: string; action?: string; isActive?: boolean };
            return grant.isActive !== false && grant.module === 'WORKSPACE' && grant.action === 'CREATE';
        }) ?? false;
    });

    readonly canManageGlobalPermissions = computed(() => {
        const role = this.resolvedGlobalRole() ?? this.role();
        if (!this.user() || !role || role.isActive === false || role.scope !== 'GLOBAL') return false;
        if (role.code === 'SUPER_ADMIN') return true;
        return role.permissions?.some(permission => {
            if (typeof permission === 'string') {
                const upper = permission.toUpperCase();
                return upper === 'ROLES_CREATE' || upper === 'ROLES_UPDATE' || upper === 'ROLES_DELETE' ||
                       upper.startsWith('PERMISSION') || upper.startsWith('ROLES.');
            }
            if (!permission || typeof permission !== 'object') return false;
            const grant = permission as { module?: string; action?: string; isActive?: boolean };
            return grant.isActive !== false &&
                (grant.module?.toUpperCase() === 'ROLES' || grant.module?.toUpperCase() === 'PERMISSION') &&
                ['CREATE', 'UPDATE', 'DELETE', 'MANAGE'].includes(String(grant.action ?? '').toUpperCase());
        }) ?? false;
    });

    hasGlobalPermission(module: string, action: string): boolean {
        const role = this.resolvedGlobalRole() ?? this.role();
        if (!this.user() || !role || role.isActive === false || role.scope !== 'GLOBAL') return false;
        if (role.code === 'SUPER_ADMIN') return true;
        const targetModule = module.toUpperCase();
        const targetAction = action.toUpperCase();
        return role.permissions?.some(permission => {
            if (typeof permission === 'string') {
                const upper = permission.toUpperCase();
                return upper === `${targetModule}_${targetAction}` || upper === `${targetModule}.${targetAction}`;
            }
            if (!permission || typeof permission !== 'object') return false;
            const grant = permission as { module?: string; action?: string; isActive?: boolean };
            return grant.isActive !== false &&
                grant.module?.toUpperCase() === targetModule &&
                grant.action?.toUpperCase() === targetAction;
        }) ?? false;
    }


    constructor() {
        effect(onCleanup => {
            const requested = this.permissionsRequested();
            const user = this.user();
            const roleId = this.roleId();
            this.resolvedGlobalRole.set(null);
            if (!requested || !user || !roleId) return;
            const subscription = this.roles.getById(roleId).subscribe({
                next: response => {
                    const role = response.data;
                    if ((role.id ?? role._id) === roleId && role.scope === 'GLOBAL') this.resolvedGlobalRole.set(role);
                },
                error: () => this.resolvedGlobalRole.set(null),
            });
            onCleanup(() => subscription.unsubscribe());
        });
    }

    loadGlobalPermissions(): void {
        this.permissionsRequested.set(true);
    }
    private readonly preferences = inject(UserPreferenceStore);
    private readonly userState = signal<AuthenticatedUser | null>(null);
    private readonly accessTokenState = signal<string | null>(null);
    private readonly sessionIdState = signal<string | null>(null);
    private readonly initializedState = signal(false);
    readonly user = this.userState.asReadonly();
    readonly accessToken = this.accessTokenState.asReadonly();
    readonly sessionId = this.sessionIdState.asReadonly();
    readonly initialized = this.initializedState.asReadonly();

    readonly isAuthenticated =
        computed(() =>
            Boolean(
                this.userState() &&
                this.accessTokenState(),
            ),
        );

    readonly userId =
        computed(() =>
            this.userState()?.id ?? null,
        );

    readonly userEmail =
        computed(() =>
            this.userState()?.email ?? null,
        );

    readonly role = computed(() => {
        const value =
            this.userState()?.globalRoleId;

        if (!value || typeof value === 'string') {
            return null;
        }

        return value;
    });

    readonly roleId = computed(() => {
        const value =
            this.userState()?.globalRoleId;

        if (!value) {
            return null;
        }

        return typeof value === 'string'
            ? value
            : value._id;
    });

    readonly roleCode =
        computed(() =>
            this.role()?.code ?? null,
        );

    readonly roleName =
        computed(() =>
            this.role()?.displayName ??
            this.role()?.name ??
            null,
        );

    readonly isEmailVerified =
        computed(() =>
            Boolean(
                this.userState()?.isEmailVerified,
            ),
        );

    readonly isMfaEnabled =
        computed(() =>
            Boolean(
                this.userState()?.isMfaEnabled,
            ),
        );

    setSession(session: AuthSession,): void {
        if (this.userId() !== session?.user?.id) this.preferences.reset();
        this.resolvedGlobalRole.set(null);
        this.userState.set(session?.user);
        this.sessionIdState.set(session?.sessionId);
        this.accessTokenState.set(session?.tokens?.accessToken);
        this.initializedState.set(true,);
    }

    setUser(user: AuthenticatedUser,): void {
        if (this.userId() !== user?.id) this.preferences.reset();
        this.resolvedGlobalRole.set(null);
        this.userState.set(user);
    }

    patchUser(values: Partial<AuthenticatedUser>): void {
        const current = this.userState();

        if (!current) {
            return;
        }

        this.resolvedGlobalRole.set(null);
        this.userState.set({
            ...current,
            ...values,
        });
    }

    setAccessToken(accessToken: string,): void {
        this.accessTokenState.set(accessToken,);
    }

    markInitialized(): void {
        this.initializedState.set(true);
    }

    clearSession(): void {
        this.preferences.reset();
        this.resolvedGlobalRole.set(null);
        this.userState.set(null);
        this.accessTokenState.set(null);
        this.sessionIdState.set(null);
        this.initializedState.set(true,);
    }

    hasRole(...roles: string[]): boolean {
        const currentRole = this.roleCode();

        if (!currentRole) {
            return false;
        }

        return roles.some(role => role.toUpperCase() === currentRole.toUpperCase());
    }
}
