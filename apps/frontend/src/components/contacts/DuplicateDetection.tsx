import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, GitMerge, Check } from "lucide-react";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import useBodyScrollLock from "../../hooks/useBodyScrollLock";
import { applyTitleCaseToContact } from "@mms/shared";
import {
  Contact,
  COLOR_PALETTES,
  ContactPreferences,
  getPhoneNumbers,
  getEmails,
  cleanName,
  mergeContacts
} from "@mms/shared";

interface DuplicatePair {
  id: string;
  confidence: number;
  reason: string;
  contacts: [Contact, Contact];
}

// ── Field Resolvers ─────────────────────────────────────────────────────────

const getLabelForField = (field: string, uiStrings: Record<string, string>): string => {
  const key = `${field}Field`;
  return uiStrings[key] || field;
};

const getValueForField = (field: string, contact: Contact, uiStrings: Record<string, string>): string => {
  if (field === "phone") {
    const ph = (contact.phones || [])[0] || (contact.phone ? { number: contact.phone } : null);
    return ph ? (ph.countryCode ? `${ph.countryCode} ${ph.number}` : ph.number) : uiStrings.emptyDash;
  }
  if (field === "email") {
    return (contact.emails || [])[0]?.address || contact.email || uiStrings.emptyDash;
  }
  const val = contact[field as keyof Contact];
  return (val as string) || uiStrings.emptyDash;
};

// ── Components ─────────────────────────────────────────────────────────────

interface ConfidenceBadgeProps {
  score: number;
  uiStrings: Record<string, string>;
  prefs: ContactPreferences;
}

function ConfidenceBadge({ score, uiStrings, prefs }: ConfidenceBadgeProps): React.JSX.Element {
  const highThreshold = prefs.duplicateDetectionThresholdHigh ?? 90;
  const medThreshold = prefs.duplicateDetectionThresholdMedium ?? 75;
  const highColor = prefs.duplicateDetectionColorHigh ?? COLOR_PALETTES.red.bg;
  const medColor = prefs.duplicateDetectionColorMedium ?? COLOR_PALETTES.amber.bg;
  const lowColor = prefs.duplicateDetectionColorLow ?? COLOR_PALETTES.slate.bg;
  
  const colorClass = score >= highThreshold ? highColor : score >= medThreshold ? medColor : lowColor;
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
      {score}{uiStrings.matchSuffix}
    </span>
  );
}

interface ContactCardProps {
  contact: Contact;
  selected: boolean;
  onSelect: () => void;
  label: string;
}

