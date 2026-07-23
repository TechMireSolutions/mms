import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import type { Contact, AppTranslationKey } from "@mms/shared";
import {
  CONTACT_SYNC_FIELD_LABEL_KEYS,
  defaultSyncFieldPicks,
  diffContactForSync,
  mergeContactForSync,
  resolveSyncConflictContactId,
  type SyncFieldPick,
  formatDateTime,
} from "@mms/shared";
import type { ContactsSyncConflict } from "@/lib/contacts/contactsSyncOutbox";
import {
  describeContactsOutboxEntry,
  dismissContactsSyncConflict,
  getContactsSyncConflicts,
  requeueAllContactsSyncConflicts,
  requeueContactsSyncConflict,
} from "@/lib/contacts/contactsSyncOutbox";
import { getSyncConflictKindLabel } from "@/lib/contacts/contactI18n";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactsSyncOutbox } from "@/tenant/features/contacts/hooks/useContactsSyncOutbox";
import { useContactById, useContactMutations } from "@/tenant/features/contacts/hooks/useContacts";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";

interface ContactsSyncConflictPanelProps {
  open: boolean;
  onClose: () => void;
}

function fieldLabel(field: string, t: (key: AppTranslationKey) => string): string {
  const key = CONTACT_SYNC_FIELD_LABEL_KEYS[field as keyof typeof CONTACT_SYNC_FIELD_LABEL_KEYS];
  return key ? t(key as AppTranslationKey) : field;
}

function localContactFromEntry(entry: ContactsSyncConflict): Contact | undefined {
  if (entry.kind === 'upsert' || entry.kind === 'update') return entry.contact;
  return undefined;
}

interface ConflictRowProps {
  entry: ContactsSyncConflict;
  title: string;
  onRequestDismiss: (id: string) => void;
  onResolved: () => void;
}

