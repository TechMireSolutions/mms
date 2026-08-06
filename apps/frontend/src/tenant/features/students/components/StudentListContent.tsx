import { GraduationCap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentListCards } from "@/tenant/features/students/components/StudentListCards";
import { StudentListDesktopTable } from "@/tenant/features/students/components/StudentListDesktopTable";
import type { StudentListContentProps } from "@/tenant/features/students/components/StudentListContentTypes";

export type {
  StudentListContentProps,
  StudentListMessagingRecipient,
  StudentListSession,
  StudentListSortField,
} from "@/tenant/features/students/components/StudentListContentTypes";

export function StudentListContent(props: StudentListContentProps) {
  const { t } = useTranslation();
  const {
    hasActiveFilters = false,
    showDeleted,
    canWrite,
    onClearFilters,
    onShowActive,
  } = props;

  if (props.paginatedStudents.length === 0) {
    const emptyDescription = hasActiveFilters
      ? t("students.tryAdjustingFilters")
      : showDeleted
        ? t("students.emptyTrashHint")
        : canWrite
          ? t("students.clickAddStudent")
          : t("students.emptyDirectoryReadOnly");

    const emptyAction = hasActiveFilters && onClearFilters ? (
      <Button type="button" variant="outline" size="sm" onClick={onClearFilters} className="gap-1.5">
        <RefreshCw className="w-3 h-3" /> {t("students.clearFilters")}
      </Button>
    ) : showDeleted && onShowActive ? (
      <Button type="button" variant="outline" size="sm" onClick={onShowActive} className="gap-1.5">
        <RefreshCw className="w-3 h-3" /> {t("students.showActive")}
      </Button>
    ) : null;

    return (
      <div className={`${WORK_SURFACE} border-border/40 p-6`}>
        <EmptyState
          variant="dashed"
          icon={GraduationCap}
          title={
            hasActiveFilters
              ? t("students.noStudentsMatchFilters")
              : showDeleted
                ? t("students.noDeletedStudents")
                : t("students.noStudentsYet")
          }
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  if (props.viewMode === "cards") {
    return <StudentListCards {...props} />;
  }

  return (
    <div className={`${WORK_SURFACE} overflow-hidden`}>
      <StudentListDesktopTable {...props} />
    </div>
  );
}
