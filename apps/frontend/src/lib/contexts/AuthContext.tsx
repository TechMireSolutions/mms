import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { clear2FAState, getPendingChallengeId, mark2FAVerified, setPendingChallengeId } from '@/lib/twoFactor';
import { type User } from '@mms/shared';
import { appNavigate } from '@/lib/routing/appNavigate';
import { ROUTES } from '@/lib/config/routes';
import { apiFetch, apiJson, isApiError } from '@/lib/apiClient';
import { isCurrentHostApex } from '@/lib/config/tenantConfig';
import { getWorkspaceLocalStoragePrefix } from '@/lib/db';
import { queryClientInstance } from '@/lib/queryClient';
import { isAuthErrorType, parseAuthError, type AuthError } from '@/lib/authErrors';
import {
  AUTH_USER_STORAGE_KEY,
  AuthFailureError,
  buildConnectionAuthError,
  clearPersistedAuthUser,
  clearUserScopedCachesOnLogout,
  getPersistedAuthUser,
  persistAuthUser,
  type AuthContextType,
  type LoginApiResponse,
  type OnboardPayload,
  type OnboardResult,
} from '@/lib/contexts/authContextHelpers';

export type { AuthError } from '@/lib/authErrors';
export type { AuthContextType, OnboardResult, OnboardPayload } from '@/lib/contexts/authContextHelpers';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialUser = typeof window !== 'undefined' ? getPersistedAuthUser() : null;
  const [user, setUser] = useState<User | null>(initialUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(initialUser));
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(!initialUser);
  const [isLoadingPublicSettings] = useState<boolean>(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(Boolean(initialUser));
  const [appPublicSettings] = useState<unknown | null>(null);

  const checkAppState = useCallback(async (_signal?: AbortSignal): Promise<void> => {
    // No-op stub retained for interface backwards-compatibility without extra network latency
  }, []);

  const applyAuthSession = useCallback(async (authUser: User): Promise<void> => {
    setUser(authUser);
    setIsAuthenticated(true);
    setAuthChecked(true);
    persistAuthUser(authUser);
  }, []);

  const checkUserAuth = useCallback(async (signal?: AbortSignal): Promise<void> => {
    if (isCurrentHostApex()) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return;
    }

    if (!initialUser) {
      setIsLoadingAuth(true);
    }
    setAuthError(null);

    try {
      const authResponse = await apiJson<{ user: User }>('/api/auth/me', { signal });
      await applyAuthSession(authResponse.user);
    } catch (error) {
      if (signal?.aborted) return;
      setUser(null);
      setIsAuthenticated(false);
      if (isApiError(error) && (error.status === 401 || error.status === 403)) {
        clearPersistedAuthUser();
      }
    } finally {
      if (!signal?.aborted) {
        setAuthChecked(true);
        setIsLoadingAuth(false);
      }
    }
  }, [applyAuthSession, initialUser]);

  const login = async (email: string, password: string): Promise<{ user: User; requires2FA: boolean; challengeId?: string }> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const authResponse = await response.json() as LoginApiResponse;

        if (authResponse.requires2FA && authResponse.challengeId) {
          clear2FAState();
          setPendingChallengeId(authResponse.challengeId);
          setUser(authResponse.user);
          setIsAuthenticated(false);
          setAuthChecked(true);
          return { user: authResponse.user, requires2FA: true, challengeId: authResponse.challengeId };
        }

        await applyAuthSession(authResponse.user);
        mark2FAVerified();
        return { user: authResponse.user, requires2FA: false };
      }

      const errObj = await parseAuthError(response);
      setAuthError(errObj);
      throw new AuthFailureError(errObj);
    } catch (error: unknown) {
      if (error instanceof AuthFailureError) {
        throw error;
      }
      const connectionError = buildConnectionAuthError(error);
      setAuthError(connectionError);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const verify2FA = async (code: string): Promise<{ user: User }> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const challengeId = getPendingChallengeId();
      if (!challengeId) {
        throw new Error('No pending 2FA challenge found');
      }
      const response = await apiJson<{ user: User }>('/api/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ challengeId, code }),
      });
      await applyAuthSession(response.user);
      mark2FAVerified();
      return { user: response.user };
    } catch (error) {
      const authErr: AuthError = isApiError(error)
        ? {
            type: isAuthErrorType(error.type) ? error.type : 'invalid_credentials',
            message: error.message,
          }
        : buildConnectionAuthError(error);
      setAuthError(authErr);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = (shouldRedirect = true): void => {
    clear2FAState();

    if (user?.id) {
      clearUserScopedCachesOnLogout(user.id, getWorkspaceLocalStoragePrefix());
    }

    queryClientInstance.clear();
    clearPersistedAuthUser();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    setAuthChecked(true);

    void apiFetch('/api/auth/logout', { method: 'POST' });

    if (shouldRedirect) {
      appNavigate(ROUTES.login, { replace: true });
    }
  };

  const [isExtendingSession, setIsExtendingSession] = useState<boolean>(false);
  const extendSession = async (): Promise<void> => {
    if (!isAuthenticated) return;
    setIsExtendingSession(true);
    try {
      await apiFetch('/api/auth/session/extend', { method: 'POST' });
    } finally {
      setIsExtendingSession(false);
    }
  };

  const onboard = async (onboardingPayload: OnboardPayload): Promise<OnboardResult> => {
    setAuthError(null);
    return apiJson<OnboardResult>('/api/auth/onboard', {
      method: 'POST',
      body: JSON.stringify(onboardingPayload),
    });
  };

  const exchangeHandoff = async (code: string): Promise<void> => {
    setAuthError(null);
    const authResponse = await apiJson<{ user: User }>('/api/auth/handoff', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    await applyAuthSession(authResponse.user);
    mark2FAVerified();
  };

  const navigateToLogin = (): void => {
    appNavigate(ROUTES.login, { replace: true });
  };

  useEffect(() => {
    const controller = new AbortController();

    void checkUserAuth(controller.signal);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_USER_STORAGE_KEY) {
        if (!event.newValue) {
          setUser(null);
          setIsAuthenticated(false);
          setAuthChecked(true);
          queryClientInstance.clear();
        } else {
          try {
            const nextUser = JSON.parse(event.newValue) as User;
            if (nextUser?.id) {
              setUser(nextUser);
              setIsAuthenticated(true);
              setAuthChecked(true);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      controller.abort();
      window.removeEventListener('storage', handleStorage);
    };
  }, [checkUserAuth]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      login,
      verify2FA,
      logout,
      extendSession,
      isExtendingSession,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      onboard,
      exchangeHandoff,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useOptionalAuth = (): AuthContextType | null => {
  return useContext(AuthContext) ?? null;
};
