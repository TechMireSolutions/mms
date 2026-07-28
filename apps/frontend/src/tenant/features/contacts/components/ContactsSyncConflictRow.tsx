import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import type { Contact } from "@mms/shared";
import {
  defaultSyncFieldPicks,
  diffContactForSync,
  mergeContactForSync,
  resolveSyncConflictContactId,
  type SyncFieldPick,
  formatDateTime,
} from "@mms/shared";
import type { ContactsSyncConflict } from "@/lib/contacts/contactsSyncOutbox";
import {
  dismissContactsSyncConflict,
  requeueContactsSyncConflict,
} from "@/lib/contacts/contactsSyncOutbox";
import { getSyncConflictKindLabel, resolveSyncFieldLabel } from "@/lib/contacts/contactI18n";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactById, useContactMutations } from "@/tenant/features/contacts/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";

function localContactFromEntry(entry: ContactsSyncConflict): Contact | undefined {
  if (entry.kind === "upsert" || entry.kind === "update") return entry.contact;
  return undefined;
}

export interface ContactsSyncConflictRowProps {
  entry: ContactsSyncConflict;
  title: string;
  onRequestDismiss: (id: string) => void;
  onResolved: () => void;
}

export function ContactsSyncConflictRow({
  entry,
  title,
  onRequestDismiss,
  onResolved,
}: ContactsSyncConflictRowProps): JSX.Element {
  const { t } = useTranslation();
  const { updateContact, upsertContact, deleteContact } = useContactMutations();
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);
  const [fieldPicks, setFieldPicks] = useState<Record<string, SyncFieldPick>>({});

  const local = localContactFromEntry(entry);
  const contactId = resolveSyncConflictContactId(entry);
  const { data: serverContact, isFetching: serverLoading } = useContactById(contactId, expanded && Boolean(contactId));

  const diffs = useMemo(() => {
    if (!local) return [];
    return diffContactForSync(local, serverContact);
  }, [local, serverContact]);

  useEffect(() => {
    if (expanded && !serverLoading && diffs.length > 0 && Object.keys(fieldPicks).length === 0) {
      setFieldPicks(defaultSyncFieldPicks(diffs));
    }
  }, [expanded, serverLoading, diffs, fieldPicks]);

  const togglePick = (field: string, pick: SyncFieldPick) => {
    setFieldPicks((prev) => ({ ...prev, [field]: pick }));
  };

  const handleKeepMine = useCallback(async () => {
    setApplying(true);
    try {
      requeueContactsSyncConflict(entry.id);
      onResolved();
      notify.info(t("contacts.sync.conflictKeepLocal"));
    } finally {
      setApplying(false);
    }
  }, [entry.id, onResolved, t]);

  const handleUseServer = useCallback(() => {
    dismissContactsSyncConflict(entry.id);
    onResolved();
    notify.info(t("contacts.sync.conflictUseServer"));
  }, [entry.id, onResolved, t]);

  const handleApplyMerge = useCallback(async () => {
    if (!local) return;
    setApplying(true);
    try {
      const merged = mergeContactForSync(local, serverContact, fieldPicks);
      if (entry.kind === "upsert") {
        await upsertContact.mutateAsync(merged);
      } else if (entry.kind === "update") {
        await updateContact.mutateAsync({ id: String(merged.id), contact: merged });
      } else if (entry.kind === "delete" && contactId) {
        await deleteContact.mutateAsync({ id: contactId });
      }
      dismissContactsSyncConflict(entry.id);
      onResolved();
      notify.success(t("contacts.sync.conflictMergeSuccess"));
    } catch {
      notify.error(t("contacts.saveFailed"));
    } finally {
      setApplying(false);
    }
  }, [
    local,
    serverContact,
    fieldPicks,
    entry.kind,
    entry.id,
    contactId,
    upsertContact,
    updateContact,
    deleteContact,
    onResolved,
    t,
  ]);

  return (
    <li className="rounded-xl border border-warning/30 bg-warning/5 overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getSyncConflictKindLabel(entry.kind, t)} · {formatDateTime(entry.failedAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setExpanded((v) => !v)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            aria-expanded={expanded}
            aria-label={expanded ? t("contacts.sync.conflictCollapse") : t("contacts.sync.conflictExpand")}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onRequestDismiss(entry.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label={t("contacts.sync.conflictDismissOne")}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {expanded && (
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
                          onClick={() => togglePick(diff.field, "local")}
                          className={`text-start break-all w-full rounded px-1 h-auto justify-start font-normal ${
                            fieldPicks[diff.field] === "local" ? "bg-primary/15 ring-1 ring-primary/40" : "hover:bg-muted/50"
                          }`}
                        >
                          {diff.local}
                        </Button>
                      </td>
                      <td className="py-1">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => togglePick(diff.field, "server")}
                          className={`text-start break-all w-full rounded px-1 h-auto justify-start font-normal ${
                            fieldPicks[diff.field] === "server" ? "bg-primary/15 ring-1 ring-primary/40" : "hover:bg-muted/50"
                          }`}
                        >
                          {diff.server}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <Button
                type="button"
                size="sm"
                disabled={applying}
                onClick={() => void handleApplyMerge()}
              >
                {t("contacts.sync.conflictApplyMerge")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={applying}
              onClick={() => void handleKeepMine()}
            >
              {t("contacts.sync.conflictKeepLocal")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={applying}
              onClick={handleUseServer}
            >
              {t("contacts.sync.conflictUseServer")}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
