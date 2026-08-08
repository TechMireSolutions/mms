import { Copy } from "lucide-react";
import type { ContactPreferences } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard } from "@/components/ui/SectionCard";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { getDuplicateFieldLabel } from "@/lib/contacts/contactI18n";

/** Toggleable duplicate-detection fields (subset of the canonical field-id set). */
const DUPLICATE_DETECTION_FIELD_IDS = ["name", "phone", "email"] as const;

export function ContactsPreferencesDuplicateSection({
  prefs,
  onUpdatePreference,
}: {
  prefs: ContactPreferences;
  onUpdatePreference: <K extends keyof ContactPreferences>(
    key: K,
    value: ContactPreferences[K],
  ) => void;
}): JSX.Element {
  const { t } = useTranslation();
  const detectionFields = prefs.duplicateDetectionFields ?? ["name", "phone", "email"];

  const toggleDetectionField = (fieldId: string, enabled: boolean) => {
    const next = enabled
      ? Array.from(new Set([...detectionFields, fieldId]))
      : detectionFields.filter((field) => field !== fieldId);
    onUpdatePreference("duplicateDetectionFields", next.length > 0 ? next : ["name"]);
  };

  return (
    <SectionCard title={t("contacts.setup.duplicateDetection")} icon={Copy}>
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
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={FORM_LABEL} htmlFor="dupThresholdHigh">
              {t("contacts.setup.duplicateThresholdHigh")}
            </label>
            <Input
              id="dupThresholdHigh"
              type="number"
              min={1}
              max={100}
              value={prefs.duplicateDetectionThresholdHigh ?? 90}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                onUpdatePreference(
                  "duplicateDetectionThresholdHigh",
                  Number.isFinite(parsed) ? parsed : (prefs.duplicateDetectionThresholdHigh ?? 90),
                );
              }}
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="dupThresholdMedium">
              {t("contacts.setup.duplicateThresholdMedium")}
            </label>
            <Input
              id="dupThresholdMedium"
              type="number"
              min={1}
              max={100}
              value={prefs.duplicateDetectionThresholdMedium ?? 75}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                onUpdatePreference(
                  "duplicateDetectionThresholdMedium",
                  Number.isFinite(parsed) ? parsed : (prefs.duplicateDetectionThresholdMedium ?? 75),
                );
              }}
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
