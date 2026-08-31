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

  const tenantRegistry = (() =>
      buildTeacherWorkColumnRegistry(
        settings,
        teacherWorkColumnLabelsFrom((key) => t(teacherColumnLabelKey(key))),
      ))();

  const { customizerLabels: baseLabels, updateUserColumnLayout, ...base } = useModuleColumnLayout({
    moduleId: TEACHERS_MODULE_MANIFEST.moduleId,
    tenantRegistry,
    apiPath: TEACHERS_MODULE_MANIFEST.restBasePath,
    translationPrefix: 'teachers.columns',
  });

  const customizerLabels = (() => ({
      ...baseLabels,
      reset: t('teachers.resetLayout'),
      searchPlaceholder: t('teachers.searchColumnsPlaceholder'),
    }))();

  const resetColumnLayout = (() => {
    updateUserColumnLayout(tenantRegistry);
  });

  return {
    ...base,
    updateUserColumnLayout,
    customizerLabels,
    resetColumnLayout,
  };
}
