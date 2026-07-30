import React from "react";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

interface AcademicReportResultsBodyProps {
  academicResults: AcademicResultItem[];
  onToggleStudentFilter: (studentName: string) => void;
}

export function AcademicReportResultsBody({
  academicResults,
  onToggleStudentFilter,
}: AcademicReportResultsBodyProps): React.JSX.Element {
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
  );
}

export { GRADE_BADGE_CLS };
