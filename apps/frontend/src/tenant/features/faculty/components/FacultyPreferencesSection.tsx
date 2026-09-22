import React, { useMemo } from "react";
import { Hash, SlidersHorizontal } from "lucide-react";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { formatDeterministicEmployeeId, type TeachersSettings } from "@mms/shared";
import { FacultyIdLivePreview } from "./FacultyIdLivePreview";

export interface TeachersPreferencesSectionProps {
  settingsDraft: TeachersSettings;
  upd: <K extends keyof TeachersSettings>(field: K, value: TeachersSettings[K]) => void;
  specializationOptions: string[];
}

const DELIMITER_PRESETS = [
  { label: "None", value: "" },
  { label: "Hyphen (-)", value: "-" },
  { label: "Slash (/)", value: "/" },
  { label: "Dot (.)", value: "." },
] as const;

/** Teachers Setup Preferences body — modernized and streamlined. */
export function TeachersPreferencesSection({
  settingsDraft,
  upd,
  specializationOptions,
}: TeachersPreferencesSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const prefix = settingsDraft.employeeIdPrefix ?? settingsDraft.idPrefix ?? "FAC";
  const yearFormat = (settingsDraft.employeeIdYearFormat ?? "YYYY") as "YYYY" | "YY";
  const sequenceDigits = settingsDraft.employeeIdSequenceDigits ?? settingsDraft.idDigits ?? 4;
  const delimiter = settingsDraft.employeeIdDelimiter ?? "";
  const currentSeq = settingsDraft.employeeIdCurrentSequence ?? 0;
  const lastYear = settingsDraft.employeeIdLastYear ?? currentYear;

  const livePreview = useMemo(() => {
    const seq = currentSeq > 0 ? currentSeq + 1 : (settingsDraft.idStartSeq || 1);
    return formatDeterministicEmployeeId(seq, {
      prefix,
      yearFormat,
      sequenceDigits,
      delimiter,
    });
  }, [currentSeq, settingsDraft.idStartSeq, prefix, yearFormat, sequenceDigits, delimiter]);

  const formulaTemplate = useMemo(() => {
    return `{PREFIX}${delimiter}{${yearFormat}}${delimiter}{SEQ}`;
  }, [delimiter, yearFormat]);

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
          {/* Master Auto-generation switch */}
          <ToggleRow
            label={t("teachers.settings.autoGenerateId")}
            value={settingsDraft.autoGenerateId}
            onChange={(value) => upd("autoGenerateId", value)}
          />

          {settingsDraft.autoGenerateId !== false && (
            <>
              {/* Live Preview Card */}
              <FacultyIdLivePreview
                livePreview={livePreview}
                formulaTemplate={formulaTemplate}
                previewLabel={t("teachers.settings.preview")}
                templateLabel={t("teachers.settings.idTemplate")}
              />

              {/* Core Parameters Grid: Prefix, Year Format, Sequence Digits, Delimiter */}
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
                    value={prefix}
                    onChange={(event) => {
                      const val = event.target.value.toUpperCase();
                      upd("employeeIdPrefix", val);
                      upd("idPrefix", val);
                      upd("idTemplate", `{PREFIX}${delimiter}{${yearFormat}}${delimiter}{SEQ}`);
                    }}
                    placeholder="FAC"
                  />
                </Field>

                <Field
                  label={t("teachers.settings.yearFormat") || "Year Format"}
                  hint={t("teachers.settings.yearFormatHint") || "Four-digit or two-digit year"}
                  id="teacher-employeeIdYearFormat"
                >
                  <FormSelect
                    id="teacher-employeeIdYearFormat"
                    name="teacher-employeeIdYearFormat"
                    value={yearFormat}
                    onChange={(val) => {
                      upd("employeeIdYearFormat", val as "YYYY" | "YY");
                      upd("idTemplate", `{PREFIX}${delimiter}{${val}}${delimiter}{SEQ}`);
                    }}
                    options={[
                      { value: "YYYY", label: `YYYY (e.g. ${currentYear})` },
                      { value: "YY", label: `YY (e.g. ${String(currentYear).slice(-2)})` },
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
                    value={sequenceDigits}
                    onChange={(event) => {
                      const val = Math.max(2, Math.min(8, Number(event.target.value) || 2));
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
                  <div className="space-y-1.5">
                    <Input
                      id="teacher-employeeIdDelimiter"
                      name="teacher-employeeIdDelimiter"
                      className={FORM_INPUT}
                      value={delimiter}
                      onChange={(event) => {
                        const val = event.target.value;
                        upd("employeeIdDelimiter", val);
                        upd("idTemplate", `{PREFIX}${val}{${yearFormat}}${val}{SEQ}`);
                      }}
                      placeholder="e.g. - or leave empty"
                    />
                    <div className="flex flex-wrap items-center gap-1">
                      {DELIMITER_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            upd("employeeIdDelimiter", preset.value);
                            upd("idTemplate", `{PREFIX}${preset.value}{${yearFormat}}${preset.value}{SEQ}`);
                          }}
                          className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-mono transition-colors border cursor-pointer",
                            delimiter === preset.value
                              ? "bg-primary text-primary-foreground border-primary font-semibold"
                              : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60"
                          )}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </Field>
              </div>

              {/* Starting Sequence & Live Telemetry Box */}
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
                    onChange={(event) => upd("idStartSeq", Math.max(1, Number(event.target.value) || 1))}
                  />
                </Field>

                <div className="flex flex-col justify-center p-3 rounded-lg border border-border/60 bg-muted/25 space-y-1">
                  <span className="text-xs font-medium text-foreground">
                    Sequence Telemetry
                  </span>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-background border border-border/80">
                      <span className="text-muted-foreground">Current Counter:</span>
                      <span className="font-mono font-semibold text-foreground">{currentSeq}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-background border border-border/80">
                      <span className="text-muted-foreground">Rollover Year:</span>
                      <span className="font-mono font-semibold text-foreground">{lastYear}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Annual Rollover Toggle */}
              <div className="pt-2 border-t border-border/40">
                <ToggleRow
                  label={t("teachers.settings.idRestartAnnually")}
                  description={t("teachers.settings.idRestartAnnuallyDesc")}
                  value={settingsDraft.idRestartAnnually ?? true}
                  onChange={(value) => upd("idRestartAnnually", value)}
                />
              </div>
            </>
          )}
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

          <div className="pt-2 border-t border-border/60">
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
