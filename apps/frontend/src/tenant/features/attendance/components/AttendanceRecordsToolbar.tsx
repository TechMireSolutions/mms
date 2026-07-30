import type React from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/SearchBar";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { AttendanceStatus } from "@/lib/data/attendanceData";

interface AttendanceRecordsToolbarProps {
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
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <SearchBar
        value={search}
        onChange={handleSearchChange}
        placeholder={t("attendance.searchStudent")}
        className="flex-1 min-w-[11.25rem]"
      />

      <div className="flex max-w-full overflow-x-auto rounded-lg border border-border text-xs font-bold" role="group" aria-label={t("attendance.filter.status")}>
        <Button
          type="button"
          variant={statusFilter === "all" ? "default" : "ghost"}
          onClick={() => { setStatusFilter("all"); setPage(1); }}
          className="shrink-0 rounded-none min-h-11 px-3 text-xs font-bold border-e border-border"
        >
          {t("attendance.filter.all")}
        </Button>
        {statuses.map((status) => (
          <Button
            type="button"
            key={status.id}
            variant={statusFilter === status.id ? "default" : "ghost"}
            onClick={() => { setStatusFilter(status.id); setPage(1); }}
            className={`shrink-0 rounded-none min-h-11 px-3 text-xs font-bold border-e border-border last:border-e-0 ${statusFilter === status.id ? `${status.bg} ${status.text}` : ""}`}
          >
            {statusLabel(status.id)}
          </Button>
        ))}
      </div>

      <DatePicker
        id="date-from"
        value={dateFrom}
        onChange={(value) => { setDateFrom(value); setPage(1); }}
        className="w-full min-w-0 max-w-full text-sm rounded-xl border border-border bg-background px-3 py-2 sm:max-w-[9.375rem]"
      />

      <DatePicker
        id="date-to"
        value={dateTo}
        onChange={(value) => { setDateTo(value); setPage(1); }}
        className="w-full min-w-0 max-w-full text-sm rounded-xl border border-border bg-background px-3 py-2 sm:max-w-[9.375rem]"
      />

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
