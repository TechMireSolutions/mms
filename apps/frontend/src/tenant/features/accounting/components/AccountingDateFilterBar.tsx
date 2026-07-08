import React from "react";
import { Download } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/button";
import type { FiscalYear } from "@/lib/data/accountingData";

interface AccountingDateFilterBarProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  activeFiscalYear?: FiscalYear;
  onExportCSV?: () => void;
  idPrefix: string;
  variant?: "bordered" | "simple";
}

/**
 * Reusable date filter bar for accounting screens.
 * Integrates "From", "To" dates, quick active FY and all time resets, and optional CSV export button.
 */
export function AccountingDateFilterBar({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  activeFiscalYear,
  onExportCSV,
  idPrefix,
  variant = "simple",
}: AccountingDateFilterBarProps) {
  const containerClass =
    variant === "bordered"
      ? "flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border bg-muted/20"
      : "flex flex-wrap items-center gap-3";

  return (
    <nav aria-label={`${idPrefix} Date Filters`} className={containerClass}>
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor={`${idPrefix}-from`} className="text-xs font-semibold text-muted-foreground uppercase">
          From
        </label>
        <DatePicker
          id={`${idPrefix}-from`}
          value={dateFrom}
          onChange={onDateFromChange}
          className="px-3 py-1.5 w-40"
        />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor={`${idPrefix}-to`} className="text-xs font-semibold text-muted-foreground uppercase">
          To
        </label>
        <DatePicker
          id={`${idPrefix}-to`}
          value={dateTo}
          onChange={onDateToChange}
          className="px-3 py-1.5 w-40"
        />
      </div>

      {activeFiscalYear && (
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => {
            onDateFromChange(activeFiscalYear.startDate);
            onDateToChange(activeFiscalYear.endDate);
          }}
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors p-0 h-auto"
        >
          Active FY: {activeFiscalYear.label}
        </Button>
      )}

      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={() => {
          onDateFromChange("");
          onDateToChange("");
        }}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors p-0 h-auto"
      >
        All time
      </Button>

      {onExportCSV && (
        <Button
          type="button"
          variant="outline"
          onClick={onExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors ml-auto h-auto"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> Export CSV
        </Button>
      )}
    </nav>
  );
}
