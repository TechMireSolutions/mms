import React, { useMemo } from "react";
import { Hash, SlidersHorizontal, Sparkles } from "lucide-react";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDeterministicEmployeeId, type TeachersSettings } from "@mms/shared";

export interface TeachersPreferencesSectionProps {
  settingsDraft: TeachersSettings;
  upd: <K extends keyof TeachersSettings>(field: K, value: TeachersSettings[K]) => void;
  specializationOptions: string[];
}

const ID_TOKENS = [
  { tag: "{PREFIX}", label: "PREFIX" },
  { tag: "{YYYY}", label: "YYYY" },
  { tag: "{YY}", label: "YY" },
  { tag: "{MM}", label: "MM" },
  { tag: "{SEQ}", label: "SEQ" },
] as const;

/** Teachers Setup Preferences body — Students PreferencesSection analogue. */
export function TeachersPreferencesSection({
  settingsDraft,
  upd,
  specializationOptions,
}: TeachersPreferencesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  const livePreview = useMemo(() => {
    const prefix = settingsDraft.employeeIdPrefix ?? settingsDraft.idPrefix ?? "FAC";
    const yearFormat = (settingsDraft.employeeIdYearFormat ?? "YYYY") as "YYYY" | "YY";
    const sequenceDigits = settingsDraft.employeeIdSequenceDigits ?? settingsDraft.idDigits ?? 4;
    const delimiter = settingsDraft.employeeIdDelimiter ?? "";
    const seq = (settingsDraft.employeeIdCurrentSequence && settingsDraft.employeeIdCurrentSequence > 0)
      ? settingsDraft.employeeIdCurrentSequence + 1
      : (settingsDraft.idStartSeq || 1);

    return formatDeterministicEmployeeId(
      seq,
      {
        prefix,
        yearFormat,
        sequenceDigits,
        delimiter,
      },
    );
  }, [settingsDraft]);

  const insertToken = (tag: string) => {
    const current = settingsDraft.idTemplate ?? "{PREFIX}-{SEQ}";
    if (current.includes(tag)) return;
    // Insert before {SEQ} if present, otherwise append
    if (current.includes("{SEQ}")) {
      upd("idTemplate", current.replace("{SEQ}", `${tag}-{SEQ}`));
    } else {
      upd("idTemplate", `${current}-${tag}`);
    }
  };

  return (
    <div className="space-y-4 text-start">
      {/* Employee ID Format & Generation Card */}
      <SectionCard
        title={t("teachers.settings.idSectionTitle")}
        icon={Hash}
        accentColor="primary"
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="space-y-4">
          {/* Live Preview Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {t("teachers.settings.preview")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="default"
                className="font-mono text-sm px-3 py-1 font-semibold tracking-wider bg-primary text-primary-foreground shadow-xs"
              >
                {livePreview}
              </Badge>
            </div>
          </div>

          {/* Engine Parameters: Prefix, Year Format, Sequence Digits, Delimiter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Field
              label={t("teachers.settings.idPrefix")}
              hint={t("teachers.settings.idPrefixHint")}
              id="teacher-idPrefix"
            >
              <Input
                id="teacher-idPrefix"
                name="teacher-idPrefix"
                className={FORM_INPUT}
                value={settingsDraft.employeeIdPrefix ?? settingsDraft.idPrefix ?? ""}
                onChange={(event) => {
                  const val = event.target.value;
                  upd("employeeIdPrefix", val);
                  upd("idPrefix", val);
                }}
                placeholder="FAC"
              />
            </Field>

            <Field
              label={t("teachers.settings.yearFormat") || "Year Format"}
              hint={t("teachers.settings.yearFormatHint") || "Four-digit (YYYY) or two-digit (YY)"}
              id="teacher-employeeIdYearFormat"
            >
              <FormSelect
                id="teacher-employeeIdYearFormat"
                name="teacher-employeeIdYearFormat"
                value={settingsDraft.employeeIdYearFormat ?? "YYYY"}
                onChange={(val) => upd("employeeIdYearFormat", val as "YYYY" | "YY")}
                options={[
                  { value: "YYYY", label: "YYYY (e.g. 2026)" },
                  { value: "YY", label: "YY (e.g. 26)" },
                ]}
              />
            </Field>

            <Field
              label={t("teachers.settings.idDigits")}
              hint={t("teachers.settings.idDigitsHint")}
              id="teacher-idDigits"
            >
              <Input
                id="teacher-idDigits"
                name="teacher-idDigits"
                type="number"
                min="2"
                max="8"
                className={FORM_INPUT}
                value={settingsDraft.employeeIdSequenceDigits ?? settingsDraft.idDigits ?? 4}
                onChange={(event) => {
                  const val = Number(event.target.value);
                  upd("employeeIdSequenceDigits", val);
                  upd("idDigits", val);
                }}
              />
            </Field>

            <Field
              label={t("teachers.settings.delimiter") || "Delimiter"}
              hint={t("teachers.settings.delimiterHint") || "Optional separator (e.g. - or /)"}
              id="teacher-employeeIdDelimiter"
            >
              <Input
                id="teacher-employeeIdDelimiter"
                name="teacher-employeeIdDelimiter"
                className={FORM_INPUT}
                value={settingsDraft.employeeIdDelimiter ?? ""}
                onChange={(event) => upd("employeeIdDelimiter", event.target.value)}
                placeholder="e.g. - or leave empty"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Field
              label={t("teachers.settings.idStartSeq")}
              hint={t("teachers.settings.idStartSeqHint")}
              id="teacher-idStartSeq"
            >
              <Input
                id="teacher-idStartSeq"
                name="teacher-idStartSeq"
                type="number"
                min="1"
                className={FORM_INPUT}
                value={settingsDraft.idStartSeq ?? 1}
                onChange={(event) => upd("idStartSeq", Number(event.target.value))}
              />
            </Field>

            <div className="flex items-center text-xs text-muted-foreground p-3 rounded-md bg-muted/40 border border-border/40">
              <span>
                Sequence State: {settingsDraft.employeeIdCurrentSequence ?? 0} &middot; Rollover Year: {settingsDraft.employeeIdLastYear ?? new Date().getFullYear()}
              </span>
            </div>
          </div>

          {/* Template Input with Quick Token Badges */}
          <div className="pt-2 border-t border-border/40">
            <Field
              label={t("teachers.settings.idTemplate")}
              hint={t("teachers.settings.idTemplateHint")}
              id="teacher-idTemplate"
            >
              <Input
                id="teacher-idTemplate"
                name="teacher-idTemplate"
                className={FORM_INPUT}
                value={settingsDraft.idTemplate ?? "{PREFIX}-{SEQ}"}
                onChange={(event) => upd("idTemplate", event.target.value)}
                placeholder={t("teachers.settings.idTemplatePlaceholder")}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-xs text-muted-foreground me-1">
                {t("teachers.settings.availableTokens")}:
              </span>
              {ID_TOKENS.map((token) => (
                <button
                  key={token.tag}
                  type="button"
                  onClick={() => insertToken(token.tag)}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-muted hover:bg-primary/10 hover:text-primary transition-colors border border-border/60 cursor-pointer"
                >
                  {token.tag}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            label={t("teachers.settings.idRestartAnnually")}
            description={t("teachers.settings.idRestartAnnuallyDesc")}
            value={settingsDraft.idRestartAnnually ?? false}
            onChange={(value) => upd("idRestartAnnually", value)}
          />
        </div>
      </SectionCard>

      {/* General Faculty Module Configuration Card */}
      <SectionCard
        title={t("teachers.settings.title")}
        icon={SlidersHorizontal}
        accentColor="primary"
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="space-y-4">
          <Field
            label={t("teachers.settings.defaultSpecialization")}
            id="teacher-defaultSpecialization"
          >
            <FormSelect
              id="teacher-defaultSpecialization"
              name="defaultSpecialization"
              value={settingsDraft.defaultSpecialization}
              onChange={(specialization) => upd("defaultSpecialization", specialization)}
              options={specializationOptions}
            />
          </Field>

          <div className="space-y-2 pt-2 border-t border-border/60">
            <ToggleRow
              label={t("teachers.settings.autoGenerateId")}
              value={settingsDraft.autoGenerateId}
              onChange={(value) => upd("autoGenerateId", value)}
            />

            <ToggleRow
              label={t("teachers.settings.requireContactLink")}
              value={settingsDraft.requireContactLink}
              onChange={(value) => upd("requireContactLink", value)}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export const FacultyPreferencesSection = TeachersPreferencesSection;
