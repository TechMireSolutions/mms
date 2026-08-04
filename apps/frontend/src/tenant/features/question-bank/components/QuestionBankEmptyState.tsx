import type { JSX } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { EmptyState } from '@/components/ui/EmptyState';

export function QuestionBankEmptyState(): JSX.Element {
  const { t } = useTranslation();

  return (
    <EmptyState
      variant="dashed"
      icon={null}
      title={t('questionBank.noQuestions')}
      className="py-14"
    />
  );
}
