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
    <WarningCallout
      icon={CloudUpload}
      tone="info"
      role="status"
      density="banner"
      description={
        flushing
          ? t("contacts.sync.syncingPending")
          : t("contacts.sync.pending", { count: pendingCount })
      }
      action={
        !flushing && pendingCount > 0 ? (
          <Button
            type="button"
            variant="link"
            onClick={onFlush}
            className="min-h-11 shrink-0 px-2 text-xs font-semibold text-info underline shadow-none hover:no-underline"
          >
            {t("contacts.sync.retryNow")}
          </Button>
        ) : undefined
      }
    />
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
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="link"
            onClick={onReview}
            className="min-h-11 px-2 text-xs font-semibold text-warning underline shadow-none hover:no-underline"
          >
            {t("contacts.sync.reviewConflicts")}
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={onDismissAll}
            className="min-h-11 px-2 text-xs font-semibold text-warning underline opacity-80 shadow-none hover:no-underline"
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
    <WarningCallout
      icon={AlertCircle}
      tone="destructive"
      role="alert"
      density="banner"
      description={t("contacts.sync.failed")}
    />
  );
}
