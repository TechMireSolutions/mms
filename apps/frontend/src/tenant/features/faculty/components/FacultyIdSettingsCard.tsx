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
      title={t("faculty.settings.idSectionTitle")}
      entityLabel={t("faculty.field.employeeId")}
      config={config}
      onChange={handleChange}
      defaultPrefixPlaceholder="FAC"
      autoGenerateLabel={t("faculty.settings.autoGenerateId")}
      previewLabel={t("faculty.settings.preview")}
      templateLabel={t("faculty.settings.idTemplate")}
      prefixLabel={t("faculty.settings.idPrefix")}
      prefixHint={t("faculty.settings.idPrefixHint")}
      digitsLabel={t("faculty.settings.idDigits")}
      digitsHint={t("faculty.settings.idDigitsHint")}
      startSeqLabel={t("faculty.settings.idStartSeq")}
      startSeqHint={t("faculty.settings.idStartSeqHint")}
      telemetryLabel={t("faculty.settings.sequenceTelemetry")}
      restartLabel={t("faculty.settings.idRestartAnnually")}
      restartDesc={t("faculty.settings.idRestartAnnuallyDesc")}
    />
  );
}
