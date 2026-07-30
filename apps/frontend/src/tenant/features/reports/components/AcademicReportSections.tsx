import React from "react";
import { BookOpen, Filter, Star, Trophy, TrendingUp, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import type { AcademicResultItem } from "./academicReportTypes";

const GRADE_BADGE_CLS: Record<string, string> = {
  "A+": SEMANTIC_BADGE.successStrong,
  "A": SEMANTIC_BADGE.success,
  "B+": SEMANTIC_BADGE.info,
  "B": SEMANTIC_BADGE.info,
  "C": SEMANTIC_BADGE.warning,
  "F": SEMANTIC_BADGE.destructive,
};

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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard icon={BookOpen} label={t("examinations.report.totalRecords")} value={totalRecords} color="primary" />
      <StatCard icon={TrendingUp} label={t("examinations.report.classAvg")} value={`${averageMarks}%`} color="blue" />
      <StatCard icon={Trophy} label={t("examinations.report.topScore")} value={`${topScore}%`} color="amber" />
      <StatCard icon={Star} label={t("examinations.report.passRate")} value={`${passRate}%`} color="green" />
    </div>
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
        <Card className="overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {academicResults.map((academicResult) => (
              <article
                key={`${academicResult.studentName}-${academicResult.class}`}
                className="space-y-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {academicResult.rank === 1 ? (
                      <Trophy className="h-4 w-4 shrink-0 text-warning" />
                    ) : (
                      <span className="shrink-0 text-xs font-semibold text-muted-foreground">#{academicResult.rank}</span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onToggleStudentFilter(academicResult.studentName)}
                      className="h-auto min-h-11 truncate px-0 py-0 text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {academicResult.studentName}
                    </Button>
                  </div>
                  <StatusBadge
                    status={academicResult.grade}
                    size="sm"
                    config={{
                      [academicResult.grade]: {
                        label: academicResult.grade,
                        cls: GRADE_BADGE_CLS[academicResult.grade] ?? SEMANTIC_BADGE.muted,
                      },
                    }}
                  />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.report.colClass")}</dt>
                    <dd className="text-foreground">{academicResult.class}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.report.colSubject")}</dt>
                    <dd className="text-foreground">{academicResult.subject}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.report.colMarks")}</dt>
                    <dd className="font-semibold text-foreground">
                      {academicResult.marks}/{academicResult.total}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {headers.map((headerLabel) => (
                    <th key={headerLabel} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {headerLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {academicResults.map((academicResult) => (
                  <tr key={`${academicResult.studentName}-${academicResult.class}`} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5">
                      {academicResult.rank === 1 ? (
                        <Trophy className="w-4 h-4 text-warning" />
                      ) : (
                        <span className="text-muted-foreground">{academicResult.rank}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-medium">{academicResult.studentName}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{academicResult.class}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{academicResult.subject}</td>
                    <td className="px-3 py-2.5 font-semibold">
                      {academicResult.marks}/{academicResult.total}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge
                        status={academicResult.grade}
                        size="sm"
                        config={{
                          [academicResult.grade]: {
                            label: academicResult.grade,
                            cls: GRADE_BADGE_CLS[academicResult.grade] ?? SEMANTIC_BADGE.muted,
                          },
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
