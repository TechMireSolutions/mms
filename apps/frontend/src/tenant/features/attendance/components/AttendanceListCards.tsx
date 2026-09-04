import type React from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { formatDate } from '@mms/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { TimePicker } from '@/components/ui/TimePicker';
import { DirectoryCardFooter } from '@/components/ui/DirectoryCardFooter';
import { DirectoryCardHeader } from '@/components/ui/DirectoryCardHeader';
import { ModuleDirectoryCards } from '@/components/ui/ModuleDirectoryCards';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { StatGrid, StatRow } from '@/components/ui/StatGrid';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { AttendanceRecord, AttendanceStatus } from '@/lib/data/attendanceData';
import { AttendanceRecordStatusCell } from './AttendanceRecordStatusCell';

export interface AttendanceListCardsProps {
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

export type AttendanceRecordsMobileListProps = AttendanceListCardsProps;

export function AttendanceListCards({
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

  const selectedSet = new Set(selectedIds);

  return (
    <div className="space-y-4">
      <ModuleDirectoryCards
        items={paginatedRecords}
        selectedIds={selectedIds}
        onSelectAll={canDelete ? () => onToggleSelectAll(!allVisibleSelected) : undefined}
        allSelected={allVisibleSelected}
        someSelected={someVisibleSelected}
        selectAllLabel={t('attendance.trash.selectAll')}
        deselectAllLabel={t('common.deselect')}
        selectedCountLabel={t('attendance.trash.selected', { count: selectedIds.length })}
        pageCountLabel={pageCountLabel}
        checkboxIdPrefix="attendance-select-cards"
        renderItem={(attendanceRecord) => {
          const isSelected = selectedSet.has(attendanceRecord.id);
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
              <StatGrid columns="sm2" className="ms-1">
                {isColumnVisible("date") && (
                  <StatRow
                    label={t('attendance.columns.date')}
                    value={formatDate(attendanceRecord.date, true)}
                    ddClassName="font-mono"
                  />
                )}
                {isColumnVisible("session") && (
                  <StatRow
                    label={t('attendance.columns.session')}
                    value={attendanceRecord.sessionName || '—'}
                  />
                )}
                {isColumnVisible("status") && (
                  <StatRow
                    label={t('attendance.columns.status')}
                    value={
                      <AttendanceRecordStatusCell
                        attendanceRecord={attendanceRecord}
                        editingRecord={editingRecord}
                        statuses={statuses}
                        updateDraft={updateDraft}
                      />
                    }
                    dtClassName="mb-1"
                  />
                )}
                {isColumnVisible("timeIn") && (
                  <StatRow
                    label={t('attendance.columns.timeIn')}
                    value={
                      editingRecord?.id === attendanceRecord.id
                        ? <TimePicker
                            id={`attendance-mobile-time-in-${attendanceRecord.id}`}
                            name="timeIn"
                            value={editingRecord.timeIn}
                            onChange={(nextValue) => updateDraft('timeIn', nextValue)}
                            aria-label={t('attendance.columns.timeIn')}
                            className="w-full min-w-0 text-xs"
                          />
                        : <span className="font-mono text-xs text-muted-foreground">{attendanceRecord.timeIn || '—'}</span>}
                    dtClassName="mb-1"
                  />
                )}
                {isColumnVisible("timeOut") && (
                  <StatRow
                    label={t('attendance.columns.timeOut')}
                    value={
                      editingRecord?.id === attendanceRecord.id
                        ? <TimePicker
                            id={`attendance-mobile-time-out-${attendanceRecord.id}`}
                            name="timeOut"
                            value={editingRecord.timeOut}
                            onChange={(nextValue) => updateDraft('timeOut', nextValue)}
                            aria-label={t('attendance.columns.timeOut')}
                            className="w-full min-w-0 text-xs"
                          />
                        : <span className="font-mono text-xs text-muted-foreground">{attendanceRecord.timeOut || '—'}</span>}
                    dtClassName="mb-1"
                  />
                )}
                {isColumnVisible("notes") && (
                  <StatRow
                    fullWidth
                    label={t('attendance.columns.notes')}
                    value={attendanceRecord.notes || '—'}
                    ddClassName="break-words text-xs text-muted-foreground"
                  />
                )}
              </StatGrid>
              <DirectoryCardFooter trailing={renderRowActions(attendanceRecord)} />
            </DirectoryEntityCard>
          );
        }}
      />
    </div>
  );
}
