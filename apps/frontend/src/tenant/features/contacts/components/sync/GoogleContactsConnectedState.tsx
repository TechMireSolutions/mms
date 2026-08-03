import { CheckCircle2, Loader2, Unlink, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export function GoogleContactsConnectedState({
  canWrite,
  error,
  syncResult,
  syncing,
  onDisconnect,
  onSync,
  t,
}: {
  canWrite: boolean;
  error: string;
  syncResult: {
    total: number;
    imported: number;
    skipped: number;
    skippedName: number;
    skippedUnique: number;
  } | null;
  syncing: boolean;
  onDisconnect: () => void;
  onSync: () => void;
  t: TranslationFunction;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/30 text-success">
        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-success">{t("contacts.sync.googleConnectedTitle")}</p>
          <p className="text-xs text-success/90">{t("contacts.sync.googleConnectedDesc")}</p>
        </div>
        {canWrite && (
          <Button
            type="button"
            variant="outline"
            onClick={onDisconnect}
            className="flex items-center gap-1 text-xs transition-colors border border-border bg-card rounded-lg px-2.5 min-h-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shadow-none"
          >
            <Unlink className="w-3 h-3" />
            <span>{t("contacts.sync.disconnect")}</span>
          </Button>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {syncResult && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-success/10 border border-success/30 text-xs text-success">
          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {t("contacts.sync.syncCompleteTitle", { total: syncResult.total })}
            </p>
            <p className="text-success/90 mt-0.5">
              {t("contacts.sync.syncCompleteDesc", {
                imported: syncResult.imported,
                skipped: syncResult.skipped,
              })}
              {syncResult.skippedUnique > 0
                ? ` ${t("contacts.sync.skippedUniqueCount", { count: syncResult.skippedUnique })}`
                : ""}
            </p>
          </div>
        </div>
      )}

      {canWrite && (
        <Button
          type="button"
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 min-h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-none"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("contacts.sync.syncing")}</span>
            </>
          ) : (
            <>
              <Users className="w-4 h-4" />
              <span>{t("contacts.sync.syncGoogle")}</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
