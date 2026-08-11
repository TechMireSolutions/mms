import type { JSX } from 'react';
import { formatDate } from '@mms/shared';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTranslation } from '@/hooks/useTranslation';
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from '@/components/ui/directoryCardChrome';
import { DirectoryCardFooter } from '@/components/ui/DirectoryCardFooter';
import { DirectoryCardHeader } from '@/components/ui/DirectoryCardHeader';
import { DirectoryCardsGrid } from '@/components/ui/DirectoryCardsGrid';
import { DirectoryCardsSelectAllBar } from '@/components/ui/DirectoryCardsSelectAllBar';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDirectoryPageCountLabel } from '@/lib/formatDirectoryPageCountLabel';
import { ExaminationsRowActions } from '@/tenant/features/examinations/components/ExaminationsRowActions';
import {
  getExamMeta,
  type ExaminationsListContentProps,
} from '@/tenant/features/examinations/components/examinationsListContentShared';

type ExaminationsListCardsProps = Omit<
  ExaminationsListContentProps,
  'getColumnWidth' | 'onColumnResize'
>;

export function ExaminationsListCards(props: ExaminationsListCardsProps): JSX.Element {
  const {
    exams,
    selectedIds,
    isColumnVisible,
    classes,
    enrollments,
    allVisibleSelected,
    someVisibleSelected,
    canWrite,
    canDelete,
    showDeleted,
    canTrashRows,
    statusConfig,
    onEdit,
    onToggleSelectAll,
    onToggleSelectedExam,
    onTrashAction,
  } = props;
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const pageCountLabel = formatDirectoryPageCountLabel(exams.length, t, {
    singular: 'examinations.item.exam',
    plural: 'examinations.item.exams',
  });

  return (
    <>
      {canDelete && exams.length > 0 ? (
        <DirectoryCardsSelectAllBar
          checkboxId="examinations-select-all-cards"
          allSelected={allVisibleSelected}
          someSelected={someVisibleSelected}
          onSelectAll={() => onToggleSelectAll(!allVisibleSelected)}
          selectLabel={t('examinations.trash.selectAll')}
          deselectLabel={t('common.deselect')}
          selectedCount={selectedIds.length}
          selectedCountLabel={t('examinations.trash.selected', { count: selectedIds.length })}
          pageCountLabel={pageCountLabel}
        />
      ) : null}

      <DirectoryCardsGrid>
        {exams.map((exam) => {
          const { assignedClasses, studentCount } = getExamMeta(exam, classes, enrollments);
          const isSelected = selectedIds.includes(exam.id);

          return (
            <DirectoryEntityCard key={exam.id} isSelected={isSelected} reducedMotion={reducedMotion}>
              <DirectoryCardHeader
                id={exam.id}
                displayName={exam.name}
                isSelected={isSelected}
                showSelect={canDelete}
                onSelect={() => onToggleSelectedExam(exam.id, !isSelected)}
                selectAriaLabel={t('examinations.trash.selectExam', { name: exam.name })}
                onView={() => {
                  if (canWrite && !showDeleted) onEdit(exam);
                }}
                viewAriaLabel={t('examinations.editExamAria', { name: exam.name })}
                reducedMotion={reducedMotion}
                subtitle={
                  isColumnVisible('subject') ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{exam.subject}</p>
                  ) : undefined
                }
              />

              <dl className="ms-1 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {isColumnVisible('date') && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('examinations.columns.exam.date')}</dt>
                    <dd className="text-foreground">{formatDate(exam.date, true)}</dd>
                  </div>
                )}
                {isColumnVisible('duration') && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('examinations.columns.exam.duration')}</dt>
                    <dd className="text-foreground">{t('examinations.durationMinutes', { minutes: exam.duration })}</dd>
                  </div>
                )}
                {isColumnVisible('totalMarks') && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('examinations.columns.exam.totalMarks')}</dt>
                    <dd className="font-semibold text-foreground">{exam.totalMarks}</dd>
                  </div>
                )}
                {isColumnVisible('passingMarks') && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('examinations.columns.exam.passingMarks')}</dt>
                    <dd className="text-foreground">{exam.passingMarks}</dd>
                  </div>
                )}
                {isColumnVisible('status') && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t('examinations.columns.exam.status')}</dt>
                    <dd className="pt-1">
                      <StatusBadge status={exam.status} config={statusConfig} size="sm" />
                    </dd>
                  </div>
                )}
                {isColumnVisible('classes') && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-muted-foreground">{t('examinations.columns.exam.classes')}</dt>
                    <dd className="text-foreground">
                      {assignedClasses.length > 0
                        ? assignedClasses.map((sessionClass) => sessionClass.name).join(', ')
                        : '—'}
                    </dd>
                    <dd className="text-xs text-muted-foreground">{t('examinations.studentCount', { count: studentCount })}</dd>
                  </div>
                )}
              </dl>

              <DirectoryCardFooter
                trailing={
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
        })}
      </DirectoryCardsGrid>
    </>
  );
}
