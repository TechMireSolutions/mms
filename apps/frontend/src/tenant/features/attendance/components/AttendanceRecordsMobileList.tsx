import type React from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { formatDate } from '@mms/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { TimePicker } from '@/components/ui/TimePicker';
import { DirectoryCardFooter } from '@/components/ui/DirectoryCardFooter';
import { DirectoryCardHeader } from '@/components/ui/DirectoryCardHeader';
import { DirectoryCardsGrid } from '@/components/ui/DirectoryCardsGrid';
import { DirectoryCardsSelectAllBar } from '@/components/ui/DirectoryCardsSelectAllBar';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
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
  selectedIds: string[];
  canDelete: boolean;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectedRecord: (id: string, checked: boolean) => void;
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
  selectedIds,
  canDelete,
  allVisibleSelected,
  someVisibleSelected,
  onToggleSelectAll,
  onToggleSelectedRecord,
  t,
}: AttendanceRecordsMobileListProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const pageCountLabel = formatDirectoryPageCountLabel(paginatedRecords.length, t, {
    singular: 'attendance.item.record',
    plural: 'attendance.item.records',
  });

  if (paginatedRecords.length === 0) {
    return (
      <EmptyState
        title={t('attendance.empty.records')}
        description={t('attendance.empty.recordsHint')}
        compact
      />
    );
  }

  return (
    <div className="space-y-4">
      {canDelete ? (
        <DirectoryCardsSelectAllBar
          checkboxId="attendance-select-all-cards"
          allSelected={allVisibleSelected}
          someSelected={someVisibleSelected}
          onSelectAll={() => onToggleSelectAll(!allVisibleSelected)}
          selectLabel={t('attendance.trash.selectAll')}
          deselectLabel={t('common.deselect')}
          selectedCount={selectedIds.length}
          selectedCountLabel={t('attendance.trash.selected', { count: selectedIds.length })}
          pageCountLabel={pageCountLabel}
        />
      ) : null}
      <DirectoryCardsGrid>
        {paginatedRecords.map((attendanceRecord) => {
          const isSelected = selectedIds.includes(attendanceRecord.id);
          return (
            <DirectoryEntityCard key={attendanceRecord.id} isSelected={isSelected} reducedMotion={reducedMotion}>
              <DirectoryCardHeader
                id={attendanceRecord.id}
                displayName={attendanceRecord.studentName}
                isSelected={isSelected}
                showSelect={canDelete}
                onSelect={() => onToggleSelectedRecord(attendanceRecord.id, !isSelected)}
                selectAriaLabel={t('attendance.trash.selectRecord', { student: attendanceRecord.studentName })}
                reducedMotion={reducedMotion}
                subtitle={
                  isColumnVisible("class") ? (
                    <p className="truncate text-xs text-muted-foreground">{classLabel(attendanceRecord.classId)}</p>
                  ) : undefined
                }
              />
              <dl className="ms-1 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {isColumnVisible("date") && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('attendance.columns.date')}</dt>
                    <dd className="font-mono text-foreground">{formatDate(attendanceRecord.date, true)}</dd>
                  </div>
                )}
                {isColumnVisible("status") && (
                  <div>
                    <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t('attendance.columns.status')}</dt>
                    <dd>
                      <AttendanceRecordStatusCell
                        attendanceRecord={attendanceRecord}
                        editingRecord={editingRecord}
                        statuses={statuses}
                        updateDraft={updateDraft}
                      />
                    </dd>
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
              <DirectoryCardFooter trailing={renderRowActions(attendanceRecord)} />
            </DirectoryEntityCard>
          );
        })}
      </DirectoryCardsGrid>
    </div>
  );
}
