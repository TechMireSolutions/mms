import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { teacherStatusLabel } from "@/lib/teachers/teacherStatusUi";
import { ActiveFilterBanner } from "@/components/ui/ActiveFilterBanner";

interface FacultyReportFilterBannerProps {
  hasBaseStatusFilter: boolean;
  reportStatusFilter: string | null;
  studentFilter: string;
  onClearStatusFilter: () => void;
}

export const FacultyReportFilterBanner = React.memo(function FacultyReportFilterBanner({
  hasBaseStatusFilter,
  reportStatusFilter,
  studentFilter,
  onClearStatusFilter,
}: FacultyReportFilterBannerProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!reportStatusFilter && !hasBaseStatusFilter && !studentFilter) {
    return null;
  }

  return (
    <ActiveFilterBanner
      label={t("teachers.report.filterLabel")}
      chips={[
        ...(reportStatusFilter ? [{ key: "status", value: teacherStatusLabel(t, reportStatusFilter) }] : []),
        ...(studentFilter ? [{ key: "student", value: `"${studentFilter}"` }] : []),
      ]}
      actions={
        reportStatusFilter
          ? [{ key: "status", label: t("teachers.report.clearFilter"), onClick: onClearStatusFilter }]
          : []
      }
    />
  );
});
