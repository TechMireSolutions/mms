import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import { WorkBatchTable, type WorkBatchTableColumn } from '@/components/common/work';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
import type { AttendanceRecord, AttendanceStatus } from '@/lib/data/attendanceData';
import { AttendanceRecordStatusCell } from './AttendanceRecordStatusCell';
import { TimePicker } from '@/components/ui/TimePicker';
import { formatDate } from '@mms/shared';

export interface AttendanceListDesktopTableProps {
  paginatedRecords: AttendanceRecord[];
  isColumnVisible: (key: string) => boolean;
  visibleColCount: number;
  editingRecord: AttendanceRecord | null;
  statuses: AttendanceStatus[];
  updateDraft: <K extends keyof AttendanceRecord>(key: K, value: AttendanceRecord[K]) => void;
  classLabel: (classId: string) => string;
  renderRowActions: (attendanceRecord: AttendanceRecord) => React.ReactNode;
  selectedIds: string[];
  canDelete: boolean;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectedRecord: (id: string, checked: boolean) => void;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  t: TranslationFunction;
}

export function AttendanceListDesktopTable({
  paginatedRecords,
  isColumnVisible,
  visibleColCount: _visibleColCount,
  editingRecord,
  statuses,
  updateDraft,
  classLabel,
  renderRowActions,
  selectedIds,
  canDelete,
  allVisibleSelected,
  someVisibleSelected,
  onToggleSelectAll,
  onToggleSelectedRecord,
  getColumnWidth,
  onColumnResize,
  t,
}: AttendanceListDesktopTableProps): React.JSX.Element {
  const recordsCountLabel = formatDirectoryPageCountLabel(paginatedRecords.length, t, {
    singular: 'attendance.item.record',
    plural: 'attendance.item.records',
  });
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const columns = React.useMemo<WorkBatchTableColumn<AttendanceRecord>[]>(() => {
    const cols: WorkBatchTableColumn<AttendanceRecord>[] = [];

    if (isColumnVisible("date")) {
      cols.push({
        id: "date",
        label: t("attendance.columns.date"),
        render: (r: AttendanceRecord) => (
          <span className="font-mono text-xs text-foreground whitespace-nowrap">
            {formatDate(r.date, true)}
          </span>
        ),
      });
    }

    if (isColumnVisible("class")) {
      cols.push({
        id: "class",
        label: t("attendance.columns.class"),
        render: (r: AttendanceRecord) => (
          <span className="text-foreground whitespace-nowrap">
            {classLabel(r.classId)}
          </span>
        ),
      });
    }

    if (isColumnVisible("session")) {
      cols.push({
        id: "session",
        label: t("attendance.columns.session"),
        render: (r: AttendanceRecord) => (
          <span className="text-foreground whitespace-nowrap">
            {r.sessionName || "—"}
          </span>
        ),
      });
    }

    if (isColumnVisible("student")) {
      cols.push({
        id: "student",
        label: t("attendance.columns.student"),
        render: (r: AttendanceRecord) => (
          <span className="font-semibold text-foreground whitespace-nowrap">
            {r.studentName}
          </span>
        ),
      });
    }

    if (isColumnVisible("status")) {
      cols.push({
        id: "status",
        label: t("attendance.columns.status"),
        render: (r: AttendanceRecord) => (
          <AttendanceRecordStatusCell
            attendanceRecord={r}
            editingRecord={editingRecord}
            statuses={statuses}
            updateDraft={updateDraft}
          />
        ),
      });
    }

    if (isColumnVisible("timeIn")) {
      cols.push({
        id: "timeIn",
        label: t("attendance.columns.timeIn"),
        render: (r: AttendanceRecord) =>
          editingRecord?.id === r.id ? (
            <TimePicker
              id={`attendance-time-in-${r.id}`}
              name="timeIn"
              value={editingRecord.timeIn}
              onChange={(nextValue) => updateDraft("timeIn", nextValue)}
              aria-label={t("attendance.columns.timeIn")}
              className="w-full min-w-attendance-status max-w-attendance-status text-xs"
            />
          ) : (
            <span className="text-xs text-muted-foreground font-mono">
              {r.timeIn || "—"}
            </span>
          ),
      });
    }

    if (isColumnVisible("timeOut")) {
      cols.push({
        id: "timeOut",
        label: t("attendance.columns.timeOut"),
        render: (r: AttendanceRecord) =>
          editingRecord?.id === r.id ? (
            <TimePicker
              id={`attendance-time-out-${r.id}`}
              name="timeOut"
              value={editingRecord.timeOut}
              onChange={(nextValue) => updateDraft("timeOut", nextValue)}
              aria-label={t("attendance.columns.timeOut")}
              className="w-full min-w-attendance-status max-w-attendance-status text-xs"
            />
          ) : (
            <span className="text-xs text-muted-foreground font-mono">
              {r.timeOut || "—"}
            </span>
          ),
      });
    }

    if (isColumnVisible("notes")) {
      cols.push({
        id: "notes",
        label: t("attendance.columns.notes"),
        cellClassName: "max-w-cell-sm truncate text-xs text-muted-foreground",
        render: (r: AttendanceRecord) => r.notes || "—",
      });
    }

    return cols;
  }, [classLabel, editingRecord, isColumnVisible, statuses, t, updateDraft]);

  return (
    <article className={WORK_SURFACE}>
      <WorkBatchTable
        data={paginatedRecords}
        columns={columns}
        bordered={false}
        selection={
          canDelete
            ? {
                selectedIds,
                onSelectOne: (id) => onToggleSelectedRecord(id, !selectedSet.has(id)),
                onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
                allSelected: allVisibleSelected,
                someSelected: someVisibleSelected,
                selectAllAriaLabel: t("attendance.trash.selectAll"),
                selectRowAriaLabel: (r) =>
                  t("attendance.trash.selectRecord", { student: r.studentName }),
              }
            : undefined
        }
        columnResize={{
          getColumnWidth,
          onColumnResize,
        }}
        renderRowActions={renderRowActions}
        actionsLabel={t("attendance.table.actions")}
        emptyState={
          <EmptyState
            title={t("attendance.empty.records")}
            description={t("attendance.empty.recordsHint")}
            compact
          />
        }
        footerCount={{
          selectedCountLabel: t("attendance.selectedCount", { count: selectedIds.length }),
          pageCountLabel: recordsCountLabel,
        }}
      />
    </article>
  );
}
