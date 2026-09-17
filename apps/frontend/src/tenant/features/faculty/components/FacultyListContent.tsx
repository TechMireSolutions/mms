import React from "react";
import { School } from "lucide-react";
import { ModuleWorkDirectoryEmpty } from "@/components/ui/ModuleWorkDirectoryEmpty";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { TeachersListCards } from "@/tenant/features/faculty/components/FacultyListCards";
import { TeachersListDesktopTable } from "@/tenant/features/faculty/components/FacultyListDesktopTable";
import { buildTeacherCustomFieldsById } from "@/tenant/features/faculty/components/facultyListVisibleColumns";
import type { FacultyListContentProps } from "@/tenant/features/faculty/components/facultyListContentShared";

export type { FacultyListContentProps, TeacherListContentProps } from "@/tenant/features/faculty/components/facultyListContentShared";

export type FacultyListContentInput = Omit<FacultyListContentProps, "customFieldsById">;
export type TeacherListContentInput = FacultyListContentInput;

export function FacultyListContent(props: FacultyListContentInput): React.JSX.Element {
  const { t } = useTranslation();
  const { teachers, showDeleted, viewMode, columnRegistry, hasActiveFilters, onClearFilters, onShowActive, canWrite } = props;
  const customFieldsById = (() => buildTeacherCustomFieldsById(columnRegistry))();
  const contentProps: FacultyListContentProps = { ...props, customFieldsById };


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
    return <TeachersListCards {...contentProps} />;
  }

  return (
    <div className={cn(WORK_SURFACE, "overflow-hidden")}>
      <TeachersListDesktopTable {...contentProps} />
    </div>
  );
}

export const TeachersListContent = FacultyListContent;
