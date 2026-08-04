import { GraduationCap } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { ListPagination } from "@/components/ui/ListPagination";
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

  if (props.viewMode === "cards") {
    return <StudentListCards {...props} />;
  }

  if (props.paginatedStudents.length === 0) {
    return (
      <div className={`${WORK_SURFACE} overflow-hidden bg-card/45`}>
        <EmptyState
          icon={GraduationCap}
          title={t("students.list.emptyTitle")}
          description={t("students.list.emptyDesc")}
        />
      </div>
    );
  }

  return (
    <div className={`${WORK_SURFACE} overflow-hidden bg-card/45`}>
      <div className="overflow-x-auto">
        <StudentListDesktopTable {...props} />
      </div>
      {props.students.length > 0 && !props.hasServerPagination ? (
        <ListPagination
          page={props.currentPage}
          total={props.students.length}
          limit={props.pageSize}
          onPageChange={props.onPageChange}
          i18nNamespace="students"
          variant="range"
        />
      ) : null}
    </div>
  );
}
