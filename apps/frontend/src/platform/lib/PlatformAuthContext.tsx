import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PlatformUser } from '@mms/shared';
import { normalizePlatformAdminPermissions } from '@mms/shared';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { useTenant } from '@/lib/contexts/TenantContext';
import usePlatformSessionTimeout from '@/platform/hooks/usePlatformSessionTimeout';
import {
  clearPlatformBrowserSession,
  markPlatformBrowserSession,
} from '@/platform/lib/platformBrowserSession';

function PlatformSessionTimeoutWatcher({
  enabled,
  onTimeout,
}: {
  enabled: boolean;
  onTimeout: () => void;
}): null {
  usePlatformSessionTimeout({ enabled, onTimeout });
  return null;
}

function normalizeSessionUser(user: PlatformUser): PlatformUser {
  return {
    ...user,
    permissions: normalizePlatformAdminPermissions(user.permissions),
  };
}

export interface PlatformAuthContextType {
  platformUser: PlatformUser | null;
  isPlatformAuthenticated: boolean;
  /** True while probing existing session (`/me`) on boot. */
  isCheckingPlatformAuth: boolean;
  /** True while a sign-in form submission is in flight. */
  isPlatformLoginSubmitting: boolean;
  platformAuthChecked: boolean;
  platformLogin: (email: string, password: string) => Promise<void>;
  platformLogout: () => Promise<void>;
  checkPlatformAuth: (options?: { force?: boolean }) => Promise<void>;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | undefined>(undefined);

export const PlatformAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isApex } = useTenant();
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);
  const [isPlatformAuthenticated, setIsPlatformAuthenticated] = useState(false);
  const [isCheckingPlatformAuth, setIsCheckingPlatformAuth] = useState(false);
  const [isPlatformLoginSubmitting, setIsPlatformLoginSubmitting] = useState(false);
  const [platformAuthChecked, setPlatformAuthChecked] = useState(false);

  const checkPlatformAuth = useCallback(async (_options?: { force?: boolean }): Promise<void> => {
    if (!isApex) {
      setPlatformUser(null);
      setIsPlatformAuthenticated(false);
      setPlatformAuthChecked(true);
      return;
    }

    // Always probe cookie session on apex so new tabs, deep links, and
    // post-setup / password-reset flows restore auth without a sessionStorage gate.
    setIsCheckingPlatformAuth(true);
    try {
      const platformSession = await apiJson<{ user: PlatformUser }>('/api/platform/auth/me');
      markPlatformBrowserSession();
      setPlatformUser(normalizeSessionUser(platformSession.user));
      setIsPlatformAuthenticated(true);
    } catch {
      clearPlatformBrowserSession();
      setPlatformUser(null);
      setIsPlatformAuthenticated(false);
    } finally {
      setPlatformAuthChecked(true);
      setIsCheckingPlatformAuth(false);
    }
  }, [isApex]);

  const platformLogin = useCallback(async (email: string, password: string): Promise<void> => {
    setIsPlatformLoginSubmitting(true);
    try {
      const platformSession = await apiJson<{ user: PlatformUser }>('/api/platform/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.removeItem('mms_user');
      markPlatformBrowserSession();
      setPlatformUser(normalizeSessionUser(platformSession.user));
      setIsPlatformAuthenticated(true);
      setPlatformAuthChecked(true);
    } catch (error) {
      clearPlatformBrowserSession();
      setPlatformUser(null);
      setIsPlatformAuthenticated(false);
      throw error;
    } finally {
      setIsPlatformLoginSubmitting(false);
    }
  }, []);

  const platformLogout = useCallback(async (): Promise<void> => {
    try {
      await apiFetch('/api/platform/auth/logout', { method: 'POST' });
    } catch {
      /* clear client session even if logout request fails */
    } finally {
      localStorage.removeItem('mms_user');
      clearPlatformBrowserSession();
      setPlatformUser(null);
      setIsPlatformAuthenticated(false);
      setPlatformAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    void checkPlatformAuth();
  }, [checkPlatformAuth]);

  const value = useMemo(
    () => ({
      platformUser,
      isPlatformAuthenticated,
      isCheckingPlatformAuth,
      isPlatformLoginSubmitting,
      platformAuthChecked,
      platformLogin,
      platformLogout,
      checkPlatformAuth,
    }),
    [
      platformUser,
      isPlatformAuthenticated,
      isCheckingPlatformAuth,
      isPlatformLoginSubmitting,
      platformAuthChecked,
      platformLogin,
      platformLogout,
      checkPlatformAuth,
    ],
  );

  return (
    <PlatformAuthContext.Provider value={value}>
      <PlatformSessionTimeoutWatcher
        enabled={isApex && isPlatformAuthenticated}
        onTimeout={() => {
          void platformLogout();
        }}
      />
      {children}
    </PlatformAuthContext.Provider>
  );
};

export function usePlatformAuth(): PlatformAuthContextType {
  const platformAuth = useContext(PlatformAuthContext);
  if (!platformAuth) {
    throw new Error('usePlatformAuth must be used within PlatformAuthProvider');
  }
  return platformAuth;
}
