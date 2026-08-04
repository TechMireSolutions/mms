import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { School } from "lucide-react";
import { TeacherListCards } from "@/tenant/features/teachers/components/TeacherListCards";
import { TeacherListTable } from "@/tenant/features/teachers/components/TeacherListTable";
import type { TeacherListContentProps } from "@/tenant/features/teachers/components/teacherListContentShared";

export type { TeacherListContentProps } from "@/tenant/features/teachers/components/teacherListContentShared";

export function TeacherListContent(props: TeacherListContentProps): React.JSX.Element {
  const { t } = useTranslation();
  const { teachers, showDeleted, viewMode } = props;

  if (teachers.length === 0) {
    return (
      <EmptyState
        icon={School}
        title={showDeleted ? t("teachers.empty.trashTitle") : t("teachers.empty.title")}
        description={showDeleted ? t("teachers.empty.trashSubtitle") : t("teachers.empty.subtitle")}
      />
    );
  }

  return (
    <div className={cn(WORK_SURFACE, "overflow-hidden")}>
      {viewMode === "cards" ? <TeacherListCards {...props} /> : <TeacherListTable {...props} />}
    </div>
  );
}
