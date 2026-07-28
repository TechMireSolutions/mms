import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, GitMerge, Check, Loader2 } from "lucide-react";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getDuplicateFieldLabel,
  getDuplicateFieldValue,
} from "@/lib/contacts/contactI18n";
import { cn } from "@/lib/utils";
import {
  Contact,
  ContactPreferences,
  DEFAULT_CONTACT_PREFERENCES,
  mergeContacts,
  getDisplayName,
  getDuplicateConfidenceBadgeStyle,
} from "@mms/shared";
import { Modal } from "@/components/ui/Modal";

export interface DuplicatePair {
  id: string;
  confidence: number;
  reason: string;
  contacts: [Contact, Contact];
}

export function getDuplicateThemeColors(prefs?: Partial<ContactPreferences>) {
  const merged = { ...DEFAULT_CONTACT_PREFERENCES, ...prefs };
  return {
    warningBg: merged.duplicateDetectionColorWarning,
    warningText: merged.duplicateDetectionColorWarningText,
    successBg: merged.duplicateDetectionColorSuccess,
    successText: merged.duplicateDetectionColorSuccessText,
    highlightBg: merged.duplicateDetectionColorHighlight,
  };
}

export function ConfidenceBadge({
  score,
  prefs,
}: {
  score: number;
  prefs: Partial<ContactPreferences>;
}): JSX.Element {
  const { t } = useTranslation();
  const { colorClass } = getDuplicateConfidenceBadgeStyle(score, prefs);
  return (
    <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", colorClass)}>
      {score}{t('contacts.duplicates.matchSuffix')}
    </span>
  );
}

export function DuplicateContactCard({
  contact,
  selected,
  onSelect,
  label,
}: {
  contact: Contact;
  selected: boolean;
  onSelect: () => void;
  label: string;
}): JSX.Element {
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
      className={`flex-1 rounded-xl border-2 p-4 cursor-pointer transition-all text-start ${
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

export function MergePreview({
  pair,
  keepIndex,
  onClose,
  onConfirm,
  confirming,
}: {
  pair: DuplicatePair;
  keepIndex: number;
  onClose: () => void;
  onConfirm: () => void;
  confirming?: boolean;
}): JSX.Element {
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
