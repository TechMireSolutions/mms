import type { ReactNode } from "react";
import { customFieldKeyFromColumnKey, type Teacher, type TeacherCustomField } from "@mms/shared";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { resolveTeacherFieldDisplayText } from "@/tenant/features/faculty/components/facultyFieldDisplay";

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
  if (columnKey === "designation") {
    const value = resolveTeacherFieldDisplayText(teacher, columnKey, {
      t,
      notSpecifiedFallback: false,
    });
    if (value === undefined || value === "") return emptyFallback;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20 truncate max-w-full">
        {value}
      </span>
    );
  }
  if (columnKey === "reportingFacultyId" || columnKey === "reportingFacultyName") {
    const value = teacher.reportingFacultyName || resolveTeacherFieldDisplayText(teacher, columnKey, { t, notSpecifiedFallback: false });
    if (value === undefined || value === "") return emptyFallback;
    return (
      <span className="text-sm font-medium text-foreground truncate block">
        {value}
      </span>
    );
  }
  if (columnKey === "subordinateCount") {
    const count = teacher.subordinateCount ?? 0;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
        {count} {t("faculty.field.subordinates")}
      </span>
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
