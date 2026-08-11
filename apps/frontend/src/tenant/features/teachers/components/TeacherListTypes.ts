import type {
  Teacher,
  TeacherSortField,
  ModuleColumnRegistryEntry,
} from '@mms/shared';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import type { useMessageComposerState } from '@/hooks/useMessageComposerState';

export type { TeacherSortField };

export interface TeacherListProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDelete: (id: string, deletionReason?: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[], deletionReason?: string) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
  onBulkStatusChange?: (ids: string[], status: string) => void | Promise<void>;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  /** Active filter state for the directory empty state (Contacts/Students parity). */
  hasActiveFilters?: boolean;
  /** Clear-filter CTA shown when filters are active and the directory is empty. */
  onClearFilters?: () => void;
  /** "Show active" CTA shown when viewing the trash and the directory is empty. */
  onShowActive?: () => void;
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
  /** Page-owned bulk confirm dialog state (bulk bar lives in the Work tier). */
  confirmBulkDeleteOpen: boolean;
  confirmBulkRestoreOpen: boolean;
  onBulkDeleteOpenChange: (open: boolean) => void;
  onBulkRestoreOpenChange: (open: boolean) => void;
  /** Page-owned composer passed through to the detail drawer (Students parity). */
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  canWriteMessaging: boolean;
}
