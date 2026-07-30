import type React from 'react';
import { motion } from 'framer-motion';
import { formatDate } from '@mms/shared';
import { Input } from '@/components/ui/input';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { AttendanceRecord, AttendanceStatus } from '@/lib/data/attendanceData';
import { AttendanceRecordStatusCell } from './AttendanceRecordStatusCell';

interface AttendanceRecordsMobileListProps {
  paginatedRecords: AttendanceRecord[];
  showDate: boolean;
  showClass: boolean;
  showStudent: boolean;
  showStatus: boolean;
  showTimeIn: boolean;
  showTimeOut: boolean;
  showNotes: boolean;
  editingRecord: AttendanceRecord | null;
  statuses: AttendanceStatus[];
  updateDraft: <K extends keyof AttendanceRecord>(key: K, value: AttendanceRecord[K]) => void;
  classLabel: (classId: string) => string;
  renderRowActions: (attendanceRecord: AttendanceRecord) => React.ReactNode;
  t: TranslationFunction;
}

export function AttendanceRecordsMobileList({
  paginatedRecords,
  showDate,
  showClass,
  showStudent,
  showStatus,
  showTimeIn,
  showTimeOut,
  showNotes,
  editingRecord,
  statuses,
  updateDraft,
  classLabel,
  renderRowActions,
  t,
}: AttendanceRecordsMobileListProps): React.JSX.Element {
  if (paginatedRecords.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{t('attendance.empty.records')}</p>;
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
                <dt className="text-xs font-semibold text-muted-foreground">{t('attendance.columns.date')}</dt>
                <dd className="font-mono text-foreground">{formatDate(attendanceRecord.date, true)}</dd>
              </div>
            )}
            {showTimeIn && (
              <div>
                <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t('attendance.columns.timeIn')}</dt>
                <dd>
                  {editingRecord?.id === attendanceRecord.id
                    ? <Input type="time" value={editingRecord.timeIn} onChange={(event) => updateDraft('timeIn', event.target.value)}
                        aria-label={t('attendance.columns.timeIn')}
                        className="w-full min-w-0 text-xs" />
                    : <span className="font-mono text-xs text-muted-foreground">{attendanceRecord.timeIn || '—'}</span>}
                </dd>
              </div>
            )}
            {showTimeOut && (
              <div>
                <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t('attendance.columns.timeOut')}</dt>
                <dd>
                  {editingRecord?.id === attendanceRecord.id
                    ? <Input type="time" value={editingRecord.timeOut} onChange={(event) => updateDraft('timeOut', event.target.value)}
                        aria-label={t('attendance.columns.timeOut')}
                        className="w-full min-w-0 text-xs" />
                    : <span className="font-mono text-xs text-muted-foreground">{attendanceRecord.timeOut || '—'}</span>}
                </dd>
              </div>
            )}
            {showNotes && (
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
