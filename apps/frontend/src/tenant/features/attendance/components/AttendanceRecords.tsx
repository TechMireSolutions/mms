import React, { useState, useMemo } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/SearchBar";
import { ListPagination } from "@/components/ui/ListPagination";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { AttendanceRecord, AttendanceStatus } from '@/lib/data/attendanceData';
import { useAttendanceConfig } from "@/hooks/useStandardModuleConfig";
import { useSessionsCollection } from '@/tenant/features/sessions/hooks/useSessions';
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { ATTENDANCE_MODULE_CONTRACT } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { getAttendanceStatusInfo } from "@/lib/data/attendanceData";
import { StatusToggle } from "@/tenant/features/attendance/components/StatusToggle";
import { AttendanceFilterState } from "@/tenant/features/attendance/components/AttendanceFilters";
import { type AppTranslationKey } from "@mms/shared";
import { formatDate } from "@/lib/db";

const PAGE_SIZE = 15;



interface AttendanceRecordsProps {
  filters: AttendanceFilterState;
  records: AttendanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  isColumnVisible?: (key: string) => boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

export function AttendanceRecords({
  filters,
  records,
  setRecords,
  isColumnVisible,
  columnCustomizer,
}: AttendanceRecordsProps) {
  const { statuses } = useAttendanceConfig();
  const { t } = useTranslation();
  const {
    canWrite: canWriteAttendance,
    canDelete: canDeleteAttendance,
  } = useModulePermissions(ATTENDANCE_MODULE_CONTRACT);
  const sessions = useSessionsCollection();

  const allClasses = useMemo(() => {
    return sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({ ...sessionClass, sessionId: session.id, sessionName: session.name }))
    );
  }, [sessions]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const baseFiltered = useMemo(() => {
    return records.filter((attendanceRecord) => {
      if (filters.classId && attendanceRecord.classId !== filters.classId) return false;
      if (statusFilter !== "all" && attendanceRecord.status !== statusFilter) return false;
      if (dateFrom && attendanceRecord.date < dateFrom) return false;
      if (dateTo && attendanceRecord.date > dateTo) return false;
      return true;
    });
  }, [records, filters, statusFilter, dateFrom, dateTo]);

  const {
    searchQuery: search,
    currentPage: page,
    setCurrentPage: setPage,
    handleSearchChange,
    paginatedItems: paginatedRecords,
    filteredItems: filtered,
    totalPages,
  } = useLocalPagination({
    items: baseFiltered,
    pageSize: PAGE_SIZE,
    searchFields: (attendanceRecord) => [attendanceRecord.studentName],
  });

  const statusLabel = (statusId: string) => {
    const found = statuses.find((status) => status.id === statusId);
    if (found) return found.label;
    const key = `attendance.status.${statusId}` as AppTranslationKey;
    return t(key);
  };

  const showDate = isColumnVisible ? isColumnVisible("date") : true;
  const showClass = isColumnVisible ? isColumnVisible("class") : true;
  const showStudent = isColumnVisible ? isColumnVisible("student") : true;
  const showStatus = isColumnVisible ? isColumnVisible("status") : true;
  const showTimeIn = isColumnVisible ? isColumnVisible("timeIn") : true;
  const showTimeOut = isColumnVisible ? isColumnVisible("timeOut") : true;
  const showNotes = isColumnVisible ? isColumnVisible("notes") : true;

  const visibleColCount =
    (showDate ? 1 : 0) +
    (showClass ? 1 : 0) +
    (showStudent ? 1 : 0) +
    (showStatus ? 1 : 0) +
    (showTimeIn ? 1 : 0) +
    (showTimeOut ? 1 : 0) +
    (showNotes ? 1 : 0) +
    1;

  const updateRecord = <K extends keyof AttendanceRecord>(id: string, key: K, value: AttendanceRecord[K]) =>
    setRecords((previousRecords) => previousRecords.map((attendanceRecord) => attendanceRecord.id === id ? { ...attendanceRecord, [key]: value } : attendanceRecord));

  const deleteRecord = (id: string) => {
    if (!canDeleteAttendance) return;
    setRecords((previousRecords) => previousRecords.filter((attendanceRecord) => attendanceRecord.id !== id));
  };

  const classLabel = (classId: string) => allClasses.find((sessionClass) => sessionClass.id === classId)?.name || classId;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder={t("attendance.searchStudent")}
          className="flex-1 min-w-[180px]"
        />

        <div className="flex rounded-lg border border-border overflow-hidden text-[11px] font-bold" role="group" aria-label={t("attendance.filter.status")}>
          <Button
            type="button"
            variant={statusFilter === "all" ? "default" : "ghost"}
            onClick={() => { setStatusFilter("all"); setPage(1); }}
            className="rounded-none h-8 px-3 text-[11px] font-bold border-r border-border"
          >
            {t("attendance.filter.all")}
          </Button>
          {statuses.map((status: AttendanceStatus) => (
            <Button
              type="button"
              key={status.id}
              variant={statusFilter === status.id ? "default" : "ghost"}
              onClick={() => { setStatusFilter(status.id); setPage(1); }}
              className={`rounded-none h-8 px-3 text-[11px] font-bold border-r border-border last:border-r-0 ${statusFilter === status.id ? `${status.bg} ${status.text}` : ""}`}
            >
              {statusLabel(status.id)}
            </Button>
          ))}
        </div>

