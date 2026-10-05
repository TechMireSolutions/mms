import React from 'react';
import { formatDate } from '@mms/shared';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkCardAction } from '@/hooks/useWorkCardAction';
import { ENTITY_CARD_OVERFLOW_TRIGGER_CLASS } from '@/components/ui/entityCardChrome';
import { EntityCardFooterActions } from '@/components/ui/EntityCardFooterActions';
import { EntityCardMetaTile } from '@/components/ui/EntityCardMetaTile';
import { EntityCardsGrid } from "@/components/ui/EntityCardsGrid";
import { EntityCard } from "@/components/ui/EntityCard";
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
    <EntityCard
      key={exam.id}
      isSelected={isSelected}
      reducedMotion={reducedMotion}
      {...cardProps}
      onClick={props.onRowClick ? () => props.onRowClick!(exam.id) : undefined}
    >
      <EntityCard.Header
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

      <EntityCard.MetaGrid>
        {isColumnVisible('date') && (
          <EntityCardMetaTile label={t('examinations.columns.exam.date')}>
            {formatDate(exam.date, true)}
          </EntityCardMetaTile>
        )}
        {isColumnVisible('duration') && (
          <EntityCardMetaTile label={t('examinations.columns.exam.duration')}>
            {t('examinations.durationMinutes', { minutes: exam.duration })}
          </EntityCardMetaTile>
        )}
        {isColumnVisible('totalMarks') && (
          <EntityCardMetaTile label={t('examinations.columns.exam.totalMarks')}>
            <span className="font-semibold">{exam.totalMarks}</span>
          </EntityCardMetaTile>
        )}
        {isColumnVisible('passingMarks') && (
          <EntityCardMetaTile label={t('examinations.columns.exam.passingMarks')}>
            {exam.passingMarks}
          </EntityCardMetaTile>
        )}
        {isColumnVisible('status') && (
          <EntityCardMetaTile label={t('examinations.columns.exam.status')}>
            <StatusBadge status={exam.status} config={statusConfig} size="sm" />
          </EntityCardMetaTile>
        )}
        {isColumnVisible('classes') && (
          <EntityCardMetaTile label={t('examinations.columns.exam.classes')}>
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
          </EntityCardMetaTile>
        )}
      </EntityCard.MetaGrid>

      <EntityCardFooterActions
        overflowActions={
          <ExaminationsRowActions
            exam={exam}
            canWrite={canWrite}
            canDelete={canTrashRows}
            showDeleted={showDeleted}
            triggerClassName={ENTITY_CARD_OVERFLOW_TRIGGER_CLASS}
            onEdit={onEdit}
            onTrashAction={onTrashAction}
          />
        }
      />
    </EntityCard>
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
    <EntityCardsGrid
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
