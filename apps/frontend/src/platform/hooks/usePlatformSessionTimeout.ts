import { useEffect, useRef } from 'react';
import { PLATFORM_IDLE_SESSION_TIMEOUT_MINUTES, translateApp } from '@mms/shared';
import { notify } from '@/lib/notify';

interface PlatformSessionTimeoutOptions {
  enabled: boolean;
  onTimeout: () => void;
  minutes?: number;
}

/**
 * Signs out platform super-users after idle minutes on the apex domain.
 */
export function usePlatformSessionTimeout({
  enabled,
  onTimeout,
  minutes = PLATFORM_IDLE_SESSION_TIMEOUT_MINUTES,
}: PlatformSessionTimeoutOptions): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const reset = (): void => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        notify.info(translateApp('platform.sessionEndedTitle', 'en'), {
          description: translateApp('platform.sessionEndedDesc', 'en'),
        });
        onTimeout();
      }, minutes * 60 * 1000);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
    events.forEach((activityEventName) => window.addEventListener(activityEventName, reset, { passive: true }));
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((activityEventName) => window.removeEventListener(activityEventName, reset));
    };
  }, [enabled, minutes, onTimeout]);
}

export default usePlatformSessionTimeout;
