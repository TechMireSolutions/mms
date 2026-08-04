import type React from "react";
import { SlidersHorizontal } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/ui/SearchBar";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { AttendanceStatus } from "@/lib/data/attendanceData";

interface AttendanceRecordsToolbarProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  search: string;
  handleSearchChange: (query: string) => void;
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  statuses: AttendanceStatus[];
  statusLabel: (statusId: string) => string;
  dateFrom: string;
  setDateFrom: React.Dispatch<React.SetStateAction<string>>;
  dateTo: string;
  setDateTo: React.Dispatch<React.SetStateAction<string>>;
  setPage: (page: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
  t: TranslationFunction;
}

export function AttendanceRecordsToolbar({
  viewMode,
  onViewModeChange,
  search,
  handleSearchChange,
  statusFilter,
  setStatusFilter,
  statuses,
  statusLabel,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  setPage,
  columnCustomizer,
  t,
}: AttendanceRecordsToolbarProps): React.JSX.Element {
  const activeFilterCount = statusFilter !== "all" ? 1 : 0;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <SearchBar
        value={search}
        onChange={handleSearchChange}
        placeholder={t("attendance.searchStudent")}
        className="flex-1 min-w-[11.25rem]"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className={`flex items-center gap-1.5 px-3 min-h-11 rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
              activeFilterCount > 0
                ? "border-primary/30 bg-primary/5 text-primary hover:text-primary hover:bg-primary/5"
                : "border-border bg-card text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t("common.filters")}</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card border border-border">
          <DropdownMenuLabel className="text-xs">{t("attendance.filter.status")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <DropdownMenuRadioItem value="all" className="text-sm">
              {t("attendance.filter.all")}
            </DropdownMenuRadioItem>
            {statuses.map((status) => (
              <DropdownMenuRadioItem key={status.id} value={status.id} className="text-sm">
                {statusLabel(status.id)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          {activeFilterCount > 0 && (
            <>
              <DropdownMenuSeparator className="bg-border" />
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start px-2 min-h-11 text-sm text-muted-foreground"
                onClick={() => {
                  setStatusFilter("all");
                  setPage(1);
                }}
              >
                {t("common.clearFilters")}
              </Button>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DatePicker
        id="date-from"
        value={dateFrom}
        onChange={(value) => { setDateFrom(value); setPage(1); }}
        className="w-full min-w-0 max-w-full text-sm rounded-xl border border-border bg-background px-3 py-2 sm:max-w-filter-sm"
      />

      <DatePicker
        id="date-to"
        value={dateTo}
        onChange={(value) => { setDateTo(value); setPage(1); }}
        className="w-full min-w-0 max-w-full text-sm rounded-xl border border-border bg-background px-3 py-2 sm:max-w-filter-sm"
      />

      <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

      {columnCustomizer && (
        <ModuleColumnCustomizer
          columnRegistry={columnCustomizer.columnRegistry}
          updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
          labels={columnCustomizer.labels}
        />
      )}
    </div>
  );
}
