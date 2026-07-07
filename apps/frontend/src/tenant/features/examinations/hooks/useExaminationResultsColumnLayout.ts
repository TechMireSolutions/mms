import { useMemo } from 'react';
import {
  EXAMINATIONS_MODULE_CONTRACT,
  buildExaminationResultsWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';
import {
  useExaminationResultsColumnPreferences,
  useExaminationResultsColumnPreferencesMutation,
} from '@/tenant/features/examinations/hooks/useExaminationsApi';

const STORAGE_SUFFIX = 'results';

export function useExaminationResultsColumnLayout() {
  const { t } = useTranslation();
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useExaminationResultsColumnPreferences();
  const { mutate: saveColumnPrefs } = useExaminationResultsColumnPreferencesMutation();

  const storageModuleId = `${EXAMINATIONS_MODULE_CONTRACT.moduleId}_${STORAGE_SUFFIX}`;

  const tenantRegistry = useMemo(
    () =>
      buildExaminationResultsWorkColumnRegistry({
        rank: t('examinations.columns.results.rank'),
        student: t('examinations.columns.results.student'),
        classRoll: t('examinations.columns.results.classRoll'),
        marks: t('examinations.columns.results.marks'),
        percentage: t('examinations.columns.results.percentage'),
        grade: t('examinations.columns.results.grade'),
        passFail: t('examinations.columns.results.passFail'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: storageModuleId,
    tenantRegistry,
    serverColumnPrefs,
    columnPrefsLoaded,
    saveColumnPrefs,
    translationPrefix: 'examinations.columns',
  });
}
