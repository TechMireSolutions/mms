import type { LucideIcon } from 'lucide-react';
import type { Teacher } from '@mms/shared';

export type ClassDetailTabId = 'general' | 'fees' | 'schedule' | 'budget' | 'scholarship';

export interface ClassDetailTabItem {
  id: ClassDetailTabId;
  label: string;
  icon: LucideIcon;
}

export function formatTeacherDisplayName(teacher?: Partial<Teacher> | null): string {
  if (!teacher) return '';
  const name = (teacher.name || [teacher.firstName, teacher.lastName].filter(Boolean).join(' ')).trim();
  if (name) {
    return teacher.employeeId ? `${name} (${teacher.employeeId})` : name;
  }
  if (teacher.employeeId) {
    return `Teacher (${teacher.employeeId})`;
  }
  return teacher.id ? `Teacher #${String(teacher.id).slice(0, 8)}` : '';
}
