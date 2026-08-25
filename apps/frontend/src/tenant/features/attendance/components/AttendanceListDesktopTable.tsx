import type React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleTableFooterCount } from '@/components/ui/ModuleTableFooterCount';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
import type { AttendanceRecord, AttendanceStatus } from '@/lib/data/attendanceData';
import { AttendanceRecordStatusCell } from './AttendanceRecordStatusCell';
import { TimePicker } from '@/components/ui/TimePicker';
import { motion } from 'framer-motion';
import { formatDate } from '@mms/shared';
import { useListRowMotion } from '@/hooks/useListRowMotion';

interface AttendanceListDesktopTableProps {
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
  visibleColCount,
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
  const rowMotion = useListRowMotion({ layout: true });
  const recordsCountLabel = formatDirectoryPageCountLabel(paginatedRecords.length, t, {
    singular: 'attendance.item.record',
    plural: 'attendance.item.records',
  });

  return (
    <article className={WORK_SURFACE}>
      <Table className="table-fixed">
        <ModuleWorkTableHeader
          columns={[
            isColumnVisible("date") ? { id: "date", label: t('attendance.columns.date') } : null,
            isColumnVisible("class") ? { id: "class", label: t('attendance.columns.class') } : null,
            isColumnVisible("student") ? { id: "student", label: t('attendance.columns.student') } : null,
            isColumnVisible("status") ? { id: "status", label: t('attendance.columns.status') } : null,
            isColumnVisible("timeIn") ? { id: "timeIn", label: t('attendance.columns.timeIn') } : null,
            isColumnVisible("timeOut") ? { id: "timeOut", label: t('attendance.columns.timeOut') } : null,
            isColumnVisible("notes") ? { id: "notes", label: t('attendance.columns.notes') } : null,
          ].filter((c): c is { id: string; label: string; headerClassName?: string } => c !== null)}
          getColumnWidth={(key) => getColumnWidth?.(key)}
          setColumnWidth={onColumnResize ?? (() => {})}
          selection={canDelete ? {
            allSelected: allVisibleSelected,
            someSelected: someVisibleSelected,
            onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
            ariaLabel: t('attendance.trash.selectAll')
          } : undefined}
          actionsLabel={t('attendance.table.actions')}
        />
        <TableBody className="divide-y divide-border">
          {paginatedRecords.length === 0 ? (
            <TableRow><TableCell colSpan={visibleColCount} className="py-4"><EmptyState title={t('attendance.empty.records')} description={t('attendance.empty.recordsHint')} compact /></TableCell></TableRow>
          ) : paginatedRecords.map((attendanceRecord) => (
            <motion.tr key={attendanceRecord.id} {...rowMotion()} className="group hover:bg-muted/20 transition-colors">
              {canDelete && (
                <TableCell className="px-3 py-2.5">
                  <Checkbox
                    checked={selectedIds.includes(attendanceRecord.id)}
                    onCheckedChange={(checked) => onToggleSelectedRecord(attendanceRecord.id, checked === true)}
                    aria-label={t('attendance.trash.selectRecord', { student: attendanceRecord.studentName })}
                  />
                </TableCell>
              )}
              {isColumnVisible("date") && (
                <TableCell className="px-3 py-2.5 font-mono text-xs text-foreground whitespace-nowrap">{formatDate(attendanceRecord.date, true)}</TableCell>
              )}
              {isColumnVisible("class") && (
                <TableCell className="px-3 py-2.5 text-foreground whitespace-nowrap">{classLabel(attendanceRecord.classId)}</TableCell>
              )}
              {isColumnVisible("student") && (
                <TableCell className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{attendanceRecord.studentName}</TableCell>
              )}
              {isColumnVisible("status") && (
                <TableCell className="px-3 py-2.5">
                  <AttendanceRecordStatusCell
                    attendanceRecord={attendanceRecord}
                    editingRecord={editingRecord}
                    statuses={statuses}
                    updateDraft={updateDraft}
                  />
                </TableCell>
              )}
              {isColumnVisible("timeIn") && (
                <TableCell className="px-3 py-2.5">
                  {editingRecord?.id === attendanceRecord.id
                    ? <TimePicker
                        id={`attendance-time-in-${attendanceRecord.id}`}
                        name="timeIn"
                        value={editingRecord.timeIn}
                        onChange={(nextValue) => updateDraft('timeIn', nextValue)}
                        aria-label={t('attendance.columns.timeIn')}
                        className="w-full min-w-attendance-status max-w-attendance-status text-xs"
                      />
                    : <span className="text-xs text-muted-foreground font-mono">{attendanceRecord.timeIn || '—'}</span>
                  }
                </TableCell>
              )}
              {isColumnVisible("timeOut") && (
                <TableCell className="px-3 py-2.5">
                  {editingRecord?.id === attendanceRecord.id
                    ? <TimePicker
                        id={`attendance-time-out-${attendanceRecord.id}`}
                        name="timeOut"
                        value={editingRecord.timeOut}
                        onChange={(nextValue) => updateDraft('timeOut', nextValue)}
                        aria-label={t('attendance.columns.timeOut')}
                        className="w-full min-w-attendance-status max-w-attendance-status text-xs"
                      />
                    : <span className="text-xs text-muted-foreground font-mono">{attendanceRecord.timeOut || '—'}</span>
                  }
                </TableCell>
              )}
              {isColumnVisible("notes") && (
                <TableCell className="px-3 py-2.5 max-w-cell-sm truncate text-xs text-muted-foreground">{attendanceRecord.notes || '—'}</TableCell>
              )}
              <TableCell className="px-3 py-2.5 text-end">
                {renderRowActions(attendanceRecord)}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
      <ModuleTableFooterCount
        selectedCount={selectedIds.length}
        selectedCountLabel={t('attendance.selectedCount', { count: selectedIds.length })}
        pageCountLabel={recordsCountLabel}
      />
    </article>
  );
}
