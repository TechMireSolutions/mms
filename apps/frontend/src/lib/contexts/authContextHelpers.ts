import type { AuthError } from '@/lib/authErrors';
import type { User, Workspace } from '@mms/shared';
import { getCurrentSubdomain, isCurrentHostApex } from '@/lib/config/tenantConfig';

export class AuthFailureError extends Error {
  constructor(readonly authError: AuthError) {
    super(authError.message);
    this.name = 'AuthFailureError';
  }
}

export function clearUserScopedCachesOnLogout(userId: string, prefix: string): void {
  try {
    localStorage.removeItem(`${prefix}messages`);
    localStorage.removeItem(`${prefix}whatsappTemplates_u:${userId}`);
  } catch (cacheClearError) {
    console.error('Failed to clear user-scoped caches on logout:', cacheClearError);
  }
}

export interface OnboardResult {
  user: User;
  workspace: Workspace;
}

export interface OnboardPayload {
  madrasaName: string;
  tagline: string;
  adminName: string;
  email: string;
  password: string;
  subdomain: string;
  country?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  adminPhone?: string;
  website?: string;
  footerText?: string;
  city?: string;
  region?: string;
  modules?: string[];
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError: AuthError | null;
  appPublicSettings: unknown | null;
  authChecked: boolean;
  login: (email: string, password: string) => Promise<{ user: User; requires2FA: boolean; challengeId?: string }>;
  logout: (shouldRedirect?: boolean) => void;
  navigateToLogin: () => void;
  checkUserAuth: () => Promise<void>;
  checkAppState: () => Promise<void>;
  onboard: (onboardingPayload: OnboardPayload) => Promise<OnboardResult>;
  exchangeHandoff: (code: string) => Promise<void>;
}

export interface LoginApiResponse {
  user: User;
  requires2FA?: boolean;
  challengeId?: string;
}

export function buildConnectionAuthError(error: unknown): AuthError {
  const message = error instanceof Error ? error.message : 'Failed to connect to authentication server';
  return { type: 'connection_error', message };
}

export function getPersistedAuthUser(): User | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('mms_user') : null;
    if (!raw) return null;
    const user = JSON.parse(raw) as User;
    if (!user || typeof user !== 'object') return null;

    if (isCurrentHostApex()) {
      return null;
    }

    const currentSubdomain = getCurrentSubdomain();
    if (currentSubdomain && user.workspaceSubdomain?.toLowerCase() !== currentSubdomain.toLowerCase()) {
      clearPersistedAuthUser();
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function persistAuthUser(authUser: User): void {
  localStorage.setItem('mms_user', JSON.stringify(authUser));
}

export function clearPersistedAuthUser(): void {
  localStorage.removeItem('mms_user');
}
