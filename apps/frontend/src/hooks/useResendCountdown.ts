import { useEffect, useState } from "react";

/** Countdown timer for OTP resend buttons (seconds). Pass `cycle` to restart after resend. */
export function useResendCountdown(active: boolean, seconds = 30, cycle = 0): number {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!active) return;
    setRemaining(seconds);
  }, [active, seconds, cycle]);

  useEffect(() => {
    if (!active || remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [active, remaining]);

  return remaining;
}