function ContactCard({ contact, selected, onSelect, label }: ContactCardProps): React.JSX.Element {
  const { uiStrings, prefs } = useContactConfig();
  const fields = prefs.duplicateDetectionFields || [];

  return (
    <div
      onClick={onSelect}
      className={`flex-1 rounded-xl border-2 p-4 cursor-pointer transition-all text-left ${
        selected ? "border-primary bg-primary/[0.03]" : "border-border hover:border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        {selected && <Check className="w-4 h-4 text-primary" />}
      </div>
      <div className="space-y-1.5">
        {fields.map((f) => (
          <div key={f} className="flex items-start gap-2">
            <span className="text-[11px] text-muted-foreground w-14 flex-shrink-0">{getLabelForField(f, uiStrings)}:</span>
            <span className="text-[12px] font-medium text-foreground truncate">{getValueForField(f, contact, uiStrings)}</span>
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
}

function MergePreview({ pair, keepIndex, onClose, onConfirm }: MergePreviewProps): React.JSX.Element {
  const { uiStrings, prefs } = useContactConfig();
  const keep = pair.contacts[keepIndex];
  const other = pair.contacts[1 - keepIndex];
  const mergedResult = mergeContacts(keep, other, uiStrings);
  const fields = prefs.duplicateDetectionFields || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg z-10 text-left"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GitMerge className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">{uiStrings.mergePreview}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label={uiStrings.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className={`${prefs.duplicateDetectionColorWarning ?? COLOR_PALETTES.amber.bg} rounded-xl p-3 flex gap-2.5`}>
            <AlertTriangle className={`w-4 h-4 ${prefs.duplicateDetectionColorWarningText ?? COLOR_PALETTES.amber.text} flex-shrink-0 mt-0.5`} />
            <p className={`text-xs ${prefs.duplicateDetectionColorWarningText ?? COLOR_PALETTES.amber.text}`}>
              <strong>{other.name || other.firstName}</strong> {uiStrings.mergeWarning} <strong>{keep.name || keep.firstName}</strong>.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">{uiStrings.mergedResult}</p>
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-foreground">
              {fields.map((f) => {
                const valKeep = getValueForField(f, keep, uiStrings);
                const valOther = getValueForField(f, other, uiStrings);
                const valMerged = getValueForField(f, mergedResult, uiStrings);

                const fromOther = (!valKeep || valKeep === uiStrings.emptyDash || valKeep === "") && (valOther && valOther !== uiStrings.emptyDash && valOther !== "");

                return (
                  <div key={f} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground w-24 flex-shrink-0">{getLabelForField(f, uiStrings)}:</span>
                    <span className="text-[13px] font-medium text-foreground flex-1 truncate">{valMerged || uiStrings.emptyDash}</span>
                    {fromOther && (
                      <span className={`text-[10px] ${prefs.duplicateDetectionColorHighlight ?? COLOR_PALETTES.blue.bg} px-1.5 py-0.5 rounded-full font-medium`}>
                        {uiStrings.fromDuplicate}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 min-h-[44px] rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors text-foreground bg-card"
          >
            {uiStrings.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 min-h-[44px] rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            <GitMerge className="w-4 h-4" />
            <span>{uiStrings.confirmMerge}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface DuplicateDetectionProps {
  contacts?: Contact[];
  onClose: () => void;
  onMerge: (keepId: string | number, deleteId: string | number, mergedData: Contact) => void;
}

/**
 * DuplicateDetection component that finds duplicate contacts dynamically
 * and allows the user to merge them.
 * @param props Component properties.
 * @returns React element.
 */
export default function DuplicateDetection({
  contacts = [],
  onClose,
  onMerge
}: DuplicateDetectionProps): React.JSX.Element {
  const { uiStrings, prefs } = useContactConfig();
  useBodyScrollLock();
  const [dismissedPairIds, setDismissedPairIds] = useState<Set<string>>(new Set());
  const [mergedPairIds, setMergedPairIds] = useState<Set<string>>(new Set());
  const [keepIndex, setKeepIndex] = useState<Record<string, number>>({});
  const [merging, setMerging] = useState<DuplicatePair | null>(null);

  // ── Dynamic scan for duplicates ──────────────────────────────────────────
  const detectedPairs = useMemo<DuplicatePair[]>(() => {
    const list: DuplicatePair[] = [];
    const n = contacts.length;
    const matchedPairs = new Set<string>();

    for (let i = 0; i < n; i++) {
      const c1 = contacts[i];
      const name1 = cleanName(c1.name || c1.firstName, prefs.namePrefixesToIgnore);
      const phones1 = getPhoneNumbers(c1);
      const emails1 = getEmails(c1);

      for (let j = i + 1; j < n; j++) {
        const c2 = contacts[j];
        const name2 = cleanName(c2.name || c2.firstName, prefs.namePrefixesToIgnore);
        const phones2 = getPhoneNumbers(c2);
        const emails2 = getEmails(c2);

        const phoneMatch = phones1.length > 0 && phones2.length > 0 && phones1.some((val) => phones2.includes(val));
        const emailMatch = emails1.length > 0 && emails2.length > 0 && emails1.some((val) => emails2.includes(val));
        const nameMatch = name1 && name2 && name1 === name2;

        if (phoneMatch || emailMatch || nameMatch) {
          const pairKey = [c1.id, c2.id].sort().join("-");
          if (matchedPairs.has(pairKey)) continue;
          matchedPairs.add(pairKey);

          let confidence = prefs.duplicateDetectionScoreDefault ?? 70;
          let reason = "";

          if (phoneMatch && emailMatch) {
            confidence = prefs.duplicateDetectionScorePhoneEmail ?? 99;
            reason = uiStrings.matchingPhoneAndEmail;
          } else if (phoneMatch) {
            confidence = nameMatch ? (prefs.duplicateDetectionScoreNamePhone ?? 95) : (prefs.duplicateDetectionScorePhone ?? 80);
            reason = nameMatch ? uiStrings.matchingNameAndPhone : uiStrings.matchingPhone;
          } else if (emailMatch) {
            confidence = nameMatch ? (prefs.duplicateDetectionScoreNameEmail ?? 95) : (prefs.duplicateDetectionScoreEmail ?? 80);
            reason = nameMatch ? uiStrings.matchingNameAndEmail : uiStrings.matchingEmail;
          } else if (nameMatch) {
            confidence = prefs.duplicateDetectionScoreName ?? 75;
            reason = uiStrings.matchingNameOnly;
          }

          list.push({
            id: pairKey,
            confidence,
            reason,
            contacts: [c1, c2]
          });
        }
      }
    }
    return list;
  }, [contacts]);

  const activePairs = useMemo<DuplicatePair[]>(() => {
    return detectedPairs.filter((pair) => !dismissedPairIds.has(pair.id) && !mergedPairIds.has(pair.id));
  }, [detectedPairs, dismissedPairIds, mergedPairIds]);

  const handleMergeConfirm = (): void => {
    if (!merging) return;
    const pair = merging;
    const ki = keepIndex[pair.id] ?? 0;
    const keep = pair.contacts[ki];
    const other = pair.contacts[1 - ki];

    const mergedRaw = mergeContacts(keep, other, uiStrings);
    const mergedResult = applyTitleCaseToContact(mergedRaw as Record<string, unknown>) as Contact;

    // Trigger parent state update
    onMerge(keep.id, other.id, mergedResult);

    // Track merged pair locally to update view
    setMergedPairIds((prev) => {
      const next = new Set(prev);
      next.add(pair.id);
      return next;
    });
    setMerging(null);
  };

  const handleDismiss = (pairId: string): void => {
    setDismissedPairIds((prev) => {
      const next = new Set(prev);
      next.add(pairId);
      return next;
    });
  };

  const totalMerged = mergedPairIds.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10 text-left"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${prefs.duplicateDetectionColorWarning ?? COLOR_PALETTES.amber.bg}`}>
              <AlertTriangle className={`w-4 h-4 ${prefs.duplicateDetectionColorWarningText ?? COLOR_PALETTES.amber.text}`} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">{uiStrings.duplicateDetection}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {activePairs.length} {uiStrings.potentialDuplicatesFound}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            aria-label={uiStrings.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Merged badge */}
        {totalMerged > 0 && (
          <div className={`mx-6 mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 ${prefs.duplicateDetectionColorSuccess ?? COLOR_PALETTES.emerald.bg}`}>
            <Check className={`w-4 h-4 ${prefs.duplicateDetectionColorSuccessText ?? COLOR_PALETTES.emerald.text}`} />
            <p className={`text-xs font-medium ${prefs.duplicateDetectionColorSuccessText ?? COLOR_PALETTES.emerald.text}`}>
              {totalMerged} {uiStrings.duplicateCountMerged}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">
          {activePairs.length === 0 ? (
            <div className="py-12 text-center">
              <Check className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">{uiStrings.allDuplicatesResolved}</p>
              <p className="text-xs text-muted-foreground mt-1">{uiStrings.contactListClean}</p>
            </div>
          ) : (
            activePairs.map((pair) => {
              const ki = keepIndex[pair.id] ?? 0;
              return (
                <div key={pair.id} className="rounded-xl border border-border bg-muted/10 overflow-hidden">
                  {/* Pair header */}
                  <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ConfidenceBadge score={pair.confidence} uiStrings={uiStrings} prefs={prefs} />
                      <span className="text-[12px] text-muted-foreground">{pair.reason}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMerging(pair)}
                        className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-all"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>{uiStrings.merge}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismiss(pair.id)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border"
                        title={uiStrings.dismiss}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="p-4">
                    <p className="text-[11px] text-muted-foreground mb-3 font-medium">{uiStrings.selectRecordToKeep}</p>
                    <div className="flex gap-3">
                      {pair.contacts.map((c, idx) => (
                        <ContactCard
                          key={c.id}
                          contact={c}
                          label={idx === 0 ? uiStrings.contactA : uiStrings.contactB}
                          selected={ki === idx}
                          onSelect={() => setKeepIndex((k) => ({ ...k, [pair.id]: idx }))}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-card border border-transparent"
          >
            {uiStrings.close}
          </button>
        </div>
      </motion.div>

      {/* Merge preview modal */}
      <AnimatePresence>
        {merging && (
          <MergePreview
            pair={merging}
            keepIndex={keepIndex[merging.id] ?? 0}
            onClose={() => setMerging(null)}
            onConfirm={handleMergeConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
