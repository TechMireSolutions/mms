import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

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
    <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-primary" />
        <span className="font-medium text-foreground">{t("attendance.report.classFilterLabel")}</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
          {selectedClass}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClearClassFilter}
        className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <X className="w-3 h-3 me-1" />
        {t("attendance.report.clearClassFilter")}
      </Button>
    </div>
  );
}
