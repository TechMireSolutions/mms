import { useCallback } from "react";
import { parseSessionTimeoutMinutes, translateApp } from "@mms/shared";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { notify } from "@/lib/notify";
import { useIdleTimer } from "@/hooks/useIdleTimer";

/**
 * Logs the user out after configured idle minutes from global settings.
 */
export function useSessionTimeout(): void {
  const { isAuthenticated, logout } = useAuth();
  const settings = useGlobalSettings();
  const minutes = parseSessionTimeoutMinutes(settings.sessionTimeout);
  const language = settings.language;

  const handleTimeout = useCallback((): void => {
    notify.info(translateApp("global.sessionEndedTitle", language), {
      description: translateApp("global.sessionEndedDesc", language),
    });
    logout();
  }, [logout, language]);

  useIdleTimer({
    enabled: isAuthenticated,
    timeoutMinutes: minutes,
    onTimeout: handleTimeout,
  });
}


