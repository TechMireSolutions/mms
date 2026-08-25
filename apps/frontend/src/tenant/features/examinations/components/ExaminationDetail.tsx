import React from 'react';
import { FileSignature } from 'lucide-react';
import type { Exam } from '@/lib/data/examinationData';
import { useTranslation } from '@/hooks/useTranslation';
import { DetailDrawerShell } from '@/components/ui/DetailDrawerShell';
import { DetailDrawerArchivedBanner, DetailDrawerRestoreOrEditAction } from '@/components/ui/DetailDrawerArchiveChrome';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { Card } from '@/components/ui/card';
import { DetailAttributeRow } from '@/components/ui/DetailAttributeRow';
import { formatDate } from '@mms/shared';

export interface ExaminationDetailProps {
  exam: Exam;
  
  onClose: () => void;
  onEdit?: (exam: Exam) => void;
  canDelete?: boolean;
  onRestore?: (examId: string) => void | Promise<void>;
}

export const ExaminationDetail = React.memo(function ExaminationDetail({
  exam,
  onClose,
  onEdit,
  canDelete = false,
  onRestore,
}: ExaminationDetailProps) {
  const { t } = useTranslation();
  const isArchived = !!exam.deletedAt;
  

  return (
    <DetailDrawerShell
      open
      onClose={onClose}
      title={exam.name}
      subtitle={undefined}
      icon={FileSignature}
      headerExtra={isArchived && <DetailDrawerArchivedBanner deletedAt={exam.deletedAt} />}
      headerActions={
        <DetailDrawerRestoreOrEditAction
          isArchived={isArchived}
          canEdit={!!onEdit}
          canRestore={canDelete}
          onEdit={() => onEdit?.(exam)}
          onRestore={() => onRestore?.(exam.id)}
          restoreLabel={t('common.restore' as any)}
          editLabel={t('common.edit' as any)}
        />
      }
    >
      <div className="flex flex-col gap-6 py-6">
        <section>
          <DetailSectionTitle>{t('examinations.detail.overview' as any)}</DetailSectionTitle>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              <DetailAttributeRow 
                label={t('examinations.fields.status' as any)} 
                value={exam.status || '—'} 
              />
              <DetailAttributeRow 
                label={t('examinations.fields.date' as any)} 
                value={exam.date ? formatDate(exam.date) : '—'} 
              />
              <DetailAttributeRow 
                label={t('examinations.fields.classTargets' as any)} 
                value={exam.classIds?.length > 0 ? exam.classIds.join(', ') : '—'} 
              />
            </div>
          </Card>
        </section>

        {exam.description && (
          <section>
            <DetailSectionTitle>{t('examinations.fields.description' as any)}</DetailSectionTitle>
            <Card className="p-4">
              <p className="whitespace-pre-wrap text-sm text-foreground m-0">{exam.description}</p>
            </Card>
          </section>
        )}
      </div>
    </DetailDrawerShell>
  );
});
