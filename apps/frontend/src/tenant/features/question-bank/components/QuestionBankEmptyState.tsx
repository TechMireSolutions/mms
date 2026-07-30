import type { JSX } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export function QuestionBankEmptyState(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border-2 border-dashed border-border py-14 text-center" role="status">
      <p className="text-sm font-medium text-muted-foreground">{t('questionBank.noQuestions')}</p>
    </div>
  );
}
