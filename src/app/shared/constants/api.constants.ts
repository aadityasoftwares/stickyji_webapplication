import { environment } from '../../../Environments/environments';

export const API_BASE_URL = environment.apiUrl.replace(/\/+$/, '');

const resourceEndpoints = (resource: string) => ({
    base: `${API_BASE_URL}/${resource}`,
    create: `${API_BASE_URL}/${resource}/create`,
    get: (id: string) => `${API_BASE_URL}/${resource}/get/${encodeURIComponent(id)}`,
    getAll: `${API_BASE_URL}/${resource}/getall`,
    update: (id: string) => `${API_BASE_URL}/${resource}/update/${encodeURIComponent(id)}`,
    status: (id: string) => `${API_BASE_URL}/${resource}/status/${encodeURIComponent(id)}`,
    delete: (id: string) => `${API_BASE_URL}/${resource}/delete/${encodeURIComponent(id)}`,
    restore: (id: string) => `${API_BASE_URL}/${resource}/restore/${encodeURIComponent(id)}`,
});

export const API_ENDPOINTS = {
    auth: {
        login: `${API_BASE_URL}/auth/login`,
        register: `${API_BASE_URL}/auth/register`,
        refreshToken: `${API_BASE_URL}/auth/refreshtoken`,
        verifyEmail: `${API_BASE_URL}/auth/verifyemail`,
        forgotPassword: `${API_BASE_URL}/auth/forgotpassword`,
        resetPassword: `${API_BASE_URL}/auth/resetpassword`,
        changePassword: `${API_BASE_URL}/auth/changepassword`,
        logout: `${API_BASE_URL}/auth/logout`,
        logoutAll: `${API_BASE_URL}/auth/logoutall`,
        sessions: `${API_BASE_URL}/auth/sessions`,
    },
    stickyNotes: resourceEndpoints('stickynotes'),
    stickyNoteColumns: resourceEndpoints('stickynotescolumns'),
    stickyNoteChecklists: resourceEndpoints('stickynoteschecklist'),
    stickyNoteChecklistItems: resourceEndpoints('stickynoteschecklistitems'),
    stickyNoteFavorites: resourceEndpoints('stickynotefavorites'),
    permissions: {
        ...resourceEndpoints('permissions'),
        grouped: `${API_BASE_URL}/permissions/grouped`,
    },
    roles: {
        ...resourceEndpoints('roles'),
        rolePermissions: (id: string) => `${API_BASE_URL}/roles/${encodeURIComponent(id)}/permissions`,
    },
    workspaces: {
        ...resourceEndpoints('workspaces'),
        my: `${API_BASE_URL}/workspaces/my`,
    },
    workspaceFolders: {
        ...resourceEndpoints('workspacefolders'),
        my: `${API_BASE_URL}/workspacefolders/my`,
    },
    workspaceMembers: {
        ...resourceEndpoints('workspacemembers'),
        role: (id: string) => `${API_BASE_URL}/workspacemembers/role/${encodeURIComponent(id)}`,
    },
    workspaceInvitations: {
        ...resourceEndpoints('workspacememberinvitations'),
        cancel: (id: string) => `${API_BASE_URL}/workspacememberinvitations/cancel/${encodeURIComponent(id)}`,
        validateToken: `${API_BASE_URL}/workspacememberinvitations/validatetoken`,
        accept: `${API_BASE_URL}/workspacememberinvitations/accept`,
    },
    userPreferences: {
        ...resourceEndpoints('userpreference'),
        my: `${API_BASE_URL}/userpreference/my`,
        byKey: (key: string) => `${API_BASE_URL}/userpreference/my/${encodeURIComponent(key)}`,
        update: `${API_BASE_URL}/userpreference/update`,
        reset: `${API_BASE_URL}/userpreference/reset`,
        resetAll: `${API_BASE_URL}/userpreference/resetall`,
    },
    userProfile: {
        me: `${API_BASE_URL}/userprofile/me`,
        create: `${API_BASE_URL}/userprofile/create`,
        update: `${API_BASE_URL}/userprofile/update`,
    },
    referenceData: {
        countries: `${API_BASE_URL}/countries/getall`,
        timezones: `${API_BASE_URL}/timezones/getall`,
        languages: `${API_BASE_URL}/languages/getall`,
        currencies: `${API_BASE_URL}/currencies/getall`,
    },
} as const;

export const PUBLIC_AUTH_ENDPOINTS = [
    API_ENDPOINTS.auth.login,
    API_ENDPOINTS.auth.register,
    API_ENDPOINTS.auth.refreshToken,
    API_ENDPOINTS.auth.forgotPassword,
    API_ENDPOINTS.auth.resetPassword,
    API_ENDPOINTS.auth.verifyEmail,
] as const;
