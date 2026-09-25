import React, { useMemo } from "react";
import { Hash } from "lucide-react";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDeterministicEmployeeId, type TeachersSettings } from "@mms/shared";
import { FacultyIdLivePreview } from "./FacultyIdLivePreview";
import { FacultyIdParametersGrid } from "./FacultyIdParametersGrid";

export interface FacultyIdSettingsCardProps {
  settingsDraft: TeachersSettings;
  upd: <K extends keyof TeachersSettings>(field: K, value: TeachersSettings[K]) => void;
}

export function FacultyIdSettingsCard({
  settingsDraft,
  upd,
}: FacultyIdSettingsCardProps): React.JSX.Element {
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
            <FacultyIdParametersGrid
              prefix={prefix}
              yearFormat={yearFormat}
              sequenceDigits={sequenceDigits}
              delimiter={delimiter}
              currentYear={currentYear}
              upd={upd}
            />

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
                  {t("teachers.settings.sequenceTelemetry")}
                </span>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-background border border-border/80">
                    <span className="text-muted-foreground">{t("teachers.settings.currentCounter")}</span>
                    <span className="font-mono font-semibold text-foreground">{currentSeq}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-background border border-border/80">
                    <span className="text-muted-foreground">{t("teachers.settings.rolloverYear")}</span>
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
  );
}
