import { useEffect, useRef } from "react";

interface UseIdleTimerOptions {
  enabled: boolean;
  timeoutMinutes: number;
  onTimeout: () => void;
}

const IDLE_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const;

/**
 * Hook that calls onTimeout after a period of user inactivity.
 */
export function useIdleTimer({ enabled, timeoutMinutes, onTimeout }: UseIdleTimerOptions): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const reset = (): void => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onTimeout();
      }, timeoutMinutes * 60 * 1000);
    };

    const handleEvent = (): void => {
      reset();
    };

    IDLE_EVENTS.forEach((ev) => window.addEventListener(ev, handleEvent, { passive: true }));
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      IDLE_EVENTS.forEach((ev) => window.removeEventListener(ev, handleEvent));
    };
  }, [enabled, timeoutMinutes, onTimeout]);
}
