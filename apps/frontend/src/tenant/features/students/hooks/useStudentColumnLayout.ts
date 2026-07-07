import { useMemo } from 'react';
import {
  STUDENTS_MODULE_CONTRACT,
  buildStudentWorkColumnRegistry,
  type StudentsSettings,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

export function useStudentColumnLayout(settings: StudentsSettings) {
  const { t } = useTranslation();

  const tenantRegistry = useMemo(
    () =>
      buildStudentWorkColumnRegistry(settings, {
        name: t('students.columns.name'),
        dob: t('students.columns.dob'),
        parents: t('students.columns.parents'),
        sessions: t('students.columns.sessions'),
        status: t('students.columns.status'),
      }),
    [settings, t],
  );

  return useModuleColumnLayout({
    moduleId: STUDENTS_MODULE_CONTRACT.moduleId,
    tenantRegistry,
    apiPath: STUDENTS_MODULE_CONTRACT.restBasePath,
    translationPrefix: 'students.columns',
  });
}
