import React, { useState, useMemo } from "react";
import { Search, Pencil, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { DatePicker } from "../ui/DatePicker";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AttendanceRecord, AttendanceStatus } from '@/lib/data/attendanceData';
import { useAttendanceConfig } from "@/hooks/useAttendanceConfig";
import { useSessionsCollection } from '@/hooks/useSessions';
import usePermissions from "@/hooks/usePermissions";
import useTranslation from "@/hooks/useTranslation";
import ModuleColumnCustomizer from "../ui/ModuleColumnCustomizer";
import StatusBadge from "./StatusBadge";
import StatusToggle from "./StatusToggle";
import { AttendanceFilterState } from "./AttendanceFilters";
import type { AppTranslationKey, ModuleColumnRegistryEntry } from "@mms/shared";

const PAGE_SIZE = 15;

interface ColumnCustomizerProps {
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (cols: ModuleColumnRegistryEntry[]) => void;
  labels: {
    trigger: string;
    title: string;
    visibleAndOrder: string;
    hidden: string;
    fixed: string;
    hideColumn: (label: string) => string;
  };
}

interface AttendanceRecordsProps {
  filters: AttendanceFilterState;
  role: string;
  records: AttendanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  isColumnVisible?: (key: string) => boolean;
  columnCustomizer?: ColumnCustomizerProps;
}

export default function AttendanceRecords({
  filters,
  role: _role,
  records,
  setRecords,
  isColumnVisible,
  columnCustomizer,
}: AttendanceRecordsProps) {
  const { statuses } = useAttendanceConfig();
  const { t } = useTranslation();
  const { can } = usePermissions();
  const sessions = useSessionsCollection();

  const allClasses = useMemo(() => {
    return sessions.flatMap((s) =>
      (s.classes || []).map((c) => ({ ...c, sessionId: s.id, sessionName: s.name }))
    );
  }, [sessions]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const statusLabel = (statusId: string) => {
    const found = statuses.find((s) => s.id === statusId);
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

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filters.classId && r.classId !== filters.classId) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      if (search && !r.studentName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [records, filters, statusFilter, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateRecord = <K extends keyof AttendanceRecord>(id: string, key: K, value: AttendanceRecord[K]) =>
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, [key]: value } : r));

  const deleteRecord = (id: string) => {
    if (!can("users.manage")) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const classLabel = (classId: string) => allClasses.find((c) => c.id === classId)?.name || classId;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <label htmlFor="search-student" className="sr-only">{t("attendance.searchStudent")}</label>
          <Input
            id="search-student"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("attendance.searchStudent")}
            className="pl-9 pr-4"
          />
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden text-[11px] font-bold" role="group" aria-label={t("attendance.filter.status")}>
          <Button
            type="button"
            variant={statusFilter === "all" ? "default" : "ghost"}
            onClick={() => { setStatusFilter("all"); setPage(1); }}
            className="rounded-none h-8 px-3 text-[11px] font-bold border-r border-border"
          >
            {t("attendance.filter.all")}
          </Button>
          {statuses.map((s: AttendanceStatus) => (
            <Button
              type="button"
              key={s.id}
              variant={statusFilter === s.id ? "default" : "ghost"}
              onClick={() => { setStatusFilter(s.id); setPage(1); }}
              className={`rounded-none h-8 px-3 text-[11px] font-bold border-r border-border last:border-r-0 ${statusFilter === s.id ? `${s.bg} ${s.text}` : ""}`}
            >
              {statusLabel(s.id)}
            </Button>
          ))}
        </div>

        <DatePicker
          id="date-from"
          value={dateFrom}
          onChange={(val) => { setDateFrom(val); setPage(1); }}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 max-w-[150px]"
        />

        <DatePicker
          id="date-to"
          value={dateTo}
          onChange={(val) => { setDateTo(val); setPage(1); }}
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
              {paginated.length === 0 ? (
                <tr><td colSpan={visibleColCount} className="px-4 py-12 text-center text-muted-foreground">{t("attendance.empty.records")}</td></tr>
              ) : paginated.map((r) => (
                <motion.tr key={r.id} layout className="hover:bg-muted/20 transition-colors">
                  {showDate && (
                    <td className="px-3 py-2.5 font-mono text-xs text-foreground whitespace-nowrap">{r.date}</td>
                  )}
                  {showClass && (
                    <td className="px-3 py-2.5 text-foreground whitespace-nowrap">{classLabel(r.classId)}</td>
                  )}
                  {showStudent && (
                    <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{r.studentName}</td>
                  )}
                  {showStatus && (
                    <td className="px-3 py-2.5">
                      {editing === r.id
                        ? <StatusToggle value={r.status} onChange={(v) => updateRecord(r.id, "status", v as AttendanceRecord["status"])} />
                        : <StatusBadge status={r.status} />
                      }
                    </td>
                  )}
                  {showTimeIn && (
                    <td className="px-3 py-2.5">
                      {editing === r.id
                        ? <input type="time" value={r.timeIn} onChange={(e) => updateRecord(r.id, "timeIn", e.target.value)}
                            aria-label={t("attendance.columns.timeIn")}
                            className="text-xs rounded-lg border border-border bg-background px-2 py-1 w-24 focus:outline-none" />
                        : <span className="text-xs text-muted-foreground font-mono">{r.timeIn || "—"}</span>
                      }
                    </td>
                  )}
                  {showTimeOut && (
                    <td className="px-3 py-2.5">
                      {editing === r.id
                        ? <input type="time" value={r.timeOut} onChange={(e) => updateRecord(r.id, "timeOut", e.target.value)}
                            aria-label={t("attendance.columns.timeOut")}
                            className="text-xs rounded-lg border border-border bg-background px-2 py-1 w-24 focus:outline-none" />
                        : <span className="text-xs text-muted-foreground font-mono">{r.timeOut || "—"}</span>
                      }
                    </td>
                  )}
                  {showNotes && (
                    <td className="px-3 py-2.5 max-w-[160px] truncate text-xs text-muted-foreground">{r.notes || "—"}</td>
                  )}
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {can("attendance.write") && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(editing === r.id ? null : r.id)}
                          aria-label={editing === r.id ? t("common.cancel") : t("common.edit")}
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          {editing === r.id ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                        </Button>
                      )}
                      {can("users.manage") && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRecord(r.id)}
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

      <footer className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("attendance.pagination.summary", { count: filtered.length, page, totalPages })}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label={t("attendance.pagination.previous")}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label={t("attendance.pagination.next")}
            className="h-8 w-8"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </footer>
    </section>
  );
}
