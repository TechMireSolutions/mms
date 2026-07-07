import { useMemo } from 'react';
import {
  TEACHERS_MODULE_CONTRACT,
  buildTeacherWorkColumnRegistry,
  type TeachersSettings,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

export function useTeacherColumnLayout(settings: TeachersSettings) {
  const { t } = useTranslation();

  const tenantRegistry = useMemo(
    () =>
      buildTeacherWorkColumnRegistry(settings, {
        name: t('teachers.field.name'),
        specialization: t('teachers.field.specialization'),
        qualification: t('teachers.field.qualification'),
        joinDate: t('teachers.field.joinDate'),
        status: t('teachers.field.status'),
      }),
    [settings, t],
  );

  return useModuleColumnLayout({
    moduleId: TEACHERS_MODULE_CONTRACT.moduleId,
    tenantRegistry,
    apiPath: TEACHERS_MODULE_CONTRACT.restBasePath,
    translationPrefix: 'teachers.columns',
  });
}
