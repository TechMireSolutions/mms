import { useMemo } from 'react';
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

  return useModuleColumnLayout({
    moduleId: TEACHERS_MODULE_MANIFEST.moduleId,
    tenantRegistry,
    apiPath: TEACHERS_MODULE_MANIFEST.restBasePath,
    translationPrefix: 'teachers.columns',
  });
}
