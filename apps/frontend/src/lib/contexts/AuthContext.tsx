import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { clear2FAState, mark2FAVerified, setPendingChallengeId } from '@/lib/twoFactor';
import { type User } from '@mms/shared';
import { appNavigate } from '@/lib/routing/appNavigate';
import { ROUTES } from '@/lib/config/routes';
import { apiFetch, apiJson, isApiError } from '@/lib/apiClient';
import { isCurrentHostApex } from '@/lib/config/tenantConfig';
import { getWorkspaceLocalStoragePrefix } from '@/lib/db';
import { parseAuthError, type AuthError } from '@/lib/authErrors';
import {
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
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState<boolean>(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [appPublicSettings, setAppPublicSettings] = useState<unknown | null>(null);

  const checkAppState = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingPublicSettings(true);
      const response = await apiFetch('/health');
      if (response.ok) {
        setAppPublicSettings({ id: 'app-online', public_settings: {} });
      }
    } catch (error) {
      console.warn('API server seems to be offline:', error);
    } finally {
      setIsLoadingPublicSettings(false);
    }
  }, []);

  const applyAuthSession = useCallback(async (authUser: User): Promise<void> => {
    setUser(authUser);
    setIsAuthenticated(true);
    setAuthChecked(true);
    persistAuthUser(authUser);
    if (!authUser.mustChangePassword) {
      void import('@/lib/db').then(({ syncDatabase }) => syncDatabase());
    }
  }, []);

  const checkUserAuth = useCallback(async (): Promise<void> => {
    if (isCurrentHostApex()) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return;
    }

    const persistedUser = getPersistedAuthUser();
    if (!persistedUser) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return;
    }

    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const authResponse = await apiJson<{ user: User }>('/api/auth/me');
      await applyAuthSession(authResponse.user);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (isApiError(error) && (error.status === 401 || error.status === 403)) {
        clearPersistedAuthUser();
      }
    } finally {
      setAuthChecked(true);
      setIsLoadingAuth(false);
    }
  }, [applyAuthSession]);

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

  const logout = (shouldRedirect = true): void => {
    clear2FAState();

    if (user?.id) {
      clearUserScopedCachesOnLogout(user.id, getWorkspaceLocalStoragePrefix());
    }

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
    if (!isCurrentHostApex()) {
      void checkAppState();
    }
    void checkUserAuth();
  }, [checkAppState, checkUserAuth]);

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
      logout,
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
