import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PlatformUserProfile } from '@mms/shared';
import { normalizePlatformAdminPermissions } from '@mms/shared';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { useTenant } from '@/lib/contexts/TenantContext';
import { usePlatformSessionTimeout } from '@/platform/hooks/usePlatformSessionTimeout';

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

function normalizeSessionUser(user: PlatformUserProfile): PlatformUserProfile {
  return {
    ...user,
    permissions: normalizePlatformAdminPermissions(user.permissions),
  };
}

export interface PlatformAuthContextType {
  platformUser: PlatformUserProfile | null;
  isPlatformAuthenticated: boolean;
  /** True while probing existing session (`/me`) on boot. */
  isCheckingPlatformAuth: boolean;
  /** True while a sign-in form submission is in flight. */
  isPlatformLoginSubmitting: boolean;
  platformAuthChecked: boolean;
  platformLogin: (email: string, password: string) => Promise<PlatformLoginOutcome>;
  platformVerify2FA: (challengeId: string, code: string) => Promise<void>;
  platformLogout: () => Promise<void>;
  checkPlatformAuth: () => Promise<void>;
}

/** Result of a platform login attempt. When 2FA is required, the session is not
 *  established until the code is verified via `platformVerify2FA`. */
export type PlatformLoginOutcome =
  | { requires2FA: true; challengeId: string }
  | { requires2FA: false };

const PlatformAuthContext = createContext<PlatformAuthContextType | undefined>(undefined);

export const PlatformAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isApex } = useTenant();
  const [platformUser, setPlatformUser] = useState<PlatformUserProfile | null>(null);
  const [isPlatformAuthenticated, setIsPlatformAuthenticated] = useState(false);
  const [isCheckingPlatformAuth, setIsCheckingPlatformAuth] = useState(isApex);
  const [isPlatformLoginSubmitting, setIsPlatformLoginSubmitting] = useState(false);
  const [platformAuthChecked, setPlatformAuthChecked] = useState(false);

  const checkPlatformAuth = useCallback(async (): Promise<void> => {
    if (!isApex) {
      setPlatformUser(null);
      setIsPlatformAuthenticated(false);
      setPlatformAuthChecked(true);
      setIsCheckingPlatformAuth(false);
      return;
    }

    // Always probe cookie session on apex so new tabs, deep links, and
    // post-setup / password-reset flows restore auth without a sessionStorage gate.
    // Logged-out probe returns 200 { user: null } (not 401) to avoid DevTools noise.
    try {
      const platformSession = await apiJson<{ user: PlatformUserProfile | null }>(
        '/api/platform/auth/me',
      );
      if (platformSession.user) {
        setPlatformUser(normalizeSessionUser(platformSession.user));
        setIsPlatformAuthenticated(true);
      } else {
        setPlatformUser(null);
        setIsPlatformAuthenticated(false);
      }
    } catch {
      setPlatformUser(null);
      setIsPlatformAuthenticated(false);
    } finally {
      setPlatformAuthChecked(true);
      setIsCheckingPlatformAuth(false);
    }
  }, [isApex]);

  const platformLogin = useCallback(
    async (email: string, password: string): Promise<PlatformLoginOutcome> => {
      setIsPlatformLoginSubmitting(true);
      try {
        const res = await apiJson<{
          user: PlatformUserProfile;
          requires2FA?: boolean;
          challengeId?: string;
        }>('/api/platform/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (res.requires2FA && res.challengeId) {
          // 2FA is required — do not authenticate until the code is verified.
          return { requires2FA: true, challengeId: res.challengeId };
        }

        localStorage.removeItem('mms_user');
        setPlatformUser(normalizeSessionUser(res.user));
        setIsPlatformAuthenticated(true);
        setPlatformAuthChecked(true);
        return { requires2FA: false };
      } catch (error) {
        setPlatformUser(null);
        setIsPlatformAuthenticated(false);
        throw error;
      } finally {
        setIsPlatformLoginSubmitting(false);
      }
    },
    [],
  );

  const platformVerify2FA = useCallback(async (challengeId: string, code: string): Promise<void> => {
    setIsPlatformLoginSubmitting(true);
    try {
      const res = await apiJson<{ user: PlatformUserProfile }>(
        '/api/platform/auth/2fa/verify',
        {
          method: 'POST',
          body: JSON.stringify({ challengeId, code }),
        },
      );
      localStorage.removeItem('mms_user');
      setPlatformUser(normalizeSessionUser(res.user));
      setIsPlatformAuthenticated(true);
      setPlatformAuthChecked(true);
    } catch (error) {
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
      setPlatformUser(null);
      setIsPlatformAuthenticated(false);
      setPlatformAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    void checkPlatformAuth();
  }, [checkPlatformAuth]);

  const value = (() => ({
      platformUser,
      isPlatformAuthenticated,
      isCheckingPlatformAuth,
      isPlatformLoginSubmitting,
      platformAuthChecked,
      platformLogin,
      platformVerify2FA,
      platformLogout,
      checkPlatformAuth,
    }))();

  const handleTimeoutLogout = (() => {
    void platformLogout();
  });

  return (
    <PlatformAuthContext.Provider value={value}>
      <PlatformSessionTimeoutWatcher
        enabled={isApex && isPlatformAuthenticated}
        onTimeout={handleTimeoutLogout}
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
