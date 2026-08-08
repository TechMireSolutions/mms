import type { Teacher } from '@/lib/data/teachersData';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import type { TeacherExportColumn } from '@mms/shared';

export type TeacherSortField = 'name' | 'specialization' | 'qualification' | 'status' | 'joinDate';

export interface TeacherListProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDelete: (id: string, deletionReason?: string) => void;
  onRestore?: (id: string) => void;
  onBulkDelete?: (ids: string[], deletionReason?: string) => void;
  onBulkRestore?: (ids: string[]) => void;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
  onBulkStatusChange?: (ids: string[], status: string) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  showDeleted?: boolean;
  selectionResetKey?: string | number;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  sortField?: TeacherSortField;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (field: TeacherSortField, dir: 'asc' | 'desc') => void;
  viewMode: WorkDirectoryViewMode;
  exportColumns?: TeacherExportColumn[];
  exportSearch?: string;
  exportFilterStatus?: string[];
  exportFilterSpecialization?: string;
  exportSortField?: TeacherSortField | null;
  exportSortDir?: 'asc' | 'desc';
  logExportAudit?: {
    mutateAsync: (payload: {
      count: number;
      scope: 'all' | 'filtered' | 'selection';
    }) => Promise<unknown>;
  };
  onSelectedCountChange?: (count: number) => void;
}
