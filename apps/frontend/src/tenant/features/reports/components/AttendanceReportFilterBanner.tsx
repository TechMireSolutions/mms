import { useTranslation } from "@/hooks/useTranslation";
import { ActiveFilterBanner } from "@/components/ui/ActiveFilterBanner";

interface AttendanceReportFilterBannerProps {
  selectedClass: string | null;
  onClearClassFilter: () => void;
}

export function AttendanceReportFilterBanner({
  selectedClass,
  onClearClassFilter,
}: AttendanceReportFilterBannerProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!selectedClass) {
    return null;
  }

  return (
    <ActiveFilterBanner
      chips={[{ key: "class", label: t("attendance.report.classFilterLabel"), value: selectedClass }]}
      actions={[{ key: "class", label: t("attendance.report.clearClassFilter"), onClick: onClearClassFilter }]}
    />
  );
}
