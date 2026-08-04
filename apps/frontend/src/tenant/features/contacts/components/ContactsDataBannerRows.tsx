import { WifiOff, AlertCircle, CloudUpload, AlertTriangle } from "lucide-react";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { Button } from "@/components/ui/button";
import { WarningCallout } from "@/components/ui/WarningCallout";

export function ContactsOfflineBanner({ t }: { t: TranslationFunction }): React.JSX.Element {
  return (
    <WarningCallout
      icon={WifiOff}
      role="status"
      density="banner"
      description={t("contacts.sync.offline")}
    />
  );
}

export function ContactsPendingBanner({
  pendingCount,
  flushing,
  onFlush,
  t,
}: {
  pendingCount: number;
  flushing: boolean;
  onFlush: () => void;
  t: TranslationFunction;
}): React.JSX.Element {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-info"
      role="status"
    >
      <div className="flex items-center gap-2 min-w-0">
        <CloudUpload className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>
          {flushing
            ? t("contacts.sync.syncingPending")
            : t("contacts.sync.pending", { count: pendingCount })}
        </span>
      </div>
      {!flushing && pendingCount > 0 && (
        <Button
          type="button"
          variant="link"
          onClick={onFlush}
          className="shrink-0 text-xs font-semibold underline hover:no-underline min-h-11 px-2 text-info shadow-none"
        >
          {t("contacts.sync.retryNow")}
        </Button>
      )}
    </div>
  );
}

export function ContactsConflictBanner({
  conflictCount,
  onReview,
  onDismissAll,
  t,
}: {
  conflictCount: number;
  onReview?: () => void;
  onDismissAll: () => void;
  t: TranslationFunction;
}): React.JSX.Element {
  return (
    <WarningCallout
      icon={AlertTriangle}
      role="alert"
      density="banner"
      description={t("contacts.sync.conflicts", { count: conflictCount })}
      action={
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="link"
            onClick={onReview}
            className="text-xs font-semibold underline hover:no-underline min-h-11 px-2 text-warning shadow-none"
          >
            {t("contacts.sync.reviewConflicts")}
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={onDismissAll}
            className="text-xs font-semibold underline hover:no-underline opacity-80 min-h-11 px-2 text-warning shadow-none"
          >
            {t("contacts.sync.dismissConflicts")}
          </Button>
        </div>
      }
    />
  );
}

export function ContactsFetchErrorBanner({ t }: { t: TranslationFunction }): React.JSX.Element {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>{t("contacts.sync.failed")}</span>
    </div>
  );
}
