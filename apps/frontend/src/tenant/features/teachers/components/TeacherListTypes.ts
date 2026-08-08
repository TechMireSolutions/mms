import type {
  Teacher,
  TeacherSortField,
  ModuleColumnRegistryEntry,
} from '@mms/shared';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';

export type { TeacherSortField };

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
  selectedIds: string[];
  onSelectOne: (id: string) => void;
  onSelectAll: (pageIds: string[]) => void;
  onClearSelection: () => void;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  sortField?: TeacherSortField;
  sortDir?: 'asc' | 'desc';
  onSortChange: (field: TeacherSortField, dir: 'asc' | 'desc') => void;
  viewMode: WorkDirectoryViewMode;
  columnRegistry?: ModuleColumnRegistryEntry[];
  onBulkExport?: () => void | Promise<void>;
}
