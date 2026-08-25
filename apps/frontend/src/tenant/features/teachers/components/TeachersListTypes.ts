import type {
  Teacher,
  TeacherSortField,
  ModuleColumnRegistryEntry,
} from '@mms/shared';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';

export type { TeacherSortField };

/** Single delete confirm target (page-owned — name for the named confirm copy). */
export interface TeacherDeleteTarget {
  id: string;
  name?: string;
}

export interface TeacherListProps {
  teachers: Teacher[];
  viewMode: WorkDirectoryViewMode;
  /** Active filter state for the directory empty state (Contacts/Students parity). */
  hasActiveFilters?: boolean;
  /** Clear-filter CTA shown when filters are active and the directory is empty. */
  onClearFilters?: () => void;
  /** "Show active" CTA shown when viewing the trash and the directory is empty. */
  onShowActive?: () => void;
  showDeleted?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  selectedIds: string[];
  onSelectOne: (id: string) => void;
  onSelectAll: (pageIds: string[]) => void;
  isColumnVisible?: (key: string) => boolean;
  columnRegistry?: ModuleColumnRegistryEntry[];
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  sortField?: TeacherSortField;
  sortDir?: 'asc' | 'desc';
  onSortChange: (field: TeacherSortField, dir: 'asc' | 'desc') => void;
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  /** Opens the page-owned single-delete confirm (page hoists confirm state). */
  onDeleteTargetChange: (target: TeacherDeleteTarget) => void;
  onRestore?: (id: string) => void | Promise<void>;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
}
