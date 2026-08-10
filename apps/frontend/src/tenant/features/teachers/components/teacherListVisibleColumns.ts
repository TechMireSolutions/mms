import {
  customFieldKeyFromColumnKey,
  getVisibleWorkColumns,
  TEACHER_CARD_FACE_COLUMN_IDS,
  TEACHER_SORT_FIELD_SET,
  type ModuleColumnRegistryEntry,
  type TeacherCustomField,
  type TeacherSortField,
} from "@mms/shared";

/** Visible Work columns in registry order (checkbox / actions stay outside). */
export function getTeacherVisibleWorkColumns(
  columnRegistry: ModuleColumnRegistryEntry[],
  isColumnVisible: (key: string) => boolean,
  options?: { excludeFace?: boolean },
): ModuleColumnRegistryEntry[] {
  return getVisibleWorkColumns(columnRegistry, isColumnVisible, {
    excludeFace: options?.excludeFace ? TEACHER_CARD_FACE_COLUMN_IDS : undefined,
  });
}

/** Map a Work column key to the Teachers list SQL sort allowlist. */
export function toTeacherListSortField(columnKey: string): TeacherSortField | null {
  if (TEACHER_SORT_FIELD_SET.has(columnKey)) {
    return columnKey as TeacherSortField;
  }
  return null;
}

/** Build custom-field id → label map from Work column registry `custom:*` keys. */
export function buildTeacherCustomFieldsById(
  columnRegistry: ModuleColumnRegistryEntry[],
): Map<string, TeacherCustomField> {
  const map = new Map<string, TeacherCustomField>();
  for (const col of columnRegistry) {
    const fieldId = customFieldKeyFromColumnKey(col.key);
    if (fieldId === null) continue;
    map.set(fieldId, { id: fieldId, label: col.label });
  }
  return map;
}

/** Responsive breakpoint utility for a Work column (shared by head + cell). */
function teacherWorkColumnBreakpointClass(columnKey: string): string {
  if (columnKey === "specialization") return "hidden sm:table-cell";
  if (columnKey === "qualification" || columnKey === "joinDate") {
    return "hidden md:table-cell";
  }
  if (customFieldKeyFromColumnKey(columnKey) !== null) {
    return "hidden lg:table-cell";
  }
  return "";
}

/** Responsive table-cell visibility classes for Work columns. */
export function teacherWorkColumnCellClass(columnKey: string): string {
  const breakpoint = teacherWorkColumnBreakpointClass(columnKey);
  return ["px-4 py-3 text-muted-foreground", breakpoint].filter(Boolean).join(" ");
}

export function teacherWorkColumnHeadClass(columnKey: string): string {
  const breakpoint = teacherWorkColumnBreakpointClass(columnKey);
  return ["px-4 py-3 text-start", breakpoint].filter(Boolean).join(" ");
}
