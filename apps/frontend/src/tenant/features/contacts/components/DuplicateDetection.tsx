import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { X, AlertTriangle, GitMerge, Check, Loader2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { reportClientError } from "@/lib/clientErrorReporting";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactsDuplicatePairs } from "@/tenant/features/contacts/hooks/useContacts";
import {
  DUPLICATE_REASON_I18N,
  getDuplicateFieldLabel,
  getDuplicateFieldValue,
} from "@/lib/contacts/contactI18n";
import { cn } from "@/lib/utils";
import {
  Contact,
  ContactPreferences,
  DEFAULT_CONTACT_PREFERENCES,
  AppTranslationKey,
  applyTitleCaseToContact,
  mergeContacts,
  findContactDuplicatePairs,
  getDisplayName,
  getDuplicateConfidenceBadgeStyle,
} from "@mms/shared";
import { Modal } from "@/components/ui/Modal";

interface DuplicatePair {
  id: string;
  confidence: number;
  reason: string;
  contacts: [Contact, Contact];
}

interface ConfidenceBadgeProps {
  score: number;
  prefs: Partial<ContactPreferences>;
}

function getDuplicateThemeColors(prefs?: Partial<ContactPreferences>) {
  return {
    warningBg: prefs?.duplicateDetectionColorWarning ?? DEFAULT_CONTACT_PREFERENCES.duplicateDetectionColorWarning!,
    warningText: prefs?.duplicateDetectionColorWarningText ?? DEFAULT_CONTACT_PREFERENCES.duplicateDetectionColorWarningText!,
    successBg: prefs?.duplicateDetectionColorSuccess ?? DEFAULT_CONTACT_PREFERENCES.duplicateDetectionColorSuccess!,
    successText: prefs?.duplicateDetectionColorSuccessText ?? DEFAULT_CONTACT_PREFERENCES.duplicateDetectionColorSuccessText!,
    highlightBg: prefs?.duplicateDetectionColorHighlight ?? DEFAULT_CONTACT_PREFERENCES.duplicateDetectionColorHighlight!,
  };
}

function mapPairToViewModel(
  pair: { id: string; confidence: number; reasonKey: keyof typeof DUPLICATE_REASON_I18N; contacts: [Contact, Contact] },
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string,
): DuplicatePair {
  const i18nKey = DUPLICATE_REASON_I18N[pair.reasonKey];
  return {
    id: pair.id,
    confidence: pair.confidence,
    reason: i18nKey ? t(i18nKey) : pair.reasonKey,
    contacts: pair.contacts,
  };
}

function ConfidenceBadge({ score, prefs }: ConfidenceBadgeProps): JSX.Element {
  const { t } = useTranslation();
  const { colorClass } = getDuplicateConfidenceBadgeStyle(score, prefs);
  return (
    <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", colorClass)}>
      {score}{t('contacts.duplicates.matchSuffix')}
    </span>
  );
}

interface ContactCardProps {
  contact: Contact;
  selected: boolean;
  onSelect: () => void;
  label: string;
}

