import { Injectable, computed, inject, signal, } from '@angular/core';
import { UserPreferenceStore } from '../../../private/user-preferences/services/user-preference.store';
import { AuthSession, AuthenticatedUser, } from '../models/auth.models';

@Injectable({
    providedIn: 'root',
})

export class AuthStore {
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
        this.userState.set(session?.user);
        this.sessionIdState.set(session?.sessionId);
        this.accessTokenState.set(session?.tokens?.accessToken);
        this.initializedState.set(true,);
    }

    setUser(user: AuthenticatedUser,): void {
        if (this.userId() !== user?.id) this.preferences.reset();
        this.userState.set(user);
    }

    patchUser(values: Partial<AuthenticatedUser>): void {
        const current = this.userState();

        if (!current) {
            return;
        }

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
