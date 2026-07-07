import { useMemo } from 'react';
import {
  ATTENDANCE_MODULE_CONTRACT,
  buildAttendanceWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

export function useAttendanceColumnLayout() {
  const { t } = useTranslation();

  const tenantRegistry = useMemo(
    () =>
      buildAttendanceWorkColumnRegistry({
        date: t('attendance.columns.date'),
        class: t('attendance.columns.class'),
        student: t('attendance.columns.student'),
        status: t('attendance.columns.status'),
        timeIn: t('attendance.columns.timeIn'),
        timeOut: t('attendance.columns.timeOut'),
        notes: t('attendance.columns.notes'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: ATTENDANCE_MODULE_CONTRACT.moduleId,
    tenantRegistry,
    apiPath: ATTENDANCE_MODULE_CONTRACT.restBasePath,
    translationPrefix: 'attendance.columns',
  });
}
