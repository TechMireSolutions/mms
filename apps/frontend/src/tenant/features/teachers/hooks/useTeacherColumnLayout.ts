import { useCallback, useMemo } from 'react';
import {
  TEACHERS_MODULE_MANIFEST,
  buildTeacherWorkColumnRegistry,
  teacherColumnLabelKey,
  teacherWorkColumnLabelsFrom,
  type TeachersSettings,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

export function useTeacherColumnLayout(settings: TeachersSettings) {
  const { t } = useTranslation();

  const tenantRegistry = useMemo(
    () =>
      buildTeacherWorkColumnRegistry(
        settings,
        teacherWorkColumnLabelsFrom((key) => t(teacherColumnLabelKey(key))),
      ),
    [settings, t],
  );

  const { customizerLabels: baseLabels, updateUserColumnLayout, ...base } = useModuleColumnLayout({
    moduleId: TEACHERS_MODULE_MANIFEST.moduleId,
    tenantRegistry,
    apiPath: TEACHERS_MODULE_MANIFEST.restBasePath,
    translationPrefix: 'teachers.columns',
  });

  const customizerLabels = useMemo(
    () => ({
      ...baseLabels,
      reset: t('teachers.resetLayout'),
      searchPlaceholder: t('teachers.searchColumnsPlaceholder'),
    }),
    [baseLabels, t],
  );

  const resetColumnLayout = useCallback(() => {
    updateUserColumnLayout(tenantRegistry);
  }, [updateUserColumnLayout, tenantRegistry]);

  return {
    ...base,
    updateUserColumnLayout,
    customizerLabels,
    resetColumnLayout,
  };
}
