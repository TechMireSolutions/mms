import type React from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useWorkCardAction } from '@/hooks/useWorkCardAction';
import { formatDate } from '@mms/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { TimePicker } from '@/components/ui/TimePicker';
import { DirectoryCardFooterActions } from '@/components/ui/DirectoryCardFooterActions';
import { DirectoryCardHeader } from '@/components/ui/DirectoryCardHeader';
import { DirectoryCardMetaGrid } from '@/components/ui/DirectoryCardMetaGrid';
import { DirectoryCardMetaTile } from '@/components/ui/DirectoryCardMetaTile';
import { ModuleDirectoryCards } from '@/components/ui/ModuleDirectoryCards';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
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

const getAttendanceAccentClass = (status?: string): string => {
  if (status === 'present') return 'bg-success/60 group-hover:bg-success';
  if (status === 'absent') return 'bg-destructive/60 group-hover:bg-destructive';
  if (status === 'late') return 'bg-warning/60 group-hover:bg-warning';
  if (status === 'excused') return 'bg-info/60 group-hover:bg-info';
  return 'bg-primary/50 group-hover:bg-primary';
};

function AttendanceCard({
  attendanceRecord,
  isColumnVisible,
  editingRecord,
  statuses,
  updateDraft,
  renderRowActions,
  classLabel,
  selectedIds,
  canDelete,
  onToggleSelectedRecord,
  reducedMotion,
  t,
}: {
  attendanceRecord: AttendanceRecord;
  isColumnVisible: (key: string) => boolean;
  editingRecord: AttendanceRecord | null;
  statuses: AttendanceStatus[];
  updateDraft: <K extends keyof AttendanceRecord>(key: K, value: AttendanceRecord[K]) => void;
  renderRowActions: (record: AttendanceRecord) => React.ReactNode;
  classLabel: (classId: string) => string;
  selectedIds: string[];
  canDelete: boolean;
  onToggleSelectedRecord: (id: string, checked: boolean) => void;
  reducedMotion: boolean;
  t: TranslationFunction;
}): React.JSX.Element {
  const { isSelected, onSelect, cardProps } = useWorkCardAction({
    entity: attendanceRecord,
    selectedIds,
    onToggleSelected: onToggleSelectedRecord,
    canSelect: canDelete,
  });

  return (
    <DirectoryEntityCard
      key={attendanceRecord.id}
      isSelected={isSelected}
      reducedMotion={reducedMotion}
      accentClassName={getAttendanceAccentClass(attendanceRecord.status)}
      {...cardProps}
    >
      <DirectoryCardHeader
        id={attendanceRecord.id}
        displayName={attendanceRecord.studentName}
        isSelected={isSelected}
        showSelect={canDelete}
        onSelect={onSelect}
        selectAriaLabel={t('attendance.trash.selectRecord', { student: attendanceRecord.studentName })}
        reducedMotion={reducedMotion}
        subtitle={
          isColumnVisible("class") ? (
            <p className="truncate text-xs text-muted-foreground">{classLabel(attendanceRecord.classId)}</p>
          ) : undefined
        }
      />
      <DirectoryCardMetaGrid>
        {isColumnVisible("date") && (
          <DirectoryCardMetaTile label={t('attendance.columns.date')}>
            <span className="font-mono">{formatDate(attendanceRecord.date, true)}</span>
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible("session") && (
          <DirectoryCardMetaTile label={t('attendance.columns.session')}>
            {attendanceRecord.sessionName || '—'}
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible("status") && (
          <DirectoryCardMetaTile label={t('attendance.columns.status')}>
            <AttendanceRecordStatusCell
              attendanceRecord={attendanceRecord}
              editingRecord={editingRecord}
              statuses={statuses}
              updateDraft={updateDraft}
            />
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible("timeIn") && (
          <DirectoryCardMetaTile label={t('attendance.columns.timeIn')}>
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
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible("timeOut") && (
          <DirectoryCardMetaTile label={t('attendance.columns.timeOut')}>
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
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible("notes") && (
          <DirectoryCardMetaTile label={t('attendance.columns.notes')}>
            <span className="break-words text-xs text-muted-foreground">{attendanceRecord.notes || '—'}</span>
          </DirectoryCardMetaTile>
        )}
      </DirectoryCardMetaGrid>
      <DirectoryCardFooterActions actions={renderRowActions(attendanceRecord)} />
    </DirectoryEntityCard>
  );
}

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
        renderItem={(attendanceRecord) => (
          <AttendanceCard
            key={attendanceRecord.id}
            attendanceRecord={attendanceRecord}
            isColumnVisible={isColumnVisible}
            editingRecord={editingRecord}
            statuses={statuses}
            updateDraft={updateDraft}
            renderRowActions={renderRowActions}
            classLabel={classLabel}
            selectedIds={selectedIds}
            canDelete={canDelete}
            onToggleSelectedRecord={onToggleSelectedRecord}
            reducedMotion={reducedMotion}
            t={t}
          />
        )}
      />
    </div>
  );
}