function ContactCard({ contact, selected, onSelect, label }: ContactCardProps): JSX.Element {
  const { prefs } = useContactConfig();
  const { t } = useTranslation();
  const fields = prefs.duplicateDetectionFields || [];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`flex-1 rounded-xl border-2 p-4 cursor-pointer transition-all text-left ${
        selected ? "border-primary bg-primary/[0.03]" : "border-border hover:border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        {selected && <Check className="w-4 h-4 text-primary" />}
      </div>
      <div className="space-y-1.5">
        {fields.map((field) => (
          <div key={field} className="flex items-start gap-2">
            <span className="text-[11px] text-muted-foreground w-14 flex-shrink-0">{getDuplicateFieldLabel(field, t)}:</span>
            <span className="text-[12px] font-medium text-foreground truncate">{getDuplicateFieldValue(field, contact, t)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MergePreviewProps {
  pair: DuplicatePair;
  keepIndex: number;
  onClose: () => void;
  onConfirm: () => void;
  confirming?: boolean;
}

function MergePreview({ pair, keepIndex, onClose, onConfirm, confirming }: MergePreviewProps): JSX.Element {
  const { prefs } = useContactConfig();
  const { t } = useTranslation();
  const colors = useMemo(() => getDuplicateThemeColors(prefs), [prefs]);
  const emptyDash = t('contacts.table.emptyDash');
  const keep = pair.contacts[keepIndex];
  const other = pair.contacts[1 - keepIndex];
  const mergedResult = useMemo(() => mergeContacts(keep, other), [keep, other]);
  const fields = prefs.duplicateDetectionFields || [];

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={t('contacts.duplicates.mergePreview')}
      icon={GitMerge}
      priority
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="min-h-[44px] px-4 font-medium"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="flex items-center gap-2 px-5 min-h-[44px] font-semibold"
          >
            {confirming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GitMerge className="w-4 h-4" />
            )}
            <span>{confirming ? t('common.loading') : t('contacts.duplicates.confirmMerge')}</span>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className={`${colors.warningBg} rounded-xl p-3 flex gap-2.5`}>
          <AlertTriangle className={`w-4 h-4 ${colors.warningText} flex-shrink-0 mt-0.5`} />
          <p className={`text-xs ${colors.warningText}`}>
            <strong>{getDisplayName(other)}</strong> {t('contacts.duplicates.mergeWarning')} <strong>{getDisplayName(keep)}</strong>.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t('contacts.duplicates.mergedResult')}</p>
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-foreground">
            {fields.map((field) => {
              const keepValue = getDuplicateFieldValue(field, keep, t);
              const otherValue = getDuplicateFieldValue(field, other, t);
              const mergedValue = getDuplicateFieldValue(field, mergedResult, t);

              const fromOther = (!keepValue || keepValue === emptyDash || keepValue === "") && (otherValue && otherValue !== emptyDash && otherValue !== "");

              return (
                <div key={field} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-24 flex-shrink-0">{getDuplicateFieldLabel(field, t)}:</span>
                  <span className="text-[13px] font-medium text-foreground flex-1 truncate">{mergedValue || emptyDash}</span>
                  {fromOther && (
                    <span className={`text-[10px] ${colors.highlightBg} px-1.5 py-0.5 rounded-full font-medium`}>
                      {t('contacts.duplicates.fromDuplicate')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface DuplicateDetectionProps {
  contacts?: Contact[];
  onClose: () => void;
  onMerge: (keepId: string | number, deleteId: string | number, mergedData: Contact) => Promise<void>;
  canWrite?: boolean;
}

/**
 * DuplicateDetection component that finds duplicate contacts dynamically
 * and allows the user to merge them.
 */
export default function DuplicateDetection({
  contacts = [],
  onClose,
  onMerge,
  canWrite = false,
}: DuplicateDetectionProps): JSX.Element {
  const { prefs } = useContactConfig();
  const { t } = useTranslation();
  const colors = useMemo(() => getDuplicateThemeColors(prefs), [prefs]);
  const [dupPage, setDupPage] = useState(1);
  const { data: serverPairs, isLoading: pairsLoading, isFetching: pairsFetching } = useContactsDuplicatePairs({
    page: dupPage,
    limit: 50,
  });
  const [dismissedPairIds, setDismissedPairIds] = useState<Set<string>>(new Set());
  const [mergedPairIds, setMergedPairIds] = useState<Set<string>>(new Set());
  const [keepIndex, setKeepIndex] = useState<Record<string, number>>({});
  const [merging, setMerging] = useState<DuplicatePair | null>(null);
  const [loadedPairs, setLoadedPairs] = useState<DuplicatePair[]>([]);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!serverPairs?.pairs) return;
    const mappedPairs = serverPairs.pairs.map((pair) => mapPairToViewModel(pair, t));
    setLoadedPairs((prev) => {
      if (dupPage <= 1) return mappedPairs;
      const byId = new Map(prev.map((previousPair) => [previousPair.id, previousPair]));
      for (const mappedPair of mappedPairs) byId.set(mappedPair.id, mappedPair);
      return [...byId.values()];
    });
  }, [serverPairs, dupPage, t]);

  const detectedPairs = useMemo<DuplicatePair[]>(() => {
    if (loadedPairs.length > 0) return loadedPairs;
    return findContactDuplicatePairs(contacts, prefs).map((pair) => mapPairToViewModel(pair, t));
  }, [loadedPairs, contacts, prefs, t]);

  const handleLoadMoreDuplicates = useCallback(() => {
    if (serverPairs?.hasMore) setDupPage((currentPage) => currentPage + 1);
  }, [serverPairs?.hasMore]);

  const activePairs = useMemo<DuplicatePair[]>(() => {
    return detectedPairs.filter((pair) => !dismissedPairIds.has(pair.id) && !mergedPairIds.has(pair.id));
  }, [detectedPairs, dismissedPairIds, mergedPairIds]);

  const handleMergeConfirm = async (): Promise<void> => {
    if (!merging || confirming) return;
    const pair = merging;
    const selectedKeepIndex = keepIndex[pair.id] ?? 0;
    const keep = pair.contacts[selectedKeepIndex];
    const other = pair.contacts[1 - selectedKeepIndex];

    const mergedRaw = mergeContacts(keep, other);
    const mergedResult = applyTitleCaseToContact(mergedRaw) as Contact;
    setConfirming(true);
    try {
      await onMerge(keep.id, other.id, mergedResult);
      setMergedPairIds((prev) => new Set(prev).add(pair.id));
      setMerging(null);
    } catch (err) {
      notify.error(t('contacts.saveFailed'));
      reportClientError(err, { scope: 'contacts.duplicate_merge_confirm' });
    } finally {
      setConfirming(false);
    }
  };

  const handleDismiss = (pairId: string): void => {
    setDismissedPairIds((prev) => new Set(prev).add(pairId));
  };

  const totalMerged = mergedPairIds.size;

  return (
    <>
      <Modal
        open={true}
        onClose={onClose}
        title={t('contacts.duplicates.title')}
        subtitle={`${activePairs.length} ${t('contacts.duplicates.potentialFound')}`}
        icon={AlertTriangle}
        size="lg"
        footer={
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="min-h-[44px] px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-transparent hover:bg-muted"
          >
            {t('common.close')}
          </Button>
        }
      >
        <div className="space-y-5">
          {totalMerged > 0 && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${colors.successBg}`}>
              <Check className={`w-4 h-4 ${colors.successText}`} />
              <p className={`text-xs font-medium ${colors.successText}`}>
                {totalMerged} {t('contacts.duplicates.countMerged')}
              </p>
            </div>
          )}

          {!canWrite && activePairs.length > 0 && (
            <div className={`rounded-xl px-4 py-2.5 border ${colors.warningBg}`}>
              <p className={`text-xs ${colors.warningText}`}>
                {t("contacts.duplicatesReadOnly")}
              </p>
            </div>
          )}

          {pairsLoading ? (
            <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">{t("common.loading")}</p>
            </div>
          ) : activePairs.length === 0 ? (
            <div className="py-12 text-center">
              <Check className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">{t('contacts.duplicates.allResolved')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('contacts.duplicates.listClean')}</p>
            </div>
          ) : (
            activePairs.map((pair) => {
              const selectedKeepIndex = keepIndex[pair.id] ?? 0;
              return (
                <div key={pair.id} className="rounded-xl border border-border bg-muted/10 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ConfidenceBadge score={pair.confidence} prefs={prefs} />
                      <span className="text-[12px] text-muted-foreground">{pair.reason}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {canWrite && (
                        <Button
                          type="button"
                          onClick={() => setMerging(pair)}
                          className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg text-[12px] font-semibold"
                        >
                          <GitMerge className="w-3.5 h-3.5" />
                          <span>{t('contacts.duplicates.merge')}</span>
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleDismiss(pair.id)}
                        className="min-w-[44px] min-h-[44px] p-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border"
                        title={t('contacts.duplicates.dismiss')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-[11px] text-muted-foreground mb-3 font-medium">{t('contacts.duplicates.selectKeep')}</p>
                    <div className="flex gap-3">
                      {pair.contacts.map((contact, contactIndex) => (
                        <ContactCard
                          key={contact.id}
                          contact={contact}
                          label={contactIndex === 0 ? t('contacts.duplicates.contactA') : t('contacts.duplicates.contactB')}
                          selected={selectedKeepIndex === contactIndex}
                          onSelect={() => setKeepIndex((previousSelection) => ({ ...previousSelection, [pair.id]: contactIndex }))}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {serverPairs?.hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadMoreDuplicates}
                disabled={pairsFetching}
                className="font-semibold"
              >
                {pairsFetching ? t('common.loading') : t('contacts.duplicates.loadMore')}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <AnimatePresence>
        {merging && (
          <MergePreview
            pair={merging}
            keepIndex={keepIndex[merging.id] ?? 0}
            onClose={() => setMerging(null)}
            onConfirm={handleMergeConfirm}
            confirming={confirming}
          />
        )}
      </AnimatePresence>
    </>
  );
}
