import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import type { FacultySettings, SequenceYearFormat } from "@mms/shared";
import { SequenceNumberingParametersGrid } from "@/components/ui/sequence-numbering";

export interface FacultyIdParametersGridProps {
  prefix: string;
  yearFormat: "YYYY" | "YY";
  sequenceDigits: number;
  delimiter: string;
  currentYear: number;
  upd: <K extends keyof FacultySettings>(field: K, value: FacultySettings[K]) => void;
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
      prefixLabel={t("faculty.settings.idPrefix")}
      prefixHint={t("faculty.settings.idPrefixHint")}
      yearFormatLabel={t("faculty.settings.yearFormat")}
      yearFormatHint={t("faculty.settings.yearFormatHint")}
      digitsLabel={t("faculty.settings.idDigits")}
      digitsHint={t("faculty.settings.idDigitsHint")}
      delimiterLabel={t("faculty.settings.delimiter")}
      delimiterHint={t("faculty.settings.delimiterHint")}
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
