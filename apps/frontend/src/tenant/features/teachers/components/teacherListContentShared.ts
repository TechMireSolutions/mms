import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import type { ModuleColumnRegistryEntry, Teacher, TeacherCustomField } from "@mms/shared";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { TeacherSortField } from "@/tenant/features/teachers/components/TeacherListTypes";

export interface TeacherListContentProps {
  viewMode: WorkDirectoryViewMode;
  teachers: Teacher[];
  selectedIds: string[];
  allSelected: boolean;
  someSelected: boolean;
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  /** Active filter state for the directory empty state (Contacts/Students parity). */
  hasActiveFilters: boolean;
  /** Clear-filter CTA shown when filters are active and the directory is empty. */
  onClearFilters?: () => void;
  /** "Show active" CTA shown when viewing the trash and the directory is empty. */
  onShowActive?: () => void;
  /** Column visibility gate — prefer over parallel show* booleans. */
  isColumnVisible: (key: string) => boolean;
  /** Live Work column layout (tenant registry + user overlay). */
  columnRegistry: ModuleColumnRegistryEntry[];
  /** Custom column id → label map (lifted once for table + cards). */
  customFieldsById: Map<string, TeacherCustomField>;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  sortField: TeacherSortField;
  sortDir: "asc" | "desc";
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onSort: (field: TeacherSortField) => void;
  onSelectAll: () => void;
  onSelectOne: (id: string) => void;
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onRequestDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
}
