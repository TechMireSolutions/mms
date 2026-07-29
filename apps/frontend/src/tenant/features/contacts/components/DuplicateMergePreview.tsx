import { useMemo } from "react";
import { AlertTriangle, GitMerge, Loader2 } from "lucide-react";
import { mergeContacts, getDisplayName } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getDuplicateFieldLabel,
  getDuplicateFieldValue,
} from "@/lib/contacts/contactI18n";
import {
  getDuplicateThemeColors,
  type DuplicatePair,
} from "@/tenant/features/contacts/components/duplicateDetectionTypes";

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
  const emptyDash = t("contacts.table.emptyDash");
  const keep = pair.contacts[keepIndex];
  const other = pair.contacts[1 - keepIndex];
  const mergedResult = useMemo(() => mergeContacts(keep, other), [keep, other]);
  const fields = prefs.duplicateDetectionFields || [];

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={t("contacts.duplicates.mergePreview")}
      icon={GitMerge}
      priority
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="min-h-11 px-4 font-medium"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="flex items-center gap-2 px-5 min-h-11 font-semibold"
          >
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
            <span>{confirming ? t("common.loading") : t("contacts.duplicates.confirmMerge")}</span>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className={`${colors.warningBg} rounded-xl p-3 flex gap-2.5`}>
          <AlertTriangle className={`w-4 h-4 ${colors.warningText} flex-shrink-0 mt-0.5`} />
          <p className={`text-xs ${colors.warningText}`}>
            <strong>{getDisplayName(other)}</strong> {t("contacts.duplicates.mergeWarning")}{" "}
            <strong>{getDisplayName(keep)}</strong>.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("contacts.duplicates.mergedResult")}
          </p>
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-foreground">
            {fields.map((field) => {
              const keepValue = getDuplicateFieldValue(field, keep, t);
              const otherValue = getDuplicateFieldValue(field, other, t);
              const mergedValue = getDuplicateFieldValue(field, mergedResult, t);
              const fromOther =
                (!keepValue || keepValue === emptyDash || keepValue === "") &&
                otherValue &&
                otherValue !== emptyDash &&
                otherValue !== "";

              return (
                <div key={field} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24 flex-shrink-0">
                    {getDuplicateFieldLabel(field, t)}:
                  </span>
                  <span className="text-sm font-medium text-foreground flex-1 truncate">
                    {mergedValue || emptyDash}
                  </span>
                  {fromOther && (
                    <span
                      className={`text-xs ${colors.highlightBg} px-1.5 py-0.5 rounded-full font-medium`}
                    >
                      {t("contacts.duplicates.fromDuplicate")}
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