        <DatePicker
          id="date-from"
          value={dateFrom}
          onChange={(value) => { setDateFrom(value); setPage(1); }}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 max-w-[150px]"
        />

        <DatePicker
          id="date-to"
          value={dateTo}
          onChange={(value) => { setDateTo(value); setPage(1); }}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 max-w-[150px]"
        />

        {columnCustomizer && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
      </div>

      <article className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                {showDate && (
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                    {t("attendance.columns.date")}
                  </th>
                )}
                {showClass && (
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                    {t("attendance.columns.class")}
                  </th>
                )}
                {showStudent && (
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                    {t("attendance.columns.student")}
                  </th>
                )}
                {showStatus && (
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                    {t("attendance.columns.status")}
                  </th>
                )}
                {showTimeIn && (
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                    {t("attendance.columns.timeIn")}
                  </th>
                )}
                {showTimeOut && (
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                    {t("attendance.columns.timeOut")}
                  </th>
                )}
                {showNotes && (
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                    {t("attendance.columns.notes")}
                  </th>
                )}
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">
                  <span className="sr-only">{t("common.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedRecords.length === 0 ? (
                <tr><td colSpan={visibleColCount} className="px-4 py-12 text-center text-muted-foreground">{t("attendance.empty.records")}</td></tr>
              ) : paginatedRecords.map((attendanceRecord) => (
                <motion.tr key={attendanceRecord.id} layout className="hover:bg-muted/20 transition-colors">
                  {showDate && (
                    <td className="px-3 py-2.5 font-mono text-xs text-foreground whitespace-nowrap">{formatDate(attendanceRecord.date, true)}</td>
                  )}
                  {showClass && (
                    <td className="px-3 py-2.5 text-foreground whitespace-nowrap">{classLabel(attendanceRecord.classId)}</td>
                  )}
                  {showStudent && (
                    <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{attendanceRecord.studentName}</td>
                  )}
                  {showStatus && (
                    <td className="px-3 py-2.5">
                      {editing === attendanceRecord.id
                        ? <StatusToggle value={attendanceRecord.status} onChange={(value) => updateRecord(attendanceRecord.id, "status", value as AttendanceRecord["status"])} />
                        : (() => {
                            const info = getAttendanceStatusInfo(attendanceRecord.status, statuses);
                            const config: Record<string, StatusBadgeConfigItem> = info
                              ? { [attendanceRecord.status]: { label: info.label, cls: `${info.bg} ${info.text} ${info.border} font-semibold`, dot: info.dot } }
                              : {};
                            return <StatusBadge status={attendanceRecord.status} config={config} size="sm" />;
                          })()
                      }
                    </td>
                  )}
                  {showTimeIn && (
                    <td className="px-3 py-2.5">
                      {editing === attendanceRecord.id
                        ? <Input type="time" value={attendanceRecord.timeIn} onChange={(event) => updateRecord(attendanceRecord.id, "timeIn", event.target.value)}
                            aria-label={t("attendance.columns.timeIn")}
                            className="text-xs rounded-lg border border-border bg-background px-2 py-1 w-24 focus:outline-none" />
                        : <span className="text-xs text-muted-foreground font-mono">{attendanceRecord.timeIn || "—"}</span>
                      }
                    </td>
                  )}
                  {showTimeOut && (
                    <td className="px-3 py-2.5">
                      {editing === attendanceRecord.id
                        ? <Input type="time" value={attendanceRecord.timeOut} onChange={(event) => updateRecord(attendanceRecord.id, "timeOut", event.target.value)}
                            aria-label={t("attendance.columns.timeOut")}
                            className="text-xs rounded-lg border border-border bg-background px-2 py-1 w-24 focus:outline-none" />
                        : <span className="text-xs text-muted-foreground font-mono">{attendanceRecord.timeOut || "—"}</span>
                      }
                    </td>
                  )}
                  {showNotes && (
                    <td className="px-3 py-2.5 max-w-[160px] truncate text-xs text-muted-foreground">{attendanceRecord.notes || "—"}</td>
                  )}
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canWriteAttendance && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(editing === attendanceRecord.id ? null : attendanceRecord.id)}
                          aria-label={editing === attendanceRecord.id ? t("common.cancel") : t("common.edit")}
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          {editing === attendanceRecord.id ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                        </Button>
                      )}
                      {canDeleteAttendance && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRecord(attendanceRecord.id)}
                          aria-label={t("attendance.deleteRecord")}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <ListPagination
        page={page}
        total={filtered.length}
        limit={PAGE_SIZE}
        onPageChange={setPage}
        i18nNamespace="attendance"
        variant="summary"
      />
    </section>
  );
}
