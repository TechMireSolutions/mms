import { useMemo } from 'react';
import {
  QUESTION_BANK_MODULE_CONTRACT,
  buildQuestionBankWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';
import {
  useQuestionBankColumnPrefs,
  useQuestionBankColumnPrefsMutation,
} from '@/tenant/features/question-bank/hooks/useQuestionBankApi';

export function useQuestionBankColumnLayout() {
  const { t } = useTranslation();
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useQuestionBankColumnPrefs();
  const { mutate: saveColumnPrefs } = useQuestionBankColumnPrefsMutation();

  const tenantRegistry = useMemo(
    () =>
      buildQuestionBankWorkColumnRegistry({
        text: t('questionBank.columns.text'),
        category: t('questionBank.columns.category'),
        language: t('questionBank.columns.language'),
        type: t('questionBank.columns.type'),
        difficulty: t('questionBank.columns.difficulty'),
        source: t('questionBank.columns.source'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: QUESTION_BANK_MODULE_CONTRACT.moduleId,
    tenantRegistry,
    serverColumnPrefs,
    columnPrefsLoaded,
    saveColumnPrefs,
    translationPrefix: 'questionBank.columns',
  });
}
