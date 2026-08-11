import {
  getVisibleWorkColumns,
  STUDENT_CARD_FACE_COLUMN_IDS,
  type ModuleColumnRegistryEntry,
} from "@mms/shared";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";

/** Sortable Work columns that map to the Students list API allowlist. */
const STUDENT_LIST_SORTABLE_FIELDS = new Set<StudentListSortField>([
  "name",
  "grNumber",
  "status",
  "gender",
  "registeredDate",
  "dob",
]);

/** Visible Work columns in registry order (checkbox / actions stay outside). */
export function getStudentVisibleWorkColumns(
  columnRegistry: ModuleColumnRegistryEntry[],
  isColumnVisible: (key: string) => boolean,
  options?: { excludeFace?: boolean },
): ModuleColumnRegistryEntry[] {
  return getVisibleWorkColumns(columnRegistry, isColumnVisible, {
    excludeFace: options?.excludeFace ? STUDENT_CARD_FACE_COLUMN_IDS : undefined,
  });
}

export function toStudentListSortField(columnKey: string): StudentListSortField | null {
  if (STUDENT_LIST_SORTABLE_FIELDS.has(columnKey as StudentListSortField)) {
    return columnKey as StudentListSortField;
  }
  return null;
}
