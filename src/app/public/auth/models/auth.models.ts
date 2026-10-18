import type { ApiResponse } from '../../../shared/models/api.models';
export type { ApiResponse } from '../../../shared/models/api.models';

export enum SessionType {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP',
  API = 'API',
}

export interface AuthRole {
  _id: string;

  name?: string;
  displayName?: string;
  code?: string;
  description?: string;

  type?: string;
  scope?: string;

  permissions?: unknown[];

  module?: string;

  isSystem?: boolean;
  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;

  globalRoleId: string | AuthRole;

  status: string;
  authProvider?: string;

  isEmailVerified: boolean;
  isPhoneVerified?: boolean;
  isMfaEnabled: boolean;
}

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt?: string;
}

export interface AuthSession {
  user: AuthenticatedUser;
  sessionId: string;
  tokens: AuthTokens;
}

export interface AuthSessionResponse extends ApiResponse<AuthSession> {
  data: AuthSession;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;

  email: string;
  password: string;
  phone?: string;

  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;

  timezoneCode: string;
  locale: string;
  countryCodeHint?: string;
}

export interface ClientContext {
  sessionType: SessionType;
  deviceId?: string;
  deviceName?: string;
}

export interface LoginRequest extends LoginCredentials, ClientContext {}

export interface RegisterRequest extends RegisterCredentials, ClientContext {}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export type LoginResponse = AuthSessionResponse;
export type RegisterResponse = AuthSessionResponse;
export type ForgotPasswordResponse = ApiResponse<void>;
export type ResetPasswordResponse = ApiResponse<void>;
export type ChangePasswordResponse = ApiResponse<void>;
export type LogoutResponse = ApiResponse<void>;
export type VerifyEmailResponse = ApiResponse<void>;
