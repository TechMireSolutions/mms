import type React from "react";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { EnrollmentReports } from "@/tenant/features/enrollments/components/EnrollmentReports";
import type { Enrollment } from "@/lib/data/enrollmentData";

interface EnrollmentsReportsTierProps {
  enrollments: Enrollment[];
}

export function EnrollmentsReportsTier({
  enrollments,
}: EnrollmentsReportsTierProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <KPISummary category="enrollments" />
      <EnrollmentReports enrollments={enrollments} />
    </div>
  );
}
