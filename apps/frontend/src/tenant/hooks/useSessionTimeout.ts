import { useEffect, useRef } from "react";
import { parseSessionTimeoutMinutes, translateApp } from "@mms/shared";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { notify } from "@/lib/notify";

/**
 * Logs the user out after configured idle minutes from global settings.
 */
export function useSessionTimeout(): void {
  const { isAuthenticated, logout } = useAuth();
  const settings = useGlobalSettings();
  const minutes = parseSessionTimeoutMinutes(settings.sessionTimeout);
  const language = settings.language;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const reset = (): void => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        notify.info(translateApp("global.sessionEndedTitle", language), {
          description: translateApp("global.sessionEndedDesc", language),
        });
        logout();
      }, minutes * 60 * 1000);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const;
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [isAuthenticated, minutes, logout, language]);
}

