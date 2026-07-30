import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentListDesktopTable } from "@/tenant/features/students/components/StudentListDesktopTable";
import { StudentListMobileRows } from "@/tenant/features/students/components/StudentListMobileRows";
import type { StudentListTableProps } from "@/tenant/features/students/components/StudentListContentTypes";

interface StudentListTableWithFooterProps extends StudentListTableProps {
  footer?: ReactNode;
}

export function StudentListTable({ footer, ...props }: StudentListTableWithFooterProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-xl overflow-hidden shadow-sm">
      {props.paginatedStudents.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={t("students.list.emptyTitle")}
          description={t("students.list.emptyDesc")}
        />
      ) : (
        <>
          <StudentListMobileRows {...props} />
          <StudentListDesktopTable {...props} />
        </>
      )}
      {footer}
    </div>
  );
}
