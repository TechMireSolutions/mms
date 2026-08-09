import type React from 'react';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { EmptyState } from '@/components/ui/EmptyState';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { AttendanceRecord, AttendanceStatus } from '@/lib/data/attendanceData';
import { AttendanceRecordsMobileList } from './AttendanceRecordsMobileList';
import { AttendanceRecordStatusCell } from './AttendanceRecordStatusCell';
import { TimePicker } from '@/components/ui/TimePicker';
import { motion } from 'framer-motion';
import { formatDate } from '@mms/shared';
import { useListRowMotion } from '@/hooks/useListRowMotion';

interface AttendanceRecordsTableProps {
  viewMode: WorkDirectoryViewMode;
  paginatedRecords: AttendanceRecord[];
  isColumnVisible: (key: string) => boolean;
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
  viewMode,
  paginatedRecords,
  isColumnVisible,
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
  const rowMotion = useListRowMotion({ layout: true });
  if (viewMode === 'cards') {
    return (
      <article className="rounded-xl border border-border overflow-hidden">
        <div className="space-y-3 p-3">
          <AttendanceRecordsMobileList
            paginatedRecords={paginatedRecords}
            isColumnVisible={isColumnVisible}
            editingRecord={editingRecord}
            statuses={statuses}
            updateDraft={updateDraft}
            classLabel={classLabel}
            renderRowActions={renderRowActions}
            t={t}
          />
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              {isColumnVisible("date") && (
                <ResizableTableHead columnKey="date" width={getColumnWidth?.('date')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t('attendance.columns.date')}
                </ResizableTableHead>
              )}
              {isColumnVisible("class") && (
                <ResizableTableHead columnKey="class" width={getColumnWidth?.('class')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t('attendance.columns.class')}
                </ResizableTableHead>
              )}
              {isColumnVisible("student") && (
                <ResizableTableHead columnKey="student" width={getColumnWidth?.('student')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t('attendance.columns.student')}
                </ResizableTableHead>
              )}
              {isColumnVisible("status") && (
                <ResizableTableHead columnKey="status" width={getColumnWidth?.('status')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t('attendance.columns.status')}
                </ResizableTableHead>
              )}
              {isColumnVisible("timeIn") && (
                <ResizableTableHead columnKey="timeIn" width={getColumnWidth?.('timeIn')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t('attendance.columns.timeIn')}
                </ResizableTableHead>
              )}
              {isColumnVisible("timeOut") && (
                <ResizableTableHead columnKey="timeOut" width={getColumnWidth?.('timeOut')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t('attendance.columns.timeOut')}
                </ResizableTableHead>
              )}
              {isColumnVisible("notes") && (
                <ResizableTableHead columnKey="notes" width={getColumnWidth?.('notes')} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t('attendance.columns.notes')}
                </ResizableTableHead>
              )}
              <th className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">
                <span className="sr-only">{t('common.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedRecords.length === 0 ? (
              <tr><td colSpan={visibleColCount} className="py-4"><EmptyState title={t('attendance.empty.records')} compact /></td></tr>
            ) : paginatedRecords.map((attendanceRecord) => (
              <motion.tr key={attendanceRecord.id} {...rowMotion()} className="hover:bg-muted/20 transition-colors">
                {isColumnVisible("date") && (
                  <td className="px-3 py-2.5 font-mono text-xs text-foreground whitespace-nowrap">{formatDate(attendanceRecord.date, true)}</td>
                )}
                {isColumnVisible("class") && (
                  <td className="px-3 py-2.5 text-foreground whitespace-nowrap">{classLabel(attendanceRecord.classId)}</td>
                )}
                {isColumnVisible("student") && (
                  <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{attendanceRecord.studentName}</td>
                )}
                {isColumnVisible("status") && (
                  <td className="px-3 py-2.5">
                    <AttendanceRecordStatusCell
                      attendanceRecord={attendanceRecord}
                      editingRecord={editingRecord}
                      statuses={statuses}
                      updateDraft={updateDraft}
                    />
                  </td>
                )}
                {isColumnVisible("timeIn") && (
                  <td className="px-3 py-2.5">
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
                  </td>
                )}
                {isColumnVisible("timeOut") && (
                  <td className="px-3 py-2.5">
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
                  </td>
                )}
                {isColumnVisible("notes") && (
                  <td className="px-3 py-2.5 max-w-[10rem] truncate text-xs text-muted-foreground">{attendanceRecord.notes || '—'}</td>
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
