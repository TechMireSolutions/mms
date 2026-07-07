import { useMemo } from 'react';
import {
  TEACHERS_MODULE_CONTRACT,
  buildTeacherWorkColumnRegistry,
  type TeachersSettings,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';
import {
  useTeacherColumnPrefs,
  useTeacherColumnPrefsMutation,
} from '@/tenant/features/teachers/hooks/useTeachers';

export function useTeacherColumnLayout(settings: TeachersSettings) {
  const { t } = useTranslation();
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useTeacherColumnPrefs();
  const { mutate: saveColumnPrefs } = useTeacherColumnPrefsMutation();

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
    serverColumnPrefs,
    columnPrefsLoaded,
    saveColumnPrefs,
    translationPrefix: 'teachers.columns',
  });
}
