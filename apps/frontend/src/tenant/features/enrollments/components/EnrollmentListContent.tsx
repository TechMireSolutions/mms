import React from "react";
import { Card } from "@/components/ui/card";
import { ListPagination } from "@/components/ui/ListPagination";
import { useTranslation } from "@/hooks/useTranslation";
import { EnrollmentListCards } from "@/tenant/features/enrollments/components/EnrollmentListCards";
import { EnrollmentListTable } from "@/tenant/features/enrollments/components/EnrollmentListTable";
import type { EnrollmentListContentProps } from "@/tenant/features/enrollments/components/enrollmentListContentShared";
import { Search } from "lucide-react";

export type { EnrollmentListVisibleColumns } from "@/tenant/features/enrollments/components/enrollmentListContentShared";

export function EnrollmentListContent(props: EnrollmentListContentProps): React.JSX.Element {
  const { t } = useTranslation();
  const { enrollments, filteredCount, page, pageSize, showDeleted, onPageChange } = props;

  return (
    <>
      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-card" role="status">
          <Search className="w-10 h-10 text-muted-foreground/30 mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">
            {showDeleted ? t("enrollments.empty.trashTitle") : t("enrollments.empty.title")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {showDeleted ? t("enrollments.empty.trashSubtitle") : t("enrollments.empty.description")}
          </p>
        </div>
      ) : (
        <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm border-border/80 shadow-sm">
          <EnrollmentListCards {...props} />
          <EnrollmentListTable {...props} />
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
