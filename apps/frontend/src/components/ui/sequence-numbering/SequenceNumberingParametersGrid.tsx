import React from "react";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Field } from "@/components/ui/FormPrimitives";
import { cn } from "@/lib/utils";
import {
  SEQUENCE_DELIMITER_PRESETS,
  type SequenceYearFormat,
} from "@mms/shared";

export interface SequenceNumberingParametersGridProps {
  prefix: string;
  yearFormat: SequenceYearFormat;
  sequenceDigits: number;
  delimiter: string;
  currentYear: number;
  allowYearless?: boolean;
  prefixLabel?: string;
  prefixHint?: string;
  prefixPlaceholder?: string;
  yearFormatLabel?: string;
  yearFormatHint?: string;
  digitsLabel?: string;
  digitsHint?: string;
  delimiterLabel?: string;
  delimiterHint?: string;
  onChangePrefix: (val: string) => void;
  onChangeYearFormat: (val: SequenceYearFormat) => void;
  onChangeDigits: (val: number) => void;
  onChangeDelimiter: (val: string) => void;
}

export function SequenceNumberingParametersGrid({
  prefix,
  yearFormat,
  sequenceDigits,
  delimiter,
  currentYear,
  allowYearless = false,
  prefixLabel = "Prefix",
  prefixHint = "Default prefix used across IDs",
  prefixPlaceholder = "e.g. FAC",
  yearFormatLabel = "Year Format",
  yearFormatHint = "Four-digit (YYYY), two-digit (YY), or omit",
  digitsLabel = "Sequence Digits",
  digitsHint = "e.g. 4 produces '0001', 3 produces '001'",
  delimiterLabel = "Delimiter",
  delimiterHint = "Optional separator (e.g. - or /)",
  onChangePrefix,
  onChangeYearFormat,
  onChangeDigits,
  onChangeDelimiter,
}: SequenceNumberingParametersGridProps): React.JSX.Element {
  const yearOptions = [
    { value: "YYYY", label: `YYYY (e.g. ${currentYear})` },
    { value: "YY", label: `YY (e.g. ${String(currentYear).slice(-2)})` },
  ];

  if (allowYearless) {
    yearOptions.push({ value: "NONE", label: "None (Omit Year)" });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      <Field label={prefixLabel} hint={prefixHint} id="sequence-prefix">
        <Input
          id="sequence-prefix"
          name="sequence-prefix"
          className={FORM_INPUT}
          value={prefix}
          onChange={(event) => onChangePrefix(event.target.value.toUpperCase())}
          placeholder={prefixPlaceholder}
        />
      </Field>

      <Field label={yearFormatLabel} hint={yearFormatHint} id="sequence-year-format">
        <FormSelect
          id="sequence-year-format"
          name="sequence-year-format"
          value={yearFormat}
          onChange={(val) => onChangeYearFormat(val as SequenceYearFormat)}
          options={yearOptions}
        />
      </Field>

      <Field label={digitsLabel} hint={digitsHint} id="sequence-digits">
        <Input
          id="sequence-digits"
          name="sequence-digits"
          type="number"
          min="2"
          max="8"
          className={FORM_INPUT}
          value={sequenceDigits}
          onChange={(event) => {
            const val = Math.max(2, Math.min(8, Number(event.target.value) || 2));
            onChangeDigits(val);
          }}
        />
      </Field>

      <Field label={delimiterLabel} hint={delimiterHint} id="sequence-delimiter">
        <div className="space-y-1.5">
          <Input
            id="sequence-delimiter"
            name="sequence-delimiter"
            className={FORM_INPUT}
            value={delimiter}
            onChange={(event) => onChangeDelimiter(event.target.value)}
            placeholder="e.g. - or leave empty"
          />
          <div className="flex flex-wrap items-center gap-1">
            {SEQUENCE_DELIMITER_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChangeDelimiter(preset.value)}
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