function ConflictRow({ entry, title, onRequestDismiss, onResolved }: ConflictRowProps): React.JSX.Element {
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
    if (expanded && diffs.length > 0 && Object.keys(fieldPicks).length === 0) {
      setFieldPicks(defaultSyncFieldPicks(diffs));
    }
  }, [expanded, diffs, fieldPicks]);

  const togglePick = (field: string, pick: SyncFieldPick) => {
    setFieldPicks((prev) => ({ ...prev, [field]: pick }));
  };

  const handleKeepMine = useCallback(async () => {
    setApplying(true);
    try {
      requeueContactsSyncConflict(entry.id);
      onResolved();
      notify.info(t('contacts.sync.conflictKeepLocal'));
    } finally {
      setApplying(false);
    }
  }, [entry.id, onResolved, t]);

  const handleUseServer = useCallback(() => {
    dismissContactsSyncConflict(entry.id);
    onResolved();
    notify.info(t('contacts.sync.conflictUseServer'));
  }, [entry.id, onResolved, t]);

  const handleApplyMerge = useCallback(async () => {
    if (!local) return;
    setApplying(true);
    try {
      const merged = mergeContactForSync(local, serverContact, fieldPicks);
      if (entry.kind === 'upsert') {
        await upsertContact.mutateAsync(merged);
      } else if (entry.kind === 'update') {
        await updateContact.mutateAsync({ id: String(merged.id), contact: merged });
      } else if (entry.kind === 'delete' && contactId) {
        await deleteContact.mutateAsync({ id: contactId });
      }
      dismissContactsSyncConflict(entry.id);
      onResolved();
      notify.success(t('contacts.sync.conflictMergeSuccess'));
    } catch {
      notify.error(t('contacts.saveFailed'));
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
            aria-label={expanded ? t('contacts.sync.conflictCollapse') : t('contacts.sync.conflictExpand')}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onRequestDismiss(entry.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label={t('contacts.sync.conflictDismissOne')}
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
              {t('contacts.sync.conflictLoadingServer')}
            </p>
          )}
          {local && diffs.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-foreground">{t('contacts.sync.conflictDiffTitle')}</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left py-1 pr-2 font-medium">{t('contacts.sync.conflictField')}</th>
                    <th className="text-left py-1 pr-2 font-medium">{t('contacts.sync.conflictLocal')}</th>
                    <th className="text-left py-1 font-medium">{t('contacts.sync.conflictServer')}</th>
                  </tr>
                </thead>
                <tbody>
                  {diffs.map((diff) => (
                    <tr key={diff.field} className="border-t border-border/50">
                      <td className="py-1 pr-2 font-medium">{fieldLabel(diff.field, t)}</td>
                      <td className="py-1 pr-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => togglePick(diff.field, 'local')}
                          className={`text-left break-all w-full rounded px-1 h-auto justify-start font-normal ${
                            fieldPicks[diff.field] === 'local' ? 'bg-primary/15 ring-1 ring-primary/40' : 'hover:bg-muted/50'
                          }`}
                        >
                          {diff.local}
                        </Button>
                      </td>
                      <td className="py-1">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => togglePick(diff.field, 'server')}
                          className={`text-left break-all w-full rounded px-1 h-auto justify-start font-normal ${
                            fieldPicks[diff.field] === 'server' ? 'bg-primary/15 ring-1 ring-primary/40' : 'hover:bg-muted/50'
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
              {serverContact ? t('contacts.sync.conflictDiffEmpty') : t('contacts.sync.conflictNoServer')}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{t('contacts.sync.conflictDeleteHint')}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {local && (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={applying}
                  onClick={() => void handleApplyMerge()}
                >
                  {t('contacts.sync.conflictApplyMerge')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={applying}
                  onClick={() => void handleKeepMine()}
                >
                  {t('contacts.sync.conflictKeepLocal')}
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={applying}
              onClick={handleUseServer}
            >
              {t('contacts.sync.conflictUseServer')}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

/** Review panel for offline sync conflicts (globle1 §1.4). */
export default function ContactsSyncConflictPanel({
  open,
  onClose,
}: ContactsSyncConflictPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { flush, refreshCounts } = useContactsSyncOutbox();
  const [conflicts, setConflicts] = useState<ContactsSyncConflict[]>(() => getContactsSyncConflicts());
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [dismissTargetId, setDismissTargetId] = useState<string | null>(null);

  const refreshList = useCallback(() => {
    setConflicts(getContactsSyncConflicts());
    refreshCounts();
  }, [refreshCounts]);

  React.useEffect(() => {
    if (!open) return;
    refreshList();
  }, [open, refreshList]);

  React.useEffect(() => {
    const handler = () => setConflicts(getContactsSyncConflicts());
    window.addEventListener('contacts-sync-outbox-changed', handler);
    return () => window.removeEventListener('contacts-sync-outbox-changed', handler);
  }, []);

  const handleDismiss = useCallback(
    (id: string) => {
      dismissContactsSyncConflict(id);
      refreshList();
      notify.info(t('contacts.sync.conflictDismissed'));
    },
    [refreshList, t],
  );

  const handleRetryAll = useCallback(async () => {
    setRetryingId('__all__');
    try {
      requeueAllContactsSyncConflicts();
      await flush();
      refreshList();
    } finally {
      setRetryingId(null);
    }
  }, [flush, refreshList]);

  const rows = useMemo(
    () =>
      conflicts.map((entry) => {
        const { title } = describeContactsOutboxEntry(entry);
        return { entry, title };
      }),
    [conflicts],
  );

  return (
    <>
    <FormModal
      open={open}
      onClose={onClose}
      title={t('contacts.sync.conflictReviewTitle')}
      size="md"
      cancelLabel={t('common.close')}
      saveLabel={rows.length > 0 ? t('contacts.sync.conflictRetryAll') : t('common.close')}
      onSave={() => (rows.length > 0 ? void handleRetryAll() : onClose())}
      saving={retryingId != null}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('contacts.sync.conflictReviewDesc')}</p>
        {rows.length === 0 ? (
          <p className="text-sm text-foreground">{t('contacts.sync.conflictReviewEmpty')}</p>
        ) : (
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {rows.map(({ entry, title }) => (
              <ConflictRow
                key={entry.id}
                entry={entry}
                title={title}
                onRequestDismiss={setDismissTargetId}
                onResolved={refreshList}
              />
            ))}
          </ul>
        )}
        {rows.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-warning">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {t('contacts.sync.conflictReviewHint')}
          </div>
        )}
      </div>
    </FormModal>
    <ConfirmAlertDialog
      open={dismissTargetId != null}
      onOpenChange={(next) => !next && setDismissTargetId(null)}
      title={t('contacts.sync.conflictDismissConfirmTitle')}
      description={t('contacts.sync.conflictDismissConfirmDesc')}
      confirmLabel={t('contacts.sync.conflictDismissOne')}
      onConfirm={() => {
        if (dismissTargetId) handleDismiss(dismissTargetId);
        setDismissTargetId(null);
      }}
      destructive
    />
    </>
  );
}
