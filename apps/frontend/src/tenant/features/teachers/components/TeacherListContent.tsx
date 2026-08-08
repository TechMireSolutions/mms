import React, { useMemo } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { School } from "lucide-react";
import { TeacherListCards } from "@/tenant/features/teachers/components/TeacherListCards";
import { TeacherListTable } from "@/tenant/features/teachers/components/TeacherListTable";
import { buildTeacherCustomFieldsById } from "@/tenant/features/teachers/components/teacherListVisibleColumns";
import type { TeacherListContentProps } from "@/tenant/features/teachers/components/teacherListContentShared";

export type { TeacherListContentProps } from "@/tenant/features/teachers/components/teacherListContentShared";

type TeacherListContentInput = Omit<TeacherListContentProps, "customFieldsById">;

export function TeacherListContent(props: TeacherListContentInput): React.JSX.Element {
  const { t } = useTranslation();
  const { teachers, showDeleted, viewMode, columnRegistry } = props;
  const customFieldsById = useMemo(
    () => buildTeacherCustomFieldsById(columnRegistry),
    [columnRegistry],
  );
  const contentProps: TeacherListContentProps = { ...props, customFieldsById };

  if (teachers.length === 0) {
    return (
      <EmptyState
        icon={School}
        title={showDeleted ? t("teachers.empty.trashTitle") : t("teachers.empty.title")}
        description={showDeleted ? t("teachers.empty.trashSubtitle") : t("teachers.empty.subtitle")}
      />
    );
  }

  if (viewMode === "cards") {
    return <TeacherListCards {...contentProps} />;
  }

  return (
    <div className={cn(WORK_SURFACE, "overflow-hidden")}>
      <TeacherListTable {...contentProps} />
    </div>
  );
}
