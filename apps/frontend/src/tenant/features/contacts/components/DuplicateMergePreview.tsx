import { useMemo, useState } from "react";
import { AlertTriangle, Check, GitMerge, Loader2 } from "lucide-react";
import { mergeContacts, getDisplayName, type Contact } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/badge";
import { WarningCallout } from "@/components/ui/WarningCallout";
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
  onConfirm: (mergedCustom?: Contact) => void;
  confirming?: boolean;
}): JSX.Element {
  const { prefs } = useContactConfig();
  const { t } = useTranslation();
  const colors = useMemo(() => getDuplicateThemeColors(prefs), [prefs]);
  const emptyDash = t("contacts.table.emptyDash");
  const keep = pair.contacts[keepIndex];
  const other = pair.contacts[1 - keepIndex];

  // Field override state: maps fieldName -> index (0 for keep, 1 for other)
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, number>>({});

  const defaultMerged = useMemo(() => mergeContacts(keep, other), [keep, other]);

  const customMerged = useMemo(() => {
    const next: Contact = { ...defaultMerged };
    for (const [field, selectedIndex] of Object.entries(fieldOverrides)) {
      const source = selectedIndex === 0 ? keep : other;
      if (field === "name") {
        next.name = source.name || source.firstName || next.name;
        next.firstName = source.firstName ?? next.firstName;
        next.lastName = source.lastName ?? next.lastName;
      } else if (field === "dob") {
        next.dob = source.dob ?? next.dob;
      } else if (field === "gender") {
        next.gender = source.gender ?? next.gender;
      } else if (field === "cnic") {
        next.cnic = source.cnic ?? next.cnic;
      } else if (field === "phone") {
        next.phone = source.phone ?? next.phone;
        if (source.phones && source.phones.length > 0) {
          next.phones = source.phones;
        }
      } else if (field === "email") {
        next.email = source.email ?? next.email;
        if (source.emails && source.emails.length > 0) {
          next.emails = source.emails;
        }
      } else if (field === "address" || field === "city") {
        next.address = source.address ?? next.address;
        next.city = source.city ?? next.city;
        next.state = source.state ?? next.state;
        next.country = source.country ?? next.country;
        if (source.addresses && source.addresses.length > 0) {
          next.addresses = source.addresses;
        }
      } else if (field === "notes") {
        next.notes = source.notes ?? next.notes;
      } else if (field === "tag") {
        next.tag = source.tag ?? next.tag;
        next.tags = source.tags ?? next.tags;
      }
    }
    return next;
  }, [defaultMerged, fieldOverrides, keep, other]);

  const fields = prefs.duplicateDetectionFields || ["name", "phone", "email", "cnic"];

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
            onClick={() => onConfirm(customMerged)}
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
        <WarningCallout
          tone="warning"
          density="compact"
          icon={AlertTriangle}
          description={
            <>
              <strong>{getDisplayName(other)}</strong> {t("contacts.duplicates.mergeWarning")}{" "}
              <strong>{getDisplayName(keep)}</strong>.
            </>
          }
        />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("contacts.duplicates.mergedResult")}
          </p>
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 text-foreground">
            {fields.map((field) => {
              const keepValue = getDuplicateFieldValue(field, keep, t);
              const otherValue = getDuplicateFieldValue(field, other, t);
              const mergedValue = getDuplicateFieldValue(field, customMerged, t);

              const hasConflict =
                keepValue &&
                otherValue &&
                keepValue !== emptyDash &&
                otherValue !== emptyDash &&
                keepValue !== otherValue;

              const fromOther =
                (!keepValue || keepValue === emptyDash || keepValue === "") &&
                otherValue &&
                otherValue !== emptyDash &&
                otherValue !== "";

              const selectedIndex = fieldOverrides[field] ?? 0;

              return (
                <div key={field} className="rounded-lg border border-border/50 bg-background/50 p-2.5">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">
                      {getDuplicateFieldLabel(field, t)}:
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                      {mergedValue || emptyDash}
                    </span>
                    {fromOther && (
                      <Badge pill variant="outline" className={`px-1.5 font-medium ${colors.highlightBg}`}>
                        {t("contacts.duplicates.fromDuplicate")}
                      </Badge>
                    )}
                  </div>

                  {hasConflict && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 text-xs">
                      <span className="text-muted-foreground text-xs font-semibold">Select:</span>
                      <Button
                        type="button"
                        variant={selectedIndex === 0 ? "default" : "secondary"}
                        aria-pressed={selectedIndex === 0}
                        onClick={() =>
                          setFieldOverrides((prev) => ({ ...prev, [field]: 0 }))
                        }
                        className={`min-h-11 rounded-lg px-3 py-2 text-xs gap-1.5 shadow-none ${
                          selectedIndex === 0
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {selectedIndex === 0 && <Check className="w-3.5 h-3.5" />}
                        <span>{t("contacts.duplicates.fieldFromA")}: {keepValue}</span>
                      </Button>
                      <Button
                        type="button"
                        variant={selectedIndex === 1 ? "default" : "secondary"}
                        aria-pressed={selectedIndex === 1}
                        onClick={() =>
                          setFieldOverrides((prev) => ({ ...prev, [field]: 1 }))
                        }
                        className={`min-h-11 rounded-lg px-3 py-2 text-xs gap-1.5 shadow-none ${
                          selectedIndex === 1
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {selectedIndex === 1 && <Check className="w-3.5 h-3.5" />}
                        <span>{t("contacts.duplicates.fieldFromB")}: {otherValue}</span>
                      </Button>
                    </div>
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
