import { useEffect, useCallback } from 'react';
import type { User } from '@mms/shared';
import { apiJson, isApiError, SESSION_EXPIRED_EVENT } from '@/lib/apiClient';
import { AUTH_PATHS } from '@/lib/apiClientHelpers';
import { isCurrentHostApex } from '@/lib/config/tenantConfig';
import { getWorkspaceLocalStoragePrefix } from '@/lib/dbStorageCore';
import { queryClientInstance } from '@/lib/queryClient';
import { appNavigate } from '@/lib/routing/appNavigate';
import { ROUTES } from '@/lib/config/routes';
import { clear2FAState } from '@/lib/twoFactor';
import type { AuthError } from '@/lib/authErrors';
import {
  AUTH_USER_STORAGE_KEY,
  clearPersistedAuthUser,
  clearUserScopedCachesOnLogout,
} from '@/lib/contexts/authContextHelpers';

export interface UseAuthSessionSyncParams {
  setUser: (user: User | null) => void;
  setIsAuthenticated: (val: boolean) => void;
  setAuthChecked: (val: boolean) => void;
  setIsLoadingAuth: (val: boolean) => void;
  setAuthError: (err: AuthError | null) => void;
  applyAuthSession: (user: User) => Promise<void>;
  userRef: React.RefObject<User | null>;
}

export function useAuthSessionSync({
  setUser,
  setIsAuthenticated,
  setAuthChecked,
  setIsLoadingAuth,
  setAuthError,
  applyAuthSession,
  userRef,
}: UseAuthSessionSyncParams) {
  const checkUserAuth = useCallback(async (signal?: AbortSignal): Promise<void> => {
    if (isCurrentHostApex()) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return;
    }

    setIsLoadingAuth(true);
    setAuthChecked(false);
    setAuthError(null);

    try {
      const authResponse = await apiJson<{ user: User }>(AUTH_PATHS.me, { signal });
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
  }, [applyAuthSession, setUser, setIsAuthenticated, setAuthChecked, setIsLoadingAuth, setAuthError]);

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

    const handleSessionExpired = (_event: Event) => {
      clear2FAState();
      if (userRef.current?.id) {
        clearUserScopedCachesOnLogout(userRef.current.id, getWorkspaceLocalStoragePrefix());
      }
      queryClientInstance.clear();
      clearPersistedAuthUser();
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      appNavigate(ROUTES.login, { replace: true });
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      controller.abort();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [checkUserAuth, setUser, setIsAuthenticated, setAuthChecked, userRef]);

  return { checkUserAuth };
}
