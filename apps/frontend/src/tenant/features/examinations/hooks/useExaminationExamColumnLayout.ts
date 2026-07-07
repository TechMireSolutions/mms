import { useMemo } from 'react';
import {
  EXAMINATIONS_MODULE_CONTRACT,
  buildExaminationExamWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';
import {
  useExaminationExamColumnPreferences,
  useExaminationExamColumnPreferencesMutation,
} from '@/tenant/features/examinations/hooks/useExaminationsApi';

const STORAGE_SUFFIX = 'exams';

export function useExaminationExamColumnLayout() {
  const { t } = useTranslation();
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useExaminationExamColumnPreferences();
  const { mutate: saveColumnPrefs } = useExaminationExamColumnPreferencesMutation();

  const storageModuleId = `${EXAMINATIONS_MODULE_CONTRACT.moduleId}_${STORAGE_SUFFIX}`;

  const tenantRegistry = useMemo(
    () =>
      buildExaminationExamWorkColumnRegistry({
        name: t('examinations.columns.exam.name'),
        subject: t('examinations.columns.exam.subject'),
        date: t('examinations.columns.exam.date'),
        duration: t('examinations.columns.exam.duration'),
        status: t('examinations.columns.exam.status'),
        totalMarks: t('examinations.columns.exam.totalMarks'),
        passingMarks: t('examinations.columns.exam.passingMarks'),
        classes: t('examinations.columns.exam.classes'),
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
