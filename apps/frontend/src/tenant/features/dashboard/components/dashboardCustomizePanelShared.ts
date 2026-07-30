import {
  type Permission,
  STUDENTS_MODULE_MANIFEST,
  USERS_MODULE_MANIFEST,
  ATTENDANCE_MODULE_MANIFEST,
} from '@mms/shared';
import type { ReportCollection } from '@/lib/reports/reportMetadata';

export function defaultWidgetScope(can: (permission: Permission) => boolean): {
  collection: ReportCollection;
  category: string;
} {
  if (can(STUDENTS_MODULE_MANIFEST.permissions.write) || can(USERS_MODULE_MANIFEST.permissions.write)) {
    return { collection: 'students', category: 'students' };
  }
  if (can(ATTENDANCE_MODULE_MANIFEST.permissions.write)) {
    return { collection: 'sessions', category: 'sessions' };
  }
  return { collection: 'finance_invoices', category: 'financial' };
}
