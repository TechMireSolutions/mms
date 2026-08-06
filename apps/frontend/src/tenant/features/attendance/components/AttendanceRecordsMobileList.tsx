import type React from 'react';
import { motion } from 'framer-motion';
import { formatDate } from '@mms/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { TimePicker } from '@/components/ui/TimePicker';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { AttendanceRecord, AttendanceStatus } from '@/lib/data/attendanceData';
import { AttendanceRecordStatusCell } from './AttendanceRecordStatusCell';

interface AttendanceRecordsMobileListProps {
  paginatedRecords: AttendanceRecord[];
  isColumnVisible: (key: string) => boolean;
  editingRecord: AttendanceRecord | null;
  statuses: AttendanceStatus[];
  updateDraft: <K extends keyof AttendanceRecord>(key: K, value: AttendanceRecord[K]) => void;
  classLabel: (classId: string) => string;
  renderRowActions: (attendanceRecord: AttendanceRecord) => React.ReactNode;
  t: TranslationFunction;
}

export function AttendanceRecordsMobileList({
  paginatedRecords,
  isColumnVisible,
  editingRecord,
  statuses,
  updateDraft,
  classLabel,
  renderRowActions,
  t,
}: AttendanceRecordsMobileListProps): React.JSX.Element {
  if (paginatedRecords.length === 0) {
    return <EmptyState title={t('attendance.empty.records')} compact />;
  }

  return (
    <>
      {paginatedRecords.map((attendanceRecord) => (
        <motion.article
          key={attendanceRecord.id}
          layout
          className="space-y-3 rounded-xl border border-border bg-card p-3"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              {isColumnVisible("student") && <h4 className="truncate text-sm font-semibold text-foreground">{attendanceRecord.studentName}</h4>}
              {isColumnVisible("class") && <p className="truncate text-xs text-muted-foreground">{classLabel(attendanceRecord.classId)}</p>}
            </div>
            {isColumnVisible("status") && (
              <AttendanceRecordStatusCell
                attendanceRecord={attendanceRecord}
                editingRecord={editingRecord}
                statuses={statuses}
                updateDraft={updateDraft}
              />
            )}
          </div>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {isColumnVisible("date") && (
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t('attendance.columns.date')}</dt>
                <dd className="font-mono text-foreground">{formatDate(attendanceRecord.date, true)}</dd>
              </div>
            )}
            {isColumnVisible("timeIn") && (
              <div>
                <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t('attendance.columns.timeIn')}</dt>
                <dd>
                  {editingRecord?.id === attendanceRecord.id
                    ? <TimePicker
                        id={`attendance-mobile-time-in-${attendanceRecord.id}`}
                        name="timeIn"
                        value={editingRecord.timeIn}
                        onChange={(nextValue) => updateDraft('timeIn', nextValue)}
                        aria-label={t('attendance.columns.timeIn')}
                        className="w-full min-w-0 text-xs"
                      />
                    : <span className="font-mono text-xs text-muted-foreground">{attendanceRecord.timeIn || '—'}</span>}
                </dd>
              </div>
            )}
            {isColumnVisible("timeOut") && (
              <div>
                <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t('attendance.columns.timeOut')}</dt>
                <dd>
                  {editingRecord?.id === attendanceRecord.id
                    ? <TimePicker
                        id={`attendance-mobile-time-out-${attendanceRecord.id}`}
                        name="timeOut"
                        value={editingRecord.timeOut}
                        onChange={(nextValue) => updateDraft('timeOut', nextValue)}
                        aria-label={t('attendance.columns.timeOut')}
                        className="w-full min-w-0 text-xs"
                      />
                    : <span className="font-mono text-xs text-muted-foreground">{attendanceRecord.timeOut || '—'}</span>}
                </dd>
              </div>
            )}
            {isColumnVisible("notes") && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-muted-foreground">{t('attendance.columns.notes')}</dt>
                <dd className="break-words text-xs text-muted-foreground">{attendanceRecord.notes || '—'}</dd>
              </div>
            )}
          </dl>
          {renderRowActions(attendanceRecord)}
        </motion.article>
      ))}
    </>
  );
}
