import React, { useMemo, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  facultySettingsToSequenceConfig,
  buildSequenceFormulaTemplate,
  type TeachersSettings,
  type SequenceNumberingConfig,
} from "@mms/shared";
import { SequenceNumberingCard } from "@/components/ui/sequence-numbering";

export interface FacultyIdSettingsCardProps {
  settingsDraft: TeachersSettings;
  upd: <K extends keyof TeachersSettings>(field: K, value: TeachersSettings[K]) => void;
}

export function FacultyIdSettingsCard({
  settingsDraft,
  upd,
}: FacultyIdSettingsCardProps): React.JSX.Element {
  const { t } = useTranslation();

  const config = useMemo(
    () => facultySettingsToSequenceConfig(settingsDraft),
    [settingsDraft]
  );

  const handleChange = useCallback(
    (next: SequenceNumberingConfig) => {
      upd("autoGenerateId", next.autoGenerate);
      upd("employeeIdPrefix", next.prefix);
      upd("idPrefix", next.prefix);
      upd("employeeIdYearFormat", next.yearFormat as "YYYY" | "YY");
      upd("employeeIdSequenceDigits", next.sequenceDigits);
      upd("idDigits", next.sequenceDigits);
      upd("employeeIdDelimiter", next.delimiter);
      upd("idStartSeq", next.startingSequence);
      upd("idRestartAnnually", next.rolloverPolicy !== "never");
      upd("idTemplate", buildSequenceFormulaTemplate(next));
    },
    [upd]
  );

  return (
    <SequenceNumberingCard
      title={t("faculty.settings.idSectionTitle") || t("teachers.settings.idSectionTitle") || "Employee ID Configuration"}
      entityLabel="Employee ID"
      config={config}
      onChange={handleChange}
      defaultPrefixPlaceholder="FAC"
      autoGenerateLabel={t("faculty.settings.autoGenerateId") || t("teachers.settings.autoGenerateId")}
      previewLabel={t("faculty.settings.preview") || t("teachers.settings.preview")}
      templateLabel={t("faculty.settings.idTemplate") || t("teachers.settings.idTemplate")}
      prefixLabel={t("faculty.settings.idPrefix") || t("teachers.settings.idPrefix")}
      prefixHint={t("faculty.settings.idPrefixHint") || t("teachers.settings.idPrefixHint")}
      digitsLabel={t("faculty.settings.idDigits") || t("teachers.settings.idDigits")}
      digitsHint={t("faculty.settings.idDigitsHint") || t("teachers.settings.idDigitsHint")}
      startSeqLabel={t("faculty.settings.idStartSeq") || t("teachers.settings.idStartSeq")}
      startSeqHint={t("faculty.settings.idStartSeqHint") || t("teachers.settings.idStartSeqHint")}
      telemetryLabel={t("faculty.settings.sequenceTelemetry") || t("teachers.settings.sequenceTelemetry")}
      restartLabel={t("faculty.settings.idRestartAnnually") || t("teachers.settings.idRestartAnnually")}
      restartDesc={t("faculty.settings.idRestartAnnuallyDesc") || t("teachers.settings.idRestartAnnuallyDesc")}
    />
  );
}
