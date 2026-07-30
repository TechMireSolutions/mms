import React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface HasanatFacultyFilterBannerProps {
  selectedFaculty: string | null;
  onClear: () => void;
}

export function HasanatFacultyFilterBanner({
  selectedFaculty,
  onClear,
}: HasanatFacultyFilterBannerProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!selectedFaculty) return null;

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium text-foreground">{t("hasanat.report.facultyFilterLabel")}</span>
        <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {selectedFaculty}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <X className="me-1 h-3 w-3" />
        {t("hasanat.report.clearFacultyFilter")}
      </Button>
    </div>
  );
}
