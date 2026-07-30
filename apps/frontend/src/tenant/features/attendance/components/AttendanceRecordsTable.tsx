import type React from "react";
import { motion } from "framer-motion";
import { formatDate } from "@mms/shared";
import { Input } from "@/components/ui/input";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/data/attendanceData";
import { AttendanceRecordStatusCell } from "./AttendanceRecordStatusCell";

export interface AttendanceVisibleColumns {
  date: boolean;
  class: boolean;
  student: boolean;
  status: boolean;
  timeIn: boolean;
  timeOut: boolean;
  notes: boolean;
}

interface AttendanceRecordsTableProps {
  paginatedRecords: AttendanceRecord[];
  visibleColumns: AttendanceVisibleColumns;
  visibleColCount: number;
  editingRecord: AttendanceRecord | null;
  statuses: AttendanceStatus[];
  updateDraft: <K extends keyof AttendanceRecord>(key: K, value: AttendanceRecord[K]) => void;
  classLabel: (classId: string) => string;
  renderRowActions: (attendanceRecord: AttendanceRecord) => React.ReactNode;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  t: TranslationFunction;
}

export function AttendanceRecordsTable({
  paginatedRecords,
  visibleColumns,
  visibleColCount,
  editingRecord,
  statuses,
  updateDraft,
  classLabel,
  renderRowActions,
  getColumnWidth,
  onColumnResize,
  t,
}: AttendanceRecordsTableProps): React.JSX.Element {
  const showDate = visibleColumns.date;
  const showClass = visibleColumns.class;
  const showStudent = visibleColumns.student;
  const showStatus = visibleColumns.status;
  const showTimeIn = visibleColumns.timeIn;
  const showTimeOut = visibleColumns.timeOut;
  const showNotes = visibleColumns.notes;

  return (
    <article className="rounded-xl border border-border overflow-hidden">
      <div className="space-y-3 p-3 md:hidden">
        {paginatedRecords.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("attendance.empty.records")}</p>
        ) : paginatedRecords.map((attendanceRecord) => (
          <motion.article
            key={attendanceRecord.id}
            layout
            className="space-y-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                {showStudent && <h4 className="truncate text-sm font-semibold text-foreground">{attendanceRecord.studentName}</h4>}
                {showClass && <p className="truncate text-xs text-muted-foreground">{classLabel(attendanceRecord.classId)}</p>}
              </div>
              {showStatus && (
                <AttendanceRecordStatusCell
                  attendanceRecord={attendanceRecord}
                  editingRecord={editingRecord}
                  statuses={statuses}
                  updateDraft={updateDraft}
                />
              )}
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {showDate && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.columns.date")}</dt>
                  <dd className="font-mono text-foreground">{formatDate(attendanceRecord.date, true)}</dd>
                </div>
              )}
              {showTimeIn && (
                <div>
                  <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("attendance.columns.timeIn")}</dt>
                  <dd>
                    {editingRecord?.id === attendanceRecord.id
                      ? <Input type="time" value={editingRecord.timeIn} onChange={(event) => updateDraft("timeIn", event.target.value)}
                          aria-label={t("attendance.columns.timeIn")}
                          className="w-full min-w-0 text-xs" />
                      : <span className="font-mono text-xs text-muted-foreground">{attendanceRecord.timeIn || "—"}</span>}
                  </dd>
                </div>
              )}
              {showTimeOut && (
                <div>
                  <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("attendance.columns.timeOut")}</dt>
                  <dd>
                    {editingRecord?.id === attendanceRecord.id
                      ? <Input type="time" value={editingRecord.timeOut} onChange={(event) => updateDraft("timeOut", event.target.value)}
                          aria-label={t("attendance.columns.timeOut")}
                          className="w-full min-w-0 text-xs" />
                      : <span className="font-mono text-xs text-muted-foreground">{attendanceRecord.timeOut || "—"}</span>}
                  </dd>
                </div>
              )}
              {showNotes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.columns.notes")}</dt>
                  <dd className="break-words text-xs text-muted-foreground">{attendanceRecord.notes || "—"}</dd>
                </div>
              )}
            </dl>
            {renderRowActions(attendanceRecord)}
          </motion.article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              {showDate && (
                <ResizableTableHead columnKey="date" width={getColumnWidth?.("date")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t("attendance.columns.date")}
                </ResizableTableHead>
              )}
              {showClass && (
                <ResizableTableHead columnKey="class" width={getColumnWidth?.("class")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t("attendance.columns.class")}
                </ResizableTableHead>
              )}
              {showStudent && (
                <ResizableTableHead columnKey="student" width={getColumnWidth?.("student")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t("attendance.columns.student")}
                </ResizableTableHead>
              )}
              {showStatus && (
                <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t("attendance.columns.status")}
                </ResizableTableHead>
              )}
              {showTimeIn && (
                <ResizableTableHead columnKey="timeIn" width={getColumnWidth?.("timeIn")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t("attendance.columns.timeIn")}
                </ResizableTableHead>
              )}
              {showTimeOut && (
                <ResizableTableHead columnKey="timeOut" width={getColumnWidth?.("timeOut")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t("attendance.columns.timeOut")}
                </ResizableTableHead>
              )}
              {showNotes && (
                <ResizableTableHead columnKey="notes" width={getColumnWidth?.("notes")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t("attendance.columns.notes")}
                </ResizableTableHead>
              )}
              <th className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">
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
                    <AttendanceRecordStatusCell
                      attendanceRecord={attendanceRecord}
                      editingRecord={editingRecord}
                      statuses={statuses}
                      updateDraft={updateDraft}
                    />
                  </td>
                )}
                {showTimeIn && (
                  <td className="px-3 py-2.5">
                    {editingRecord?.id === attendanceRecord.id
                      ? <Input type="time" value={editingRecord.timeIn} onChange={(event) => updateDraft("timeIn", event.target.value)}
                          aria-label={t("attendance.columns.timeIn")}
                          className="w-full min-w-[6.5rem] max-w-[8rem] text-xs" />
                      : <span className="text-xs text-muted-foreground font-mono">{attendanceRecord.timeIn || "—"}</span>
                    }
                  </td>
                )}
                {showTimeOut && (
                  <td className="px-3 py-2.5">
                    {editingRecord?.id === attendanceRecord.id
                      ? <Input type="time" value={editingRecord.timeOut} onChange={(event) => updateDraft("timeOut", event.target.value)}
                          aria-label={t("attendance.columns.timeOut")}
                          className="w-full min-w-[6.5rem] max-w-[8rem] text-xs" />
                      : <span className="text-xs text-muted-foreground font-mono">{attendanceRecord.timeOut || "—"}</span>
                    }
                  </td>
                )}
                {showNotes && (
                  <td className="px-3 py-2.5 max-w-[10rem] truncate text-xs text-muted-foreground">{attendanceRecord.notes || "—"}</td>
                )}
                <td className="px-3 py-2.5 text-end">
                  {renderRowActions(attendanceRecord)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
