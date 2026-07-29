import { Loader2 } from "lucide-react";
import type { Contact, SyncFieldPick } from "@mms/shared";
import { resolveSyncFieldLabel } from "@/lib/contacts/contactI18n";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { Button } from "@/components/ui/button";

type SyncDiff = {
  field: string;
  local: string;
  server: string;
};

export function ContactsSyncConflictDiffBody({
  local,
  serverContact,
  serverLoading,
  diffs,
  fieldPicks,
  applying,
  onTogglePick,
  onApplyMerge,
  onKeepMine,
  onUseServer,
  t,
}: {
  local: Contact | undefined;
  serverContact: Contact | undefined;
  serverLoading: boolean;
  diffs: SyncDiff[];
  fieldPicks: Record<string, SyncFieldPick>;
  applying: boolean;
  onTogglePick: (field: string, pick: SyncFieldPick) => void;
  onApplyMerge: () => void;
  onKeepMine: () => void;
  onUseServer: () => void;
  t: TranslationFunction;
}) {
  return (
    <div className="border-t border-warning/20 px-3 py-2.5 bg-background/40 space-y-3">
      {serverLoading && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" />
          {t("contacts.sync.conflictLoadingServer")}
        </p>
      )}

      {local && diffs.length > 0 ? (
        <>
          <p className="text-xs font-semibold text-foreground">{t("contacts.sync.conflictDiffTitle")}</p>
          <div className="overflow-x-auto max-w-full">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-start py-1 pe-2 font-medium">{t("contacts.sync.conflictField")}</th>
                <th className="text-start py-1 pe-2 font-medium">{t("contacts.sync.conflictLocal")}</th>
                <th className="text-start py-1 font-medium">{t("contacts.sync.conflictServer")}</th>
              </tr>
            </thead>
            <tbody>
              {diffs.map((diff) => (
                <tr key={diff.field} className="border-t border-border/50">
                  <td className="py-1 pe-2 font-medium">{resolveSyncFieldLabel(diff.field, t)}</td>
                  <td className="py-1 pe-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onTogglePick(diff.field, "local")}
                      className={`text-start break-all w-full rounded px-1 h-auto justify-start font-normal ${
                        fieldPicks[diff.field] === "local"
                          ? "bg-primary/15 ring-1 ring-primary/40"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {diff.local}
                    </Button>
                  </td>
                  <td className="py-1">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onTogglePick(diff.field, "server")}
                      className={`text-start break-all w-full rounded px-1 h-auto justify-start font-normal ${
                        fieldPicks[diff.field] === "server"
                          ? "bg-primary/15 ring-1 ring-primary/40"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {diff.server}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      ) : local ? (
        <p className="text-xs text-muted-foreground">
          {serverContact ? t("contacts.sync.conflictDiffEmpty") : t("contacts.sync.conflictNoServer")}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{t("contacts.sync.conflictDeleteHint")}</p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {local && (
          <Button type="button" size="sm" disabled={applying} onClick={onApplyMerge}>
            {t("contacts.sync.conflictApplyMerge")}
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" disabled={applying} onClick={onKeepMine}>
          {t("contacts.sync.conflictKeepLocal")}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={applying} onClick={onUseServer}>
          {t("contacts.sync.conflictUseServer")}
        </Button>
      </div>
    </div>
  );
}
