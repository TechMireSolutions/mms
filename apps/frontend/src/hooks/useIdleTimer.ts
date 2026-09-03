import { useEffect, useRef, useState } from "react";

export interface UseIdleTimerOptions {
  enabled: boolean;
  timeoutMs: number;
  /** Show the warning and call `onWarn` this long before the deadline (ms). */
  warnBeforeMs?: number;
  onWarn?: () => void;
  onTimeout: () => void;
}

export interface IdleTimerState {
  /** Milliseconds remaining until the idle deadline (0 when expired). */
  remainingMs: number;
  /** True once we are inside the warning window (deadline <= warnBeforeMs). */
  isWarning: boolean;
  /** Manually restart the idle window (used by "stay signed in"). */
  reset: () => void;
}

const IDLE_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const;

/**
 * Server-aware inactivity timer. Returns the remaining idle time (ticked every
 * second) so the UI can render a countdown, and calls `onWarn` when entering the
 * warning window and `onTimeout` when the deadline expires. Any tracked user
 * activity restarts the idle window.
 */
export function useIdleTimer({
  enabled,
  timeoutMs,
  warnBeforeMs = 0,
  onWarn,
  onTimeout,
}: UseIdleTimerOptions): IdleTimerState {
  const [now, setNow] = useState(() => Date.now());
  const deadlineRef = useRef<number>(Date.now() + timeoutMs);
  const warnedRef = useRef(false);
  const timeoutFiredRef = useRef(false);

  const onTimeoutRef = useRef(onTimeout);
  const onWarnRef = useRef(onWarn);
  onTimeoutRef.current = onTimeout;
  onWarnRef.current = onWarn;

  const reset = (): void => {
    deadlineRef.current = Date.now() + timeoutMs;
    warnedRef.current = false;
    timeoutFiredRef.current = false;
    setNow(Date.now());
  };

  useEffect(() => {
    if (!enabled) return;
    const handleEvent = (): void => reset();
    IDLE_EVENTS.forEach((ev) => window.addEventListener(ev, handleEvent, { passive: true }));
    reset();

    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(tick);
      IDLE_EVENTS.forEach((ev) => window.removeEventListener(ev, handleEvent));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, timeoutMs]);

  const remainingMs = Math.max(0, deadlineRef.current - now);
  const isWarning = remainingMs <= warnBeforeMs && warnBeforeMs > 0;

  useEffect(() => {
    if (!enabled) return;
    if (remainingMs <= 0) {
      if (!timeoutFiredRef.current) {
        timeoutFiredRef.current = true;
        onTimeoutRef.current();
      }
      return;
    }
    if (isWarning && !warnedRef.current && onWarnRef.current) {
      warnedRef.current = true;
      onWarnRef.current();
    }
  }, [enabled, remainingMs, isWarning]);

  return { remainingMs, isWarning, reset };
}
