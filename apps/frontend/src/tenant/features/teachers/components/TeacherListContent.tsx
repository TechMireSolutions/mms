import React, { useMemo } from "react";
import { School } from "lucide-react";
import { ModuleWorkDirectoryEmpty } from "@/components/ui/ModuleWorkDirectoryEmpty";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { TeacherListCards } from "@/tenant/features/teachers/components/TeacherListCards";
import { TeachersListDesktopTable } from "@/tenant/features/teachers/components/TeachersListDesktopTable";
import { buildTeacherCustomFieldsById } from "@/tenant/features/teachers/components/teacherListVisibleColumns";
import type { TeacherListContentProps } from "@/tenant/features/teachers/components/teacherListContentShared";

export type { TeacherListContentProps } from "@/tenant/features/teachers/components/teacherListContentShared";

type TeacherListContentInput = Omit<TeacherListContentProps, "customFieldsById">;

export function TeacherListContent(props: TeacherListContentInput): React.JSX.Element {
  const { t } = useTranslation();
  const { teachers, showDeleted, viewMode, columnRegistry, hasActiveFilters, onClearFilters, onShowActive, canWrite } = props;
  const customFieldsById = useMemo(
    () => buildTeacherCustomFieldsById(columnRegistry),
    [columnRegistry],
  );
  const contentProps: TeacherListContentProps = { ...props, customFieldsById };

  if (teachers.length === 0) {
    const emptyDescription = hasActiveFilters
      ? t("teachers.tryAdjustingFilters")
      : showDeleted
        ? t("teachers.empty.trashSubtitle")
        : canWrite
          ? t("teachers.clickAddTeacher")
          : t("teachers.emptyDirectoryReadOnly");

    return (
      <ModuleWorkDirectoryEmpty
        icon={School}
        title={
          hasActiveFilters
            ? t("teachers.noTeachersMatchFilters")
            : showDeleted
              ? t("teachers.noDeletedTeachers")
              : t("teachers.empty.title")
        }
        description={emptyDescription}
        hasActiveFilters={hasActiveFilters}
        viewingDeleted={showDeleted}
        onClearFilters={onClearFilters ?? (() => undefined)}
        onShowActive={onShowActive}
        clearFiltersLabel={t("teachers.clearFilters")}
        showActiveLabel={t("teachers.showActive")}
      />
    );
  }

  if (viewMode === "cards") {
    return <TeacherListCards {...contentProps} />;
  }

  return (
    <div className={cn(WORK_SURFACE, "overflow-hidden")}>
      <TeachersListDesktopTable {...contentProps} />
    </div>
  );
}
