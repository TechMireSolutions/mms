import React from "react";
import { BookOpen, Filter, Star, Trophy, TrendingUp, X } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { AcademicResultItem } from "./academicReportTypes";
import { AcademicReportResultsBody } from "./AcademicReportResultsBody";

interface AcademicReportKpisProps {
  totalRecords: number;
  averageMarks: string | number;
  topScore: number;
  passRate: string | number;
}

export function AcademicReportKpis({
  totalRecords,
  averageMarks,
  topScore,
  passRate,
}: AcademicReportKpisProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleCommandMetricsGrid
      items={[
        { icon: BookOpen, label: t("examinations.report.totalRecords"), value: totalRecords, accent: "primary" },
        { icon: TrendingUp, label: t("examinations.report.classAvg"), value: `${averageMarks}%`, accent: "blue" },
        { icon: Trophy, label: t("examinations.report.topScore"), value: `${topScore}%`, accent: "amber" },
        { icon: Star, label: t("examinations.report.passRate"), value: `${passRate}%`, accent: "green" },
      ]}
    />
  );
}

interface AcademicReportFilterBannerProps {
  selectedStudent: string | null;
  selectedClass: string | null;
  onClearStudent: () => void;
  onClearClass: () => void;
}

export function AcademicReportFilterBanner({
  selectedStudent,
  selectedClass,
  onClearStudent,
  onClearClass,
}: AcademicReportFilterBannerProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!selectedStudent && !selectedClass) return null;

  return (
    <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-primary" />
        {selectedStudent && (
          <>
            <span className="font-medium text-foreground">{t("examinations.report.studentFilterLabel")}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
              {selectedStudent}
            </span>
          </>
        )}
        {selectedClass && (
          <>
            <span className="font-medium text-foreground">{t("examinations.report.classFilterLabel")}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
              {selectedClass}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        {selectedStudent && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearStudent}
            className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 me-1" />
            {t("examinations.report.clearStudentFilter")}
          </Button>
        )}
        {selectedClass && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearClass}
            className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 me-1" />
            {t("examinations.report.clearClassFilter")}
          </Button>
        )}
      </div>
    </div>
  );
}

interface AcademicReportResultsTableProps {
  academicResults: AcademicResultItem[];
  onToggleStudentFilter: (studentName: string) => void;
}

export function AcademicReportResultsTable({
  academicResults,
  onToggleStudentFilter,
}: AcademicReportResultsTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const headers = [
    t("examinations.report.colRank"),
    t("examinations.report.colStudent"),
    t("examinations.report.colClass"),
    t("examinations.report.colSubject"),
    t("examinations.report.colMarks"),
    t("examinations.report.colGrade"),
  ];

  return (
    <>
      <ExportToolbar title={t("examinations.report.examResultsTitle")} data={academicResults} headers={headers} />
      {academicResults.length === 0 ? (
        <EmptyState icon={BookOpen} title={t("examinations.report.noResultsFound")} compact />
      ) : (
        <AcademicReportResultsBody
          academicResults={academicResults}
          onToggleStudentFilter={onToggleStudentFilter}
        />
      )}
    </>
  );
}
