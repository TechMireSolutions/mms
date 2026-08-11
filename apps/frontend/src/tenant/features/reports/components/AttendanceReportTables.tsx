import { UserCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
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
        <div className={WORK_SURFACE}>
          <div className="space-y-3 p-3 md:hidden">
            {summary.map((summaryRow) => (
              <article key={summaryRow.class} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
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
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">{t("attendance.report.summaryTitle")}</caption>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  {[
                    { key: "class", label: t("attendance.report.colClass") },
                    { key: "totalStudents", label: t("attendance.report.colTotalStudents") },
                    { key: "avgRate", label: t("attendance.report.colAvgRate") },
                    { key: "perfectAttendance", label: t("attendance.report.colPerfectAttendance") },
                    { key: "belowThreshold", label: t("attendance.report.colBelowThreshold") },
                  ].map((header) => (
                    <ModuleTableHeaderCell key={header.key} columnKey={header.key} className="px-3 py-2.5">{header.label}</ModuleTableHeaderCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {summary.map((summaryRow) => (
                  <TableRow key={summaryRow.class} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="px-3 py-2.5 font-medium text-foreground">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onToggleClassFilter(summaryRow.class)}
                        className="h-auto px-0 py-0 font-medium text-foreground hover:text-primary"
                      >
                        {summaryRow.class}
                      </Button>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">{summaryRow.total}</TableCell>
                    <TableCell className="px-3 py-2.5 w-44">{rateBar(summaryRow.avgRate)}</TableCell>
                    <TableCell className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">{summaryRow.perfectAttendance}</span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">{summaryRow.belowThreshold}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
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
        <div className={WORK_SURFACE}>
          <div className="space-y-3 p-3 md:hidden">
            {studentAttendanceRows.map((studentAttendance) => (
              <article key={studentAttendance.studentName} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
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
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">{t("attendance.report.studentDetailTitle")}</caption>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  {[
                    { key: "student", label: t("attendance.report.colStudent") },
                    { key: "class", label: t("attendance.report.colStudentClass") },
                    { key: "present", label: t("attendance.report.colPresent") },
                    { key: "absent", label: t("attendance.report.colAbsent") },
                    { key: "late", label: t("attendance.report.colLate") },
                    { key: "total", label: t("attendance.report.colTotal") },
                    { key: "rate", label: t("attendance.report.colRate") },
                  ].map((header) => (
                    <ModuleTableHeaderCell key={header.key} columnKey={header.key} className="px-3 py-2.5">{header.label}</ModuleTableHeaderCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {studentAttendanceRows.map((studentAttendance) => (
                  <TableRow key={studentAttendance.studentName} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="px-3 py-2.5 font-medium text-foreground">{studentAttendance.studentName}</TableCell>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">{studentAttendance.class}</TableCell>
                    <TableCell className="px-3 py-2.5 text-success font-medium">{studentAttendance.present}</TableCell>
                    <TableCell className="px-3 py-2.5 text-destructive font-medium">{studentAttendance.absent}</TableCell>
                    <TableCell className="px-3 py-2.5 text-warning font-medium">{studentAttendance.late}</TableCell>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">{studentAttendance.total}</TableCell>
                    <TableCell className="px-3 py-2.5 w-32">{rateBar(studentAttendance.rate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
}
