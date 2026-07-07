import { useMemo } from 'react';
import {
  ENROLLMENTS_MODULE_CONTRACT,
  buildEnrollmentWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

export function useEnrollmentColumnLayout() {
  const { t } = useTranslation();

  const tenantRegistry = useMemo(
    () =>
      buildEnrollmentWorkColumnRegistry({
        student: t('enrollments.columns.student'),
        session: t('enrollments.columns.session'),
        class: t('enrollments.columns.class'),
        enrolledDate: t('enrollments.columns.enrolledDate'),
        finalFee: t('enrollments.columns.finalFee'),
        status: t('enrollments.columns.status'),
        payment: t('enrollments.columns.payment'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: ENROLLMENTS_MODULE_CONTRACT.moduleId,
    tenantRegistry,
    apiPath: ENROLLMENTS_MODULE_CONTRACT.restBasePath,
    translationPrefix: 'enrollments.columns',
  });
}
