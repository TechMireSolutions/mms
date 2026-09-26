import React from "react";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Field } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { TeachersSettings } from "@mms/shared";

const DELIMITER_PRESETS = [
  { label: "None", value: "" },
  { label: "Hyphen (-)", value: "-" },
  { label: "Slash (/)", value: "/" },
  { label: "Dot (.)", value: "." },
] as const;

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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      <Field
        label={t("faculty.settings.idPrefix") || t("teachers.settings.idPrefix")}
        hint={t("faculty.settings.idPrefixHint") || t("teachers.settings.idPrefixHint")}
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
        label={t("faculty.settings.yearFormat") || t("teachers.settings.yearFormat") || "Year Format"}
        hint={t("faculty.settings.yearFormatHint") || t("teachers.settings.yearFormatHint") || "Four-digit or two-digit year"}
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
        label={t("faculty.settings.idDigits") || t("teachers.settings.idDigits")}
        hint={t("faculty.settings.idDigitsHint") || t("teachers.settings.idDigitsHint")}
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
        label={t("faculty.settings.delimiter") || t("teachers.settings.delimiter") || "Delimiter"}
        hint={t("faculty.settings.delimiterHint") || t("teachers.settings.delimiterHint") || "Optional separator (e.g. - or /)"}
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
  );
}
