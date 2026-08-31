import React from 'react';
import { FileQuestion } from 'lucide-react';
import type { QuestionBankQuestion as Question } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { DetailDrawerShell } from '@/components/ui/DetailDrawerShell';
import { DetailDrawerArchivedBanner, DetailDrawerRestoreOrEditAction } from '@/components/ui/DetailDrawerArchiveChrome';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { Card } from '@/components/ui/card';
import { DetailAttributeRow } from '@/components/ui/DetailAttributeRow';
import { CategoryColorChip } from '@/tenant/features/question-bank/components/CategoryColorChip';
import type { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';

export interface QuestionBankDetailProps {
  question: Question;
  config: ReturnType<typeof useQuestionBankConfig>;
    onClose: () => void;
  onEdit?: (question: Question) => void;
  canDelete?: boolean;
  onRestore?: (questionId: string) => void | Promise<void>;
}

export const QuestionBankDetail = (function QuestionBankDetail({
  question,
  config,
  onClose,
  onEdit,
  canDelete = false,
  onRestore,
}: QuestionBankDetailProps) {
  const { t } = useTranslation();
  const isArchived = !!question.deletedAt;

  return (
    <DetailDrawerShell
      open
      onClose={onClose}
      title={t('questionBank.detail.title')}
      subtitle={question.type}
      icon={FileQuestion}
      headerExtra={isArchived && <DetailDrawerArchivedBanner deletedAt={question.deletedAt} />}
      headerActions={
        <DetailDrawerRestoreOrEditAction
          isArchived={isArchived}
          canEdit={!!onEdit}
          canRestore={canDelete}
          onEdit={() => onEdit?.(question)}
          onRestore={() => onRestore?.(question.id)}
          restoreLabel={t('common.restore')}
          editLabel={t('common.edit')}
        />
      }
    >
      <div className="flex flex-col gap-6 py-6">
        <section>
          <DetailSectionTitle>{t('questionBank.detail.overview')}</DetailSectionTitle>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              <DetailAttributeRow 
                label={t('questionBank.fields.type')}
                value={config.typeLabel?.(question.type) || question.type} 
              />
              <DetailAttributeRow 
                label={t('questionBank.fields.difficulty')}
                value={config.difficultyLabel?.(question.difficulty) || question.difficulty} 
              />
              <DetailAttributeRow 
                label={t('questionBank.fields.category')}
                value={
                  <div className="flex flex-wrap gap-1">
                    {question.categoryIds?.map(catId => (
                      <CategoryColorChip key={catId} name={config.categories.find(c => c.id === catId)?.name || catId} color={config.categories.find(c => c.id === catId)?.color || '#ccc'} />
                    ))}
                  </div>
                } 
              />
              <DetailAttributeRow 
                label={t('questionBank.fields.marks')}
                value={question.marks ?? 1} 
              />
            </div>
          </Card>
        </section>

        <section>
          <DetailSectionTitle>{t('questionBank.fields.content')}</DetailSectionTitle>
          <Card className="p-4">
            <div className="whitespace-pre-line text-sm text-foreground">{question.text}</div>
          </Card>
        </section>

        {question.answer && (
          <section>
            <DetailSectionTitle>{t('questionBank.fields.explanation')}</DetailSectionTitle>
            <Card className="p-4">
              <div className="whitespace-pre-line text-sm text-foreground">{question.answer}</div>
            </Card>
          </section>
        )}
      </div>
    </DetailDrawerShell>
  );
});
