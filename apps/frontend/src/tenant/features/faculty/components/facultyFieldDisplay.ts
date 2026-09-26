import {
  customFieldKeyFromColumnKey,
  formatTeacherFieldCellValue,
  type Teacher,
  type TeacherCustomField,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { formatDate } from "@mms/shared";

type LinkedContactName = { name?: string | null } | null | undefined;

/** Display name for Work list/detail — hydrated teacher name, then linked contact, then missing label. */
export function resolveTeacherDisplayName(
  teacher: Pick<Teacher, "name">,
  t: TranslationFunction,
  linkedContact?: LinkedContactName,
): string {
  return teacher.name || linkedContact?.name || t("teachers.contactMissing");
}

/** Per-row identity + selection projection shared by the cards and table Work renderers. */
export function teacherRowIdentity(
  teacher: Teacher,
  selectedIds: string[] | ReadonlySet<string>,
  t: TranslationFunction,
): { teacherIdStr: string; displayName: string; isSelected: boolean } {
  const teacherIdStr = String(teacher.id);
  const isSelected = Array.isArray(selectedIds) ? selectedIds.includes(teacherIdStr) : selectedIds.has(teacherIdStr);
  return {
    teacherIdStr,
    displayName: resolveTeacherDisplayName(teacher, t),
    isSelected,
  };
}

type TeacherCustomFieldDisplay = Pick<TeacherCustomField, "id"> & { type?: string };

/**
 * Format a teacher custom field value for Work table/cards/detail read rows.
 * Returns `undefined` when empty so callers can hide the row or apply notSpecified once.
 */
export function formatTeacherCustomFieldValue(
  teacher: Teacher,
  field: TeacherCustomFieldDisplay,
  t: TranslationFunction,
): string | undefined {
  const fieldValue = (teacher as Record<string, unknown>)[field.id];
  return formatTeacherFieldCellValue(fieldValue, {
    fieldType: field.type,
    booleanLabels: { yes: t("common.yes"), no: t("common.no") },
    arraySeparator: ", ",
  });
}

export function getTeacherCustomFieldValue(
  teacher: Teacher,
  field: TeacherCustomFieldDisplay,
  t: TranslationFunction,
): string {
  return formatTeacherCustomFieldValue(teacher, field, t) ?? t("common.notSpecified");
}

/**
 * Text display value for a Teachers system or custom field key.
 * Returns `undefined` when empty (detail may hide the row; Work falls back to notSpecified).
 * `status` is not formatted here — callers render StatusBadge.
 */
export function resolveTeacherFieldDisplayText(
  teacher: Teacher,
  fieldKey: string,
  options: {
    t: TranslationFunction;
    displayName?: string;
    customFieldLabel?: string;
    customFieldType?: string;
    /** Treat `fieldKey` as a custom data key (bare id or `custom:id`). */
    isCustom?: boolean;
    /** When true, empty values become `common.notSpecified`. */
    notSpecifiedFallback?: boolean;
  },
): string | undefined {
  const {
    t,
    displayName,
    customFieldLabel,
    customFieldType,
    isCustom,
    notSpecifiedFallback,
  } = options;
  const missing = () => (notSpecifiedFallback ? t("common.notSpecified") : undefined);

  if (isCustom || fieldKey.startsWith("custom:")) {
    const fieldId = customFieldKeyFromColumnKey(fieldKey) ?? fieldKey;
    const field = {
      id: fieldId,
      label: customFieldLabel ?? fieldId,
      type: customFieldType,
    };
    return notSpecifiedFallback
      ? getTeacherCustomFieldValue(teacher, field, t)
      : formatTeacherCustomFieldValue(teacher, field, t);
  }

  if (fieldKey === "status") {
    return teacher.status || undefined;
  }
  if (fieldKey === "contactId") {
    return displayName ?? resolveTeacherDisplayName(teacher, t);
  }
  if (fieldKey === "employeeId") {
    return teacher.employeeId || missing();
  }
  if (fieldKey === "specialization") {
    return teacher.specialization || missing();
  }
  if (fieldKey === "qualification") {
    return teacher.qualification || missing();
  }
  if (fieldKey === "joinDate") {
    return teacher.joinDate ? formatDate(teacher.joinDate) : missing();
  }
  if (fieldKey === "department") {
    return teacher.department || missing();
  }
  if (fieldKey === "designation") {
    // Prefer the server-projected current designation name (from assignment join),
    // falling back to the legacy static designation string.
    const dynamic = (teacher as Record<string, unknown>).designationName;
    return (typeof dynamic === 'string' && dynamic) ? dynamic : teacher.designation || missing();
  }
  if (fieldKey === "reportingFacultyId" || fieldKey === "reportingFacultyName") {
    return teacher.reportingFacultyName || missing();
  }
  if (fieldKey === "hierarchyRank") {
    return teacher.hierarchyRank != null ? String(teacher.hierarchyRank) : missing();
  }
  if (fieldKey === "subordinateCount") {
    return teacher.subordinateCount != null ? String(teacher.subordinateCount) : missing();
  }
  if (fieldKey === "notes") {
    return teacher.notes || missing();
  }
  return missing();
}

export const resolveFacultyDisplayName = resolveTeacherDisplayName;
export const facultyRowIdentity = teacherRowIdentity;
export const formatFacultyCustomFieldValue = formatTeacherCustomFieldValue;
export const getFacultyCustomFieldValue = getTeacherCustomFieldValue;
export const resolveFacultyFieldDisplayText = resolveTeacherFieldDisplayText;
