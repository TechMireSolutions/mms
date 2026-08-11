import type React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleTableHeaderCell } from '@/components/ui/ModuleTableHeaderCell';
import { ModuleTableFooterCount } from '@/components/ui/ModuleTableFooterCount';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
import type { AttendanceRecord, AttendanceStatus } from '@/lib/data/attendanceData';
import { AttendanceRecordStatusCell } from './AttendanceRecordStatusCell';
import { TimePicker } from '@/components/ui/TimePicker';
import { motion } from 'framer-motion';
import { formatDate } from '@mms/shared';
import { useListRowMotion } from '@/hooks/useListRowMotion';

interface AttendanceRecordsTableProps {
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

export function AttendanceRecordsTable({
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
}: AttendanceRecordsTableProps): React.JSX.Element {
  const rowMotion = useListRowMotion({ layout: true });
  const recordsCountLabel = formatDirectoryPageCountLabel(paginatedRecords.length, t, {
    singular: 'attendance.item.record',
    plural: 'attendance.item.records',
  });

  return (
    <article className={WORK_SURFACE}>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/60 hover:bg-muted/60">
            {canDelete && (
              <TableHead className="px-3 py-2.5 w-10 h-auto">
                <Checkbox
                  checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                  aria-label={t('attendance.trash.selectAll')}
                />
              </TableHead>
            )}
            {isColumnVisible("date") && (
              <ModuleTableHeaderCell columnKey="date" width={getColumnWidth?.('date')} onResize={onColumnResize} className="px-3 py-2.5">
                {t('attendance.columns.date')}
              </ModuleTableHeaderCell>
            )}
            {isColumnVisible("class") && (
              <ModuleTableHeaderCell columnKey="class" width={getColumnWidth?.('class')} onResize={onColumnResize} className="px-3 py-2.5">
                {t('attendance.columns.class')}
              </ModuleTableHeaderCell>
            )}
            {isColumnVisible("student") && (
              <ModuleTableHeaderCell columnKey="student" width={getColumnWidth?.('student')} onResize={onColumnResize} className="px-3 py-2.5">
                {t('attendance.columns.student')}
              </ModuleTableHeaderCell>
            )}
            {isColumnVisible("status") && (
              <ModuleTableHeaderCell columnKey="status" width={getColumnWidth?.('status')} onResize={onColumnResize} className="px-3 py-2.5">
                {t('attendance.columns.status')}
              </ModuleTableHeaderCell>
            )}
            {isColumnVisible("timeIn") && (
              <ModuleTableHeaderCell columnKey="timeIn" width={getColumnWidth?.('timeIn')} onResize={onColumnResize} className="px-3 py-2.5">
                {t('attendance.columns.timeIn')}
              </ModuleTableHeaderCell>
            )}
            {isColumnVisible("timeOut") && (
              <ModuleTableHeaderCell columnKey="timeOut" width={getColumnWidth?.('timeOut')} onResize={onColumnResize} className="px-3 py-2.5">
                {t('attendance.columns.timeOut')}
              </ModuleTableHeaderCell>
            )}
            {isColumnVisible("notes") && (
              <ModuleTableHeaderCell columnKey="notes" width={getColumnWidth?.('notes')} onResize={onColumnResize} className="px-3 py-2.5">
                {t('attendance.columns.notes')}
              </ModuleTableHeaderCell>
            )}
            <TableHead className="px-3 py-2.5 text-end h-auto">
              <span className="sr-only">{t('attendance.table.actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
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
                        className="w-full min-w-[6.5rem] max-w-[8rem] text-xs"
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
                        className="w-full min-w-[6.5rem] max-w-[8rem] text-xs"
                      />
                    : <span className="text-xs text-muted-foreground font-mono">{attendanceRecord.timeOut || '—'}</span>
                  }
                </TableCell>
              )}
              {isColumnVisible("notes") && (
                <TableCell className="px-3 py-2.5 max-w-[10rem] truncate text-xs text-muted-foreground">{attendanceRecord.notes || '—'}</TableCell>
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
