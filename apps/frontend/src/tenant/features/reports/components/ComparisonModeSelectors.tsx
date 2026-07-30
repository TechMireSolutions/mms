import React from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import type { DateRange } from "./comparisonModeTypes";

interface ComparisonModeSelectorsProps {
  mode: "sessions" | "daterange";
  isContacts: boolean;
  valA: string;
  valB: string;
  setValA: (value: string) => void;
  setValB: (value: string) => void;
  rangeA: DateRange;
  rangeB: DateRange;
  setRangeA: React.Dispatch<React.SetStateAction<DateRange>>;
  setRangeB: React.Dispatch<React.SetStateAction<DateRange>>;
  options: readonly { id: string; name: string }[];
}

export function ComparisonModeSelectors({
  mode,
  isContacts,
  valA,
  valB,
  setValA,
  setValB,
  rangeA,
  rangeB,
  setRangeA,
  setRangeB,
  options,
}: ComparisonModeSelectorsProps): React.JSX.Element {
  const { t } = useTranslation();

  if (mode === "sessions") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
        {[
          { label: "A", value: valA, setValue: setValA, color: "text-primary" },
          { label: "B", value: valB, setValue: setValB, color: "text-warning" },
        ].map(({ label, value, setValue, color }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className={`text-xs font-bold uppercase tracking-wide ${color}`}>
              {isContacts ? t("reports.comparison.stage") : t("reports.comparison.session")} {label}
            </label>
            <FormSelect
              value={value}
              onChange={(newValue) => setValue(newValue)}
              options={options.map((option) => ({ value: option.id, label: option.name }))}
              className="w-full"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-start">
      {[
        { label: t("reports.comparison.rangeA"), range: rangeA, setRange: setRangeA, color: "text-primary" },
        { label: t("reports.comparison.rangeB"), range: rangeB, setRange: setRangeB, color: "text-warning" },
      ].map(({ label, range, setRange, color }) => (
        <div key={label} className="space-y-2">
          <p className={`text-xs font-bold uppercase tracking-wide ${color}`}>{label}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <DatePicker
              value={range.from}
              onChange={(value) => setRange((currentRange) => ({ ...currentRange, from: value }))}
              className="w-full flex-1 text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-1.5"
            />
            <DatePicker
              value={range.to}
              onChange={(value) => setRange((currentRange) => ({ ...currentRange, to: value }))}
              className="w-full flex-1 text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-1.5"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
