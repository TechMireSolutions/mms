import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

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
    <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-primary" />
        {selectedSession && (
          <>
            <span className="font-medium text-foreground">{t("sessions.report.sessionFilterLabel")}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
              {selectedSession}
            </span>
          </>
        )}
        {selectedClass && (
          <>
            <span className="font-medium text-foreground">{t("sessions.report.classFilterLabel")}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
              {selectedClass}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        {selectedSession && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearSessionFilter}
            className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 me-1" />
            {t("sessions.report.clearSessionFilter")}
          </Button>
        )}
        {selectedClass && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearClassFilter}
            className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 me-1" />
            {t("sessions.report.clearClassFilter")}
          </Button>
        )}
      </div>
    </div>
  );
}
