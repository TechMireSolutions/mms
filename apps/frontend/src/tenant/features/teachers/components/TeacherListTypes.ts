import type { Teacher } from '@/lib/data/teachersData';

export type TeacherSortField = 'name' | 'specialization' | 'qualification' | 'status' | 'joinDate';

export interface TeacherListProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
  onBulkStatusChange?: (ids: string[], status: string) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  selectionResetKey?: string | number;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  sortField?: TeacherSortField;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (field: TeacherSortField, dir: 'asc' | 'desc') => void;
}
