import React from "react";
import { Clock, LogOut, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface SessionTimeoutModalProps {
  open: boolean;
  /** Milliseconds remaining before the idle deadline. */
  remainingMs: number;
  onExtend: () => void;
  onSignOut: () => void;
  busy?: boolean;
}

/**
 * Countdown warning shown shortly before a tenant or platform session times out.
 * Lets the user "stay signed in" (sliding extension) or sign out immediately.
 */
export function SessionTimeoutModal({
  open,
  remainingMs,
  onExtend,
  onSignOut,
  busy = false,
}: SessionTimeoutModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!open) return null;

  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("session.timeoutTitle")}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Clock className="h-6 w-6" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold">{t("session.timeoutTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("session.timeoutDesc")}</p>
        <p className="mt-3 text-sm font-medium text-foreground" role="status">
          {t("session.timeoutCountdown", { seconds: String(seconds) })}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Button type="button" size="lg" onClick={onExtend} disabled={busy} className="w-full">
            <TimerReset className="h-4 w-4" aria-hidden />
            {t("session.staySignedIn")}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={onSignOut} disabled={busy} className="w-full">
            <LogOut className="h-4 w-4" aria-hidden />
            {t("session.signOutNow")}
          </Button>
        </div>
      </div>
    </div>
  );
}
