import { useMemo } from 'react';
import {
  ENROLLMENTS_MODULE_CONTRACT,
  buildEnrollmentWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';
import {
  useEnrollmentColumnPreferences,
  useEnrollmentColumnPreferencesMutation,
} from '@/tenant/features/enrollments/hooks/useEnrollmentsApi';

export function useEnrollmentColumnLayout() {
  const { t } = useTranslation();
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useEnrollmentColumnPreferences();
  const { mutate: saveColumnPrefs } = useEnrollmentColumnPreferencesMutation();

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
    serverColumnPrefs,
    columnPrefsLoaded,
    saveColumnPrefs,
    translationPrefix: 'enrollments.columns',
  });
}
