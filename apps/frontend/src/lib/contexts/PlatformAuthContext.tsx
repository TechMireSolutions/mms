import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PlatformUser } from '@mms/shared';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { useTenant } from '@/lib/contexts/TenantContext';
import usePlatformSessionTimeout from '@/hooks/usePlatformSessionTimeout';

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

export interface PlatformAuthContextType {
  platformUser: PlatformUser | null;
  isPlatformAuthenticated: boolean;
  isLoadingPlatformAuth: boolean;
  platformAuthChecked: boolean;
  platformLogin: (email: string, password: string) => Promise<void>;
  platformLogout: () => void;
  checkPlatformAuth: () => Promise<void>;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | undefined>(undefined);

export const PlatformAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isApex } = useTenant();
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);
  const [isPlatformAuthenticated, setIsPlatformAuthenticated] = useState(false);
  const [isLoadingPlatformAuth, setIsLoadingPlatformAuth] = useState(false);
  const [platformAuthChecked, setPlatformAuthChecked] = useState(false);

  const checkPlatformAuth = useCallback(async (): Promise<void> => {
    if (!isApex) {
      setPlatformUser(null);
      setIsPlatformAuthenticated(false);
      setPlatformAuthChecked(true);
      return;
    }

    setIsLoadingPlatformAuth(true);
    try {
      const data = await apiJson<{ user: PlatformUser }>('/api/platform/auth/me');
      setPlatformUser(data.user);
      setIsPlatformAuthenticated(true);
    } catch {
      setPlatformUser(null);
      setIsPlatformAuthenticated(false);
    } finally {
      setPlatformAuthChecked(true);
      setIsLoadingPlatformAuth(false);
    }
  }, [isApex]);

  const platformLogin = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoadingPlatformAuth(true);
    try {
      const data = await apiJson<{ user: PlatformUser }>('/api/platform/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.removeItem('mms_user');
      localStorage.removeItem('mms_token');
      setPlatformUser(data.user);
      setIsPlatformAuthenticated(true);
      setPlatformAuthChecked(true);
    } finally {
      setIsLoadingPlatformAuth(false);
    }
  }, []);

  const platformLogout = useCallback((): void => {
    void apiFetch('/api/platform/auth/logout', { method: 'POST' });
    localStorage.removeItem('mms_user');
    localStorage.removeItem('mms_token');
    setPlatformUser(null);
    setIsPlatformAuthenticated(false);
    setPlatformAuthChecked(true);
  }, []);

  useEffect(() => {
    void checkPlatformAuth();
  }, [checkPlatformAuth]);

  const value = useMemo(
    () => ({
      platformUser,
      isPlatformAuthenticated,
      isLoadingPlatformAuth,
      platformAuthChecked,
      platformLogin,
      platformLogout,
      checkPlatformAuth,
    }),
    [
      platformUser,
      isPlatformAuthenticated,
      isLoadingPlatformAuth,
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
        onTimeout={platformLogout}
      />
      {children}
    </PlatformAuthContext.Provider>
  );
};

export function usePlatformAuth(): PlatformAuthContextType {
  const ctx = useContext(PlatformAuthContext);
  if (!ctx) {
    throw new Error('usePlatformAuth must be used within PlatformAuthProvider');
  }
  return ctx;
}
