import { useTranslation } from "@/hooks/useTranslation";
import { toTitleCase } from "@mms/shared";
import { ActiveFilterBanner } from "@/components/ui/ActiveFilterBanner";

interface StudentReportFilterBannerProps {
  hasBaseStatusFilter: boolean;
  reportStatusFilter: string | null;
  studentFilter: string;
  onClearStatusFilter: () => void;
}

export function StudentReportFilterBanner({
  hasBaseStatusFilter,
  reportStatusFilter,
  studentFilter,
  onClearStatusFilter,
}: StudentReportFilterBannerProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!reportStatusFilter && !hasBaseStatusFilter && !studentFilter) {
    return null;
  }

  return (
    <ActiveFilterBanner
      label={t("students.report.filterLabel")}
      chips={[
        ...(reportStatusFilter ? [{ key: "status", value: toTitleCase(reportStatusFilter) }] : []),
        ...(studentFilter ? [{ key: "student", value: `"${studentFilter}"` }] : []),
      ]}
      actions={
        reportStatusFilter
          ? [{ key: "status", label: t("students.report.clearFilter"), onClick: onClearStatusFilter }]
          : []
      }
    />
  );
}
