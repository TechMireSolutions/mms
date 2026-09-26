import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import type { TeachersSettings, SequenceYearFormat } from "@mms/shared";
import { SequenceNumberingParametersGrid } from "@/components/ui/sequence-numbering";

export interface FacultyIdParametersGridProps {
  prefix: string;
  yearFormat: "YYYY" | "YY";
  sequenceDigits: number;
  delimiter: string;
  currentYear: number;
  upd: <K extends keyof TeachersSettings>(field: K, value: TeachersSettings[K]) => void;
}

export function FacultyIdParametersGrid({
  prefix,
  yearFormat,
  sequenceDigits,
  delimiter,
  currentYear,
  upd,
}: FacultyIdParametersGridProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <SequenceNumberingParametersGrid
      prefix={prefix}
      yearFormat={yearFormat}
      sequenceDigits={sequenceDigits}
      delimiter={delimiter}
      currentYear={currentYear}
      prefixLabel={t("faculty.settings.idPrefix") || t("teachers.settings.idPrefix") || "Employee ID prefix"}
      prefixHint={t("faculty.settings.idPrefixHint") || t("teachers.settings.idPrefixHint") || "Default prefix used across employee IDs"}
      yearFormatLabel={t("faculty.settings.yearFormat") || t("teachers.settings.yearFormat") || "Year Format"}
      yearFormatHint={t("faculty.settings.yearFormatHint") || t("teachers.settings.yearFormatHint") || "Four-digit (YYYY) or two-digit (YY)"}
      digitsLabel={t("faculty.settings.idDigits") || t("teachers.settings.idDigits") || "Sequence Digits"}
      digitsHint={t("faculty.settings.idDigitsHint") || t("teachers.settings.idDigitsHint") || "e.g., 4 produces '0001', 3 produces '001'"}
      delimiterLabel={t("faculty.settings.delimiter") || t("teachers.settings.delimiter") || "Delimiter"}
      delimiterHint={t("faculty.settings.delimiterHint") || t("teachers.settings.delimiterHint") || "Optional separator (e.g. - or /)"}
      onChangePrefix={(val) => {
        upd("employeeIdPrefix", val);
        upd("idPrefix", val);
        upd("idTemplate", `{PREFIX}${delimiter}{${yearFormat}}${delimiter}{SEQ}`);
      }}
      onChangeYearFormat={(val: SequenceYearFormat) => {
        upd("employeeIdYearFormat", val as "YYYY" | "YY");
        upd("idTemplate", `{PREFIX}${delimiter}{${val}}${delimiter}{SEQ}`);
      }}
      onChangeDigits={(val) => {
        upd("employeeIdSequenceDigits", val);
        upd("idDigits", val);
      }}
      onChangeDelimiter={(val) => {
        upd("employeeIdDelimiter", val);
        upd("idTemplate", `{PREFIX}${val}{${yearFormat}}${val}{SEQ}`);
      }}
    />
  );
}
