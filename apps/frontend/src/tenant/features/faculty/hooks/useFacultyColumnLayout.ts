import {
  FACULTY_MODULE_MANIFEST,
  buildTeacherWorkColumnRegistry,
  teacherColumnLabelKey,
  teacherWorkColumnLabelsFrom,
  type FacultySettings,
  type TeachersSettings,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

export function useFacultyColumnLayout(settings: FacultySettings | TeachersSettings) {
  const { t } = useTranslation();

  const tenantRegistry = (() =>
      buildTeacherWorkColumnRegistry(
        settings,
        teacherWorkColumnLabelsFrom((key) => t(teacherColumnLabelKey(key))),
      ))();

  const { customizerLabels: baseLabels, updateUserColumnLayout, ...base } = useModuleColumnLayout({
    moduleId: FACULTY_MODULE_MANIFEST.moduleId,
    tenantRegistry,
    apiPath: FACULTY_MODULE_MANIFEST.restBasePath,
    translationPrefix: 'faculty.columns',
  });

  const customizerLabels = (() => ({
      ...baseLabels,
      reset: t('faculty.resetLayout'),
      searchPlaceholder: t('faculty.searchColumnsPlaceholder'),
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

export const useTeacherColumnLayout = useFacultyColumnLayout;


