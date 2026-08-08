import type React from "react";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { EnrollmentReports } from "@/tenant/features/enrollments/components/EnrollmentReports";
import { ErrorState } from "@/components/ui/ErrorState";
import { useTranslation } from "@/hooks/useTranslation";
import { useEnrollmentsReportAggregates } from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";
import { EMPTY_ENROLLMENTS_REPORT_AGGREGATES } from "@mms/shared";

export function EnrollmentsReportsTier(): React.JSX.Element {
  const { t } = useTranslation();
  const { data, isError, refetch } = useEnrollmentsReportAggregates();

  if (isError) {
    return (
      <ErrorState
        title={t("enrollments.loadFailed")}
        description={t("enrollments.loadFailedHint")}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <KPISummary category="enrollments" />
      <EnrollmentReports aggregates={data ?? EMPTY_ENROLLMENTS_REPORT_AGGREGATES} />
    </div>
  );
}
