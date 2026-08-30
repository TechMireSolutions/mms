import type React from "react";
import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import type { ContactPreferences } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard } from "@/components/ui/SectionCard";
import { Field } from "@/components/ui/FormPrimitives";
import { FORM_INPUT, FORM_LABEL, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { getDuplicateFieldLabel } from "@/lib/contacts/contactI18n";

/** Toggleable duplicate-detection fields (subset of the canonical field-id set). */
const DUPLICATE_DETECTION_FIELD_IDS = ["name", "phone", "email", "cnic"] as const;

export interface ContactsPreferencesDuplicateSectionProps {
  prefs: ContactPreferences;
  isPrefsDirty?: boolean;
  onUpdatePreference: <K extends keyof ContactPreferences>(
    key: K,
    value: ContactPreferences[K],
  ) => void;
}

export function ContactsPreferencesDuplicateSection({
  prefs,
  isPrefsDirty,
  onUpdatePreference,
}: ContactsPreferencesDuplicateSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const detectionFields = prefs.duplicateDetectionFields ?? ["name", "phone", "email", "cnic"];

  const [namePrefixesDraft, setNamePrefixesDraft] = useState(
    () => (prefs.namePrefixesToIgnore ?? []).join(", "),
  );

  useEffect(() => {
    if (isPrefsDirty) return;
    setNamePrefixesDraft((prefs.namePrefixesToIgnore ?? []).join(", "));
  }, [prefs.namePrefixesToIgnore, isPrefsDirty]);

  const toggleDetectionField = (fieldId: string, enabled: boolean) => {
    const next = enabled
      ? Array.from(new Set([...detectionFields, fieldId]))
      : detectionFields.filter((field) => field !== fieldId);
    onUpdatePreference("duplicateDetectionFields", next.length > 0 ? next : ["name"]);
  };

  return (
    <SectionCard
      title={t("contacts.setup.duplicateDetection")}
      icon={Copy}
      headingLevel={2}
      className={SETUP_SECTION_CARD_CLASS}
    >
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">{t("contacts.setup.duplicateDetectionDesc")}</p>
        <fieldset className="space-y-2">
          <legend className={FORM_LABEL}>{t("contacts.setup.duplicateFields")}</legend>
          <div className="flex flex-wrap gap-3">
            {DUPLICATE_DETECTION_FIELD_IDS.map((option) => {
              const checked = detectionFields.includes(option);
              const checkboxId = `dup-field-${option}`;
              return (
                <label
                  key={option}
                  htmlFor={checkboxId}
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={checked}
                    onCheckedChange={(value) => toggleDetectionField(option, value === true)}
                  />
                  <span>{getDuplicateFieldLabel(option, t)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Field
          label={t("contacts.setup.namePrefixesToIgnore")}
          hint={t("contacts.setup.namePrefixesToIgnoreDesc")}
        >
          <Input
            id="namePrefixesToIgnore"
            className={FORM_INPUT}
            value={namePrefixesDraft}
            onChange={(e) => {
              const raw = e.target.value;
              setNamePrefixesDraft(raw);
              const next = raw
                .split(",")
                .map((prefix) => prefix.trim())
                .filter(Boolean);
              onUpdatePreference("namePrefixesToIgnore", next);
            }}
            placeholder={t("contacts.setup.namePrefixesToIgnorePlaceholder")}
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("contacts.setup.duplicateThresholdHigh")}>
            <Input
              id="dupThresholdHigh"
              type="number"
              min={1}
              max={100}
              className={FORM_INPUT}
              value={prefs.duplicateDetectionThresholdHigh ?? 90}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                onUpdatePreference(
                  "duplicateDetectionThresholdHigh",
                  Number.isFinite(parsed) ? parsed : (prefs.duplicateDetectionThresholdHigh ?? 90),
                );
              }}
            />
          </Field>
          <Field label={t("contacts.setup.duplicateThresholdMedium")}>
            <Input
              id="dupThresholdMedium"
              type="number"
              min={1}
              max={100}
              className={FORM_INPUT}
              value={prefs.duplicateDetectionThresholdMedium ?? 75}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                onUpdatePreference(
                  "duplicateDetectionThresholdMedium",
                  Number.isFinite(parsed) ? parsed : (prefs.duplicateDetectionThresholdMedium ?? 75),
                );
              }}
            />
          </Field>
        </div>
      </div>
    </SectionCard>
  );
}
