import type { ReactNode } from "react";
import { customFieldKeyFromColumnKey, type Teacher, type TeacherCustomField } from "@mms/shared";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { resolveTeacherFieldDisplayText } from "@/tenant/features/teachers/components/teacherFieldDisplay";

/** Render a Teachers Work column cell (system or custom:`id`). */
export function renderTeacherWorkColumnValue(
  teacher: Teacher,
  columnKey: string,
  options: {
    t: TranslationFunction;
    statusConfig: Record<string, StatusBadgeConfigItem>;
    customFieldsById?: Map<string, TeacherCustomField>;
    statusBadgeSize?: "sm" | "md";
    /** Replacement shown for empty values (Contacts/Students `emptyDash` parity). */
    emptyFallback?: ReactNode;
  },
): ReactNode {
  const { t, statusConfig, customFieldsById, statusBadgeSize, emptyFallback } = options;
  if (columnKey === "status") {
    return (
      <StatusBadge
        status={teacher.status}
        config={statusConfig}
        size={statusBadgeSize}
      />
    );
  }
  const customFieldId = customFieldKeyFromColumnKey(columnKey);
  const customFieldLabel =
    customFieldId !== null ? customFieldsById?.get(customFieldId)?.label : undefined;
  const value = resolveTeacherFieldDisplayText(teacher, columnKey, {
    t,
    customFieldLabel,
    notSpecifiedFallback: false,
  });
  if (value === undefined || value === "") return emptyFallback;
  return value;
}
