import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import type { TeacherCustomField } from "@mms/shared";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { Teacher } from "@/lib/data/teachersData";
import type { TeacherSortField } from "@/tenant/features/teachers/components/TeacherListTypes";

export interface TeacherListContentProps {
  viewMode: WorkDirectoryViewMode;
  teachers: Teacher[];
  selectedIds: string[];
  allSelected: boolean;
  someSelected: boolean;
  showSelectColumn: boolean;
  showActionsColumn: boolean;
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  /** Column visibility gate — prefer over parallel show* booleans. */
  isColumnVisible: (key: string) => boolean;
  visibleCustomFields: TeacherCustomField[];
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

export function getTeacherCustomFieldValue(
  teacher: Teacher,
  field: TeacherCustomField,
  t: TranslationFunction,
): string {
  const fieldValue = (teacher as unknown as Record<string, unknown>)[field.id];
  if (fieldValue === undefined || fieldValue === null || fieldValue === "") {
    return t("common.notSpecified");
  }
  if (typeof fieldValue === "boolean") {
    return fieldValue ? t("common.yes") : t("common.no");
  }
  return String(fieldValue);
}
