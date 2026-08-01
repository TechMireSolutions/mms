import React from "react";
import { Button } from "@/components/ui/button";
import type { FacultyWorkloadItem } from "@/tenant/features/reports/components/useFacultyReportData";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface FacultyReportWorkloadTableProps {
  t: TranslationFunction;
  rows: FacultyWorkloadItem[];
  selectedFaculty: string | null;
  onToggleFacultyFilter: (faculty: string) => void;
}

export function FacultyReportWorkloadTable({
  t,
  rows,
  selectedFaculty,
  onToggleFacultyFilter,
}: FacultyReportWorkloadTableProps): React.JSX.Element {
  const maxClasses = Math.max(...rows.map((row) => row.classes), 1);

  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((faculty) => (
          <article
            key={faculty.faculty}
            className={`space-y-3 rounded-xl border border-border bg-card p-3 ${selectedFaculty === faculty.faculty ? "ring-1 ring-primary/20" : ""}`}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={() => onToggleFacultyFilter(faculty.faculty)}
              className={`h-auto min-h-11 px-0 py-0 text-sm font-semibold hover:bg-transparent hover:text-foreground ${
                selectedFaculty === faculty.faculty ? "text-primary" : "text-foreground"
              }`}
            >
              {faculty.faculty}
            </Button>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">{t("teachers.report.colClasses")}</dt>
                <dd>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${(faculty.classes / maxClasses) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground">{faculty.classes}</span>
                  </div>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">{t("teachers.report.colSessions")}</dt>
                <dd className="text-foreground">{faculty.sessions}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">{t("teachers.report.colStudents")}</dt>
                <dd className="font-semibold text-foreground">{faculty.totalStudents}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {[
                t("teachers.report.colFaculty"),
                t("teachers.report.colClasses"),
                t("teachers.report.colSessions"),
                t("teachers.report.colStudents"),
              ].map((heading) => (
                <th key={heading} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((faculty) => (
              <tr
                key={faculty.faculty}
                className={`hover:bg-muted/30 ${selectedFaculty === faculty.faculty ? "bg-primary/10" : ""}`}
              >
                <td className="px-3 py-3 font-medium">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onToggleFacultyFilter(faculty.faculty)}
                    className={`h-auto px-0 py-0 font-medium hover:bg-transparent hover:text-foreground ${
                      selectedFaculty === faculty.faculty ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {faculty.faculty}
                  </Button>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${(faculty.classes / maxClasses) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground">{faculty.classes}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{faculty.sessions}</td>
                <td className="px-3 py-3 font-semibold text-foreground">{faculty.totalStudents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
