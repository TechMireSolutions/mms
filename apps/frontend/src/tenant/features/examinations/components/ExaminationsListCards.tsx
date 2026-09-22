import React from 'react';
import { formatDate } from '@mms/shared';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkCardAction } from '@/hooks/useWorkCardAction';
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from '@/components/ui/directoryCardChrome';
import { DirectoryCardFooterActions } from '@/components/ui/DirectoryCardFooterActions';
import { DirectoryCardHeader } from '@/components/ui/DirectoryCardHeader';
import { DirectoryCardMetaGrid } from '@/components/ui/DirectoryCardMetaGrid';
import { DirectoryCardMetaTile } from '@/components/ui/DirectoryCardMetaTile';
import { ModuleDirectoryCards } from '@/components/ui/ModuleDirectoryCards';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
import { ExaminationsRowActions } from '@/tenant/features/examinations/components/ExaminationsRowActions';
import {
  getExamMeta,
  type ExaminationsListContentProps,
} from '@/tenant/features/examinations/components/examinationsListContentShared';

export type ExaminationsListCardsProps = Omit<
  ExaminationsListContentProps,
  'getColumnWidth' | 'onColumnResize'
>;

function ExaminationCard({
  exam,
  props,
  reducedMotion,
}: {
  exam: ExaminationsListCardsProps['exams'][number];
  props: ExaminationsListCardsProps;
  reducedMotion: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const {
    selectedIds,
    isColumnVisible,
    classes,
    enrollments,
    canWrite,
    canDelete,
    showDeleted,
    canTrashRows,
    statusConfig,
    onEdit,
    onToggleSelectedExam,
    onTrashAction,
  } = props;

  /**
   * onView opens the edit form only when allowed — this is the Examinations
   * domain convention (no separate read-only detail drawer; edit IS the view).
   * Guard is applied here rather than inline so the header onView and
   * keyboard Enter both share the same behaviour.
   */
  const canViewEdit = canWrite && !showDeleted;

  const { isSelected, onSelect, onView: handleView, cardProps } = useWorkCardAction({
    entity: exam,
    selectedIds,
    onToggleSelected: onToggleSelectedExam,
    onView: canViewEdit ? onEdit : undefined,
    canSelect: canDelete,
  });

  const { assignedClasses, studentCount } = getExamMeta(exam, classes, enrollments);

  return (
    <DirectoryEntityCard
      key={exam.id}
      isSelected={isSelected}
      reducedMotion={reducedMotion}
      {...cardProps}
      onClick={props.onRowClick ? () => props.onRowClick!(exam.id) : undefined}
    >
      <DirectoryCardHeader
        id={exam.id}
        displayName={exam.name}
        isSelected={isSelected}
        showSelect={canDelete}
        onSelect={onSelect}
        selectAriaLabel={t('examinations.trash.selectExam', { name: exam.name })}
        onView={canViewEdit ? handleView : undefined}
        viewAriaLabel={t('examinations.editExamAria', { name: exam.name })}
        reducedMotion={reducedMotion}
        subtitle={
          isColumnVisible('subject') ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{exam.subject}</p>
          ) : undefined
        }
      />

      <DirectoryCardMetaGrid>
        {isColumnVisible('date') && (
          <DirectoryCardMetaTile label={t('examinations.columns.exam.date')}>
            {formatDate(exam.date, true)}
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible('duration') && (
          <DirectoryCardMetaTile label={t('examinations.columns.exam.duration')}>
            {t('examinations.durationMinutes', { minutes: exam.duration })}
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible('totalMarks') && (
          <DirectoryCardMetaTile label={t('examinations.columns.exam.totalMarks')}>
            <span className="font-semibold">{exam.totalMarks}</span>
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible('passingMarks') && (
          <DirectoryCardMetaTile label={t('examinations.columns.exam.passingMarks')}>
            {exam.passingMarks}
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible('status') && (
          <DirectoryCardMetaTile label={t('examinations.columns.exam.status')}>
            <StatusBadge status={exam.status} config={statusConfig} size="sm" />
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible('classes') && (
          <DirectoryCardMetaTile label={t('examinations.columns.exam.classes')}>
            <span className="break-words">
              {assignedClasses.length > 0
                ? assignedClasses.map((c) => c.name).join(', ')
                : '—'}
            </span>
            {studentCount > 0 && (
              <span className="block text-xs text-muted-foreground mt-0.5">
                {t('examinations.studentCount', { count: studentCount })}
              </span>
            )}
          </DirectoryCardMetaTile>
        )}
      </DirectoryCardMetaGrid>

      <DirectoryCardFooterActions
        overflowActions={
          <ExaminationsRowActions
            exam={exam}
            canWrite={canWrite}
            canDelete={canTrashRows}
            showDeleted={showDeleted}
            triggerClassName={DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS}
            onEdit={onEdit}
            onTrashAction={onTrashAction}
          />
        }
      />
    </DirectoryEntityCard>
  );
}

export function ExaminationsListCards(props: ExaminationsListCardsProps): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { exams, selectedIds, canDelete, allVisibleSelected, someVisibleSelected, onToggleSelectAll } = props;

  const pageCountLabel = formatDirectoryPageCountLabel(exams.length, t, {
    singular: 'examinations.item.exam',
    plural: 'examinations.item.exams',
  });

  return (
    <ModuleDirectoryCards
      items={exams}
      selectedIds={selectedIds}
      onSelectAll={canDelete ? () => onToggleSelectAll(!allVisibleSelected) : undefined}
      allSelected={allVisibleSelected}
      someSelected={someVisibleSelected}
      selectAllLabel={t('examinations.trash.selectAll')}
      deselectAllLabel={t('common.deselect')}
      selectedCountLabel={t('examinations.trash.selected', { count: selectedIds.length })}
      pageCountLabel={pageCountLabel}
      checkboxIdPrefix="examinations-select-cards"
      renderItem={(exam) => (
        <ExaminationCard key={exam.id} exam={exam} props={props} reducedMotion={reducedMotion} />
      )}
    />
  );
}
