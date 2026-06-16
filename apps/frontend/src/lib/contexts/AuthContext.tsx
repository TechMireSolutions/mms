import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { syncDatabase } from '../db';
import { clear2FAState, mark2FAVerified, setPendingChallengeId } from '../twoFactor';
import { type User, type Workspace } from '@mms/shared';
import { appNavigate } from '../routing/appNavigate';
import { ROUTES } from '../config/routes';
import { apiFetch, apiJson } from '../apiClient';

export interface AuthError {
  type: 'invalid_credentials' | 'auth_required' | 'connection_error' | 'user_not_registered';
  message: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError: AuthError | null;
  appPublicSettings: unknown | null;
  authChecked: boolean;
  login: (email: string, password: string) => Promise<{ requires2FA: boolean; challengeId?: string }>;
  logout: (shouldRedirect?: boolean) => void;
  navigateToLogin: () => void;
  checkUserAuth: () => Promise<void>;
  checkAppState: () => Promise<void>;
  onboard: (data: {
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
  }) => Promise<OnboardResult>;
  exchangeHandoff: (code: string) => Promise<void>;
}

export interface OnboardResult {
  user: User;
  workspace: Workspace;
  handoffCode: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
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
    } catch (err) {
      console.warn('API server seems to be offline:', err);
    } finally {
      setIsLoadingPublicSettings(false);
    }
  }, []);

  const applyAuthSession = useCallback(async (authUser: User): Promise<void> => {
    setUser(authUser);
    setIsAuthenticated(true);
    setAuthChecked(true);
    localStorage.setItem('mms_user', JSON.stringify(authUser));
    localStorage.removeItem('mms_token');
    // Background sync — must not block the UI from becoming interactive
    void syncDatabase();
  }, []);

  const checkUserAuth = useCallback(async (): Promise<void> => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const response = await apiFetch('/api/auth/me');

      if (response.ok) {
        const data = await response.json() as { user: User };
        await applyAuthSession(data.user);
      } else if (response.status === 401) {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('mms_user');
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setAuthChecked(true);
      setIsLoadingAuth(false);
    }
  }, [applyAuthSession]);

  const login = async (email: string, password: string): Promise<{ requires2FA: boolean; challengeId?: string }> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json() as {
          user: User;
          requires2FA?: boolean;
          challengeId?: string;
        };

        if (data.requires2FA && data.challengeId) {
          clear2FAState();
          setPendingChallengeId(data.challengeId);
          setUser(data.user);
          setIsAuthenticated(false);
          setAuthChecked(true);
          return { requires2FA: true, challengeId: data.challengeId };
        }

        await applyAuthSession(data.user);
        mark2FAVerified();
        return { requires2FA: false };
      }

      const errorData = await response.json() as { message?: string };
      const errObj: AuthError = {
        type: 'invalid_credentials',
        message: errorData.message || 'Login failed',
      };
      setAuthError(errObj);
      throw new Error(errObj.message);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to connect to authentication server';
      if (!authError) {
        setAuthError({ type: 'connection_error', message });
      }
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = (shouldRedirect = true): void => {
    clear2FAState();
    localStorage.removeItem('mms_token');
    localStorage.removeItem('mms_user');
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);

    void apiFetch('/api/auth/logout', { method: 'POST' });

    if (shouldRedirect) {
      appNavigate(ROUTES.login, { replace: true });
    }
  };

  const onboard = async (data: {
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
  }): Promise<OnboardResult> => {
    setAuthError(null);
    return apiJson<OnboardResult>('/api/auth/onboard', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const exchangeHandoff = async (code: string): Promise<void> => {
    setAuthError(null);
    const data = await apiJson<{ user: User }>('/api/auth/handoff', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    await applyAuthSession(data.user);
    mark2FAVerified();
  };

  const navigateToLogin = (): void => {
    appNavigate(ROUTES.login, { replace: true });
  };

  useEffect(() => {
    void checkAppState();
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
