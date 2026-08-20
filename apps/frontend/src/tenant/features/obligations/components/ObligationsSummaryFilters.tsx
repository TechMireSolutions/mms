import { Filter, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CARD_STRIPE_INSET } from "@/lib/semanticTone";
import { DateRangeFilterBar } from "@/components/ui/DateRangeFilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";

interface ObligationsSummaryFiltersProps {
  search: string;
  dateFrom: string;
  dateTo: string;
  repFilter: string;
  typeFilter: string;
  userFilter: string;
  hasFilters: boolean | string;
  repOptions: Array<{ value: string; label: string }>;
  typeOptions: Array<{ value: string; label: string }>;
  userOptions: Array<{ value: string; label: string }>;
  onSearchChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onRepFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onUserFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export function ObligationsSummaryFilters({
  search,
  dateFrom,
  dateTo,
  repFilter,
  typeFilter,
  userFilter,
  hasFilters,
  repOptions,
  typeOptions,
  userOptions,
  onSearchChange,
  onDateFromChange,
  onDateToChange,
  onRepFilterChange,
  onTypeFilterChange,
  onUserFilterChange,
  onClearFilters,
}: ObligationsSummaryFiltersProps) {
  const { t } = useTranslation();

  return (
    <Card accentColor="primary" className={cn("p-4 space-y-3", CARD_STRIPE_INSET)}>
      <header className="flex items-center gap-2 mb-1 ps-1">
        <Filter className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-bold text-foreground m-0">{t("obligations.summary.filters.title")}</h2>
        {hasFilters && (
          <Button
            type="button"
            onClick={onClearFilters}
            variant="link"
            className="ms-auto min-h-11 px-2 text-xs text-primary font-semibold hover:underline shadow-none"
          >
            {t("obligations.summary.filters.clearAll")}
          </Button>
        )}
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="relative col-span-2 sm:col-span-1">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            aria-label={t("obligations.summary.filters.searchAria")}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("obligations.summary.filters.searchPlaceholder")}
            className="w-full ps-8 pe-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <DateRangeFilterBar
          idPrefix="obligations-summary"
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={onDateFromChange}
          onDateToChange={onDateToChange}
          fromPlaceholder={t("obligations.summary.filters.fromDate")}
          toPlaceholder={t("obligations.summary.filters.toDate")}
          className="col-span-2"
          pickerClassName="w-full min-w-0 flex-1 text-xs"
        />
        <FormSelect
          aria-label={t("obligations.summary.filters.byRepresentativeAria")}
          value={repFilter}
          onChange={onRepFilterChange}
          options={repOptions}
          className="text-xs rounded-lg border border-border bg-background"
        />
        <FormSelect
          aria-label={t("obligations.summary.filters.byTypeAria")}
          value={typeFilter}
          onChange={onTypeFilterChange}
          options={typeOptions}
          className="text-xs rounded-lg border border-border bg-background"
        />
        <FormSelect
          aria-label={t("obligations.summary.filters.byCollectorAria")}
          value={userFilter}
          onChange={onUserFilterChange}
          options={userOptions}
          className="text-xs rounded-lg border border-border bg-background"
        />
      </div>
    </Card>
  );
}
