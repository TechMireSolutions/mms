import React from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListPagination } from "@/components/ui/ListPagination";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { EnrollmentListCards } from "@/tenant/features/enrollments/components/EnrollmentListCards";
import { EnrollmentsListDesktopTable } from "@/tenant/features/enrollments/components/EnrollmentsListDesktopTable";
import type { EnrollmentListContentProps } from "@/tenant/features/enrollments/components/enrollmentListContentShared";
import { Search } from "lucide-react";

export function EnrollmentListContent(props: EnrollmentListContentProps): React.JSX.Element {
  const { t } = useTranslation();
  const { enrollments, filteredCount, page, pageSize, showDeleted, onPageChange } = props;

  return (
    <>
      {enrollments.length === 0 ? (
        <EmptyState
          variant="dashed"
          icon={Search}
          title={showDeleted ? t("enrollments.empty.trashTitle") : t("enrollments.empty.title")}
          description={showDeleted ? t("enrollments.empty.trashSubtitle") : t("enrollments.empty.description")}
          compact
        />
      ) : (
        <Card accentColor="primary" className="p-0 overflow-hidden">
          {props.viewMode === "cards" ? (
            <EnrollmentListCards {...props} />
          ) : (
            <div className={cn(WORK_SURFACE, "overflow-hidden")}>
              <EnrollmentsListDesktopTable {...props} />
            </div>
          )}
        </Card>
      )}

      <ListPagination
        page={page}
        total={filteredCount}
        limit={pageSize}
        onPageChange={onPageChange}
        i18nNamespace="enrollments"
        variant="summary"
      />
    </>
  );
}
