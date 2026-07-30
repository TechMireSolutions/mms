import React from "react";
import { Bookmark, Clock, Play, Trash2, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { formatDate, type AppTranslationKey, type GenericSavedReport } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { SAVED_REPORT_CATEGORY_BADGE_CLS } from "./savedReportsConstants";

const MotionCard = motion.create(Card);

interface SavedReportCardProps {
  report: GenericSavedReport;
  onRun?: (report: GenericSavedReport) => void;
  onDelete: (id: string) => void;
}

export function SavedReportCard({ report, onRun, onDelete }: SavedReportCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const globalSettings = useGlobalSettings();

  return (
    <MotionCard
      layout
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="flex flex-col gap-3 text-start group cursor-pointer hover:shadow-surface-lg p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{report.name}</h4>
          <StatusBadge
            status={report.category}
            size="sm"
            config={{
              [report.category]: {
                label: t(`reports.category.${report.category}` as AppTranslationKey),
                cls: SAVED_REPORT_CATEGORY_BADGE_CLS[report.category] ?? SEMANTIC_BADGE.muted,
              },
            }}
          />
        </div>
        <Bookmark className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(report.lastRun, globalSettings.dateFormat)}
        </span>
        {report.createdByName && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {report.createdByName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-border">
        {onRun && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void onRun(report)}
            className="px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 gap-1 cursor-pointer"
            type="button"
          >
            <Play className="w-3 h-3" /> {t("reports.saved.run")}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void onDelete(report.id)}
          className="px-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1 ms-auto cursor-pointer"
          type="button"
        >
          <Trash2 className="w-3 h-3" /> {t("reports.saved.delete")}
        </Button>
      </div>
    </MotionCard>
  );
}
