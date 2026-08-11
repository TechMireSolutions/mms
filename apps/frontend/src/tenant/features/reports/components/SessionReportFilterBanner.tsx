import { useTranslation } from "@/hooks/useTranslation";
import { ActiveFilterBanner } from "@/components/ui/ActiveFilterBanner";

interface SessionReportFilterBannerProps {
  selectedSession: string | null;
  selectedClass: string | null;
  onClearSessionFilter: () => void;
  onClearClassFilter: () => void;
}

export function SessionReportFilterBanner({
  selectedSession,
  selectedClass,
  onClearSessionFilter,
  onClearClassFilter,
}: SessionReportFilterBannerProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!selectedSession && !selectedClass) {
    return null;
  }

  return (
    <ActiveFilterBanner
      chips={[
        ...(selectedSession
          ? [{ key: "session", label: t("sessions.report.sessionFilterLabel"), value: selectedSession }]
          : []),
        ...(selectedClass
          ? [{ key: "class", label: t("sessions.report.classFilterLabel"), value: selectedClass }]
          : []),
      ]}
      actions={[
        ...(selectedSession
          ? [{ key: "session", label: t("sessions.report.clearSessionFilter"), onClick: onClearSessionFilter }]
          : []),
        ...(selectedClass
          ? [{ key: "class", label: t("sessions.report.clearClassFilter"), onClick: onClearClassFilter }]
          : []),
      ]}
    />
  );
}
