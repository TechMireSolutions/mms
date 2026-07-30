import { UserCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { useTranslation } from "@/hooks/useTranslation";

import type { AttendanceSummaryItem, RateBarRenderer, StudentAttendanceItem } from "./attendanceReportTypes";

interface AttendanceReportTablesProps {
  summary: AttendanceSummaryItem[];
  studentAttendanceRows: StudentAttendanceItem[];
  rateBar: RateBarRenderer;
  onToggleClassFilter: (className: string) => void;
}

export function AttendanceReportTables({
  summary,
  studentAttendanceRows,
  rateBar,
  onToggleClassFilter,
}: AttendanceReportTablesProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <ExportToolbar
        title={t("attendance.report.summaryTitle")}
        data={summary}
        headers={[
          t("attendance.report.colClass"),
          t("attendance.report.colTotalStudents"),
          t("attendance.report.colAvgRate"),
          t("attendance.report.colPerfectAttendance"),
          t("attendance.report.colBelowThreshold"),
        ]}
      />
      {summary.length === 0 ? (
        <EmptyState icon={UserCheck} title={t("attendance.report.noData")} description={t("attendance.report.adjustFilters")} compact />
      ) : (
        <Card className="overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {summary.map((summaryRow) => (
              <article key={summaryRow.class} className="space-y-3 rounded-xl border border-border bg-card p-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onToggleClassFilter(summaryRow.class)}
                  className="h-auto min-h-11 px-0 py-0 text-sm font-semibold text-foreground hover:text-primary"
                >
                  {summaryRow.class}
                </Button>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colTotalStudents")}</dt>
                    <dd className="text-foreground">{summaryRow.total}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colAvgRate")}</dt>
                    <dd>{rateBar(summaryRow.avgRate)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colPerfectAttendance")}</dt>
                    <dd>
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">{summaryRow.perfectAttendance}</span>
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colBelowThreshold")}</dt>
                    <dd>
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">{summaryRow.belowThreshold}</span>
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
                  {[t("attendance.report.colClass"), t("attendance.report.colTotalStudents"), t("attendance.report.colAvgRate"), t("attendance.report.colPerfectAttendance"), t("attendance.report.colBelowThreshold")].map((headerLabel) => (
                    <th key={headerLabel} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{headerLabel}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.map((summaryRow) => (
                  <tr key={summaryRow.class} className="hover:bg-muted/30">
                    <td className="px-3 py-3 font-medium text-foreground">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onToggleClassFilter(summaryRow.class)}
                        className="h-auto px-0 py-0 font-medium text-foreground hover:text-primary"
                      >
                        {summaryRow.class}
                      </Button>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{summaryRow.total}</td>
                    <td className="px-3 py-3 w-44">{rateBar(summaryRow.avgRate)}</td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">{summaryRow.perfectAttendance}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">{summaryRow.belowThreshold}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t("attendance.report.studentDetailTitle")}</h3>
        <ExportToolbar
          title={t("attendance.report.studentDetailTitle")}
          data={studentAttendanceRows}
          headers={[
            t("attendance.report.colStudent"),
            t("attendance.report.colStudentClass"),
            t("attendance.report.colPresent"),
            t("attendance.report.colAbsent"),
            t("attendance.report.colLate"),
            t("attendance.report.colTotal"),
            t("attendance.report.colRate"),
          ]}
        />
      </div>
      {studentAttendanceRows.length === 0 ? (
        <EmptyState icon={Users} title={t("attendance.report.noStudentRecords")} compact />
      ) : (
        <Card className="overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {studentAttendanceRows.map((studentAttendance) => (
              <article key={studentAttendance.studentName} className="space-y-3 rounded-xl border border-border bg-card p-3">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <h4 className="truncate text-sm font-semibold text-foreground">{studentAttendance.studentName}</h4>
                  <div className="w-24 shrink-0">{rateBar(studentAttendance.rate)}</div>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colStudentClass")}</dt>
                    <dd className="text-foreground">{studentAttendance.class}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colTotal")}</dt>
                    <dd className="text-muted-foreground">{studentAttendance.total}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colPresent")}</dt>
                    <dd className="font-medium text-success">{studentAttendance.present}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colAbsent")}</dt>
                    <dd className="font-medium text-destructive">{studentAttendance.absent}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("attendance.report.colLate")}</dt>
                    <dd className="font-medium text-warning">{studentAttendance.late}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {[t("attendance.report.colStudent"), t("attendance.report.colStudentClass"), t("attendance.report.colPresent"), t("attendance.report.colAbsent"), t("attendance.report.colLate"), t("attendance.report.colTotal"), t("attendance.report.colRate")].map((headerLabel) => (
                    <th key={headerLabel} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{headerLabel}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {studentAttendanceRows.map((studentAttendance) => (
                  <tr key={studentAttendance.studentName} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-medium text-foreground">{studentAttendance.studentName}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{studentAttendance.class}</td>
                    <td className="px-3 py-2.5 text-success font-medium">{studentAttendance.present}</td>
                    <td className="px-3 py-2.5 text-destructive font-medium">{studentAttendance.absent}</td>
                    <td className="px-3 py-2.5 text-warning font-medium">{studentAttendance.late}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{studentAttendance.total}</td>
                    <td className="px-3 py-2.5 w-32">{rateBar(studentAttendance.rate)}</td>
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
