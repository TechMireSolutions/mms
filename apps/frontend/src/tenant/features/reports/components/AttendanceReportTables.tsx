import React, { useMemo } from "react";
import { UserCheck, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { TableCellLink } from "@/components/ui/TableCellLink";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { Badge } from "@/components/ui/badge";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { useTranslation } from "@/hooks/useTranslation";

import type { AttendanceSummaryItem, RateBarRenderer, StudentAttendanceItem } from "./attendanceReportTypes";

interface AttendanceReportTablesProps {
  summary: AttendanceSummaryItem[];
  studentAttendanceRows: StudentAttendanceItem[];
  rateBar: RateBarRenderer;
  onToggleClassFilter: (className: string) => void;
}

export const AttendanceReportTables = React.memo(function AttendanceReportTables({
  summary,
  studentAttendanceRows,
  rateBar,
  onToggleClassFilter,
}: AttendanceReportTablesProps): React.JSX.Element {
  const { t } = useTranslation();

  const summaryHeaders = useMemo(() => [
    t("attendance.report.colClass"),
    t("attendance.report.colTotalStudents"),
    t("attendance.report.colAvgRate"),
    t("attendance.report.colPerfectAttendance"),
    t("attendance.report.colBelowThreshold"),
  ], [t]);

  return (
    <>
      <ExportToolbar
        title={t("attendance.report.summaryTitle")}
        data={summary}
        headers={summaryHeaders}
      />
      {summary.length === 0 ? (
        <EmptyState icon={UserCheck} title={t("attendance.report.noData")} description={t("attendance.report.adjustFilters")} compact />
      ) : (
        <div className={WORK_SURFACE}>
          <div className="space-y-3 p-3 md:hidden">
            {summary.map((summaryRow) => (
              <article key={summaryRow.class} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
                <TableCellLink tap onClick={() => onToggleClassFilter(summaryRow.class)}>
                  {summaryRow.class}
                </TableCellLink>
                <StatGrid>
                  <StatRow className="min-w-0" label={t("attendance.report.colTotalStudents")} value={summaryRow.total} />
                  <StatRow className="min-w-0" label={t("attendance.report.colAvgRate")} value={rateBar(summaryRow.avgRate)} />
                  <StatRow
                    className="min-w-0"
                    label={t("attendance.report.colPerfectAttendance")}
                    value={<Badge pill tone="success">{summaryRow.perfectAttendance}</Badge>}
                  />
                  <StatRow
                    className="min-w-0"
                    label={t("attendance.report.colBelowThreshold")}
                    value={<Badge pill tone="destructive">{summaryRow.belowThreshold}</Badge>}
                  />
                </StatGrid>
              </article>
            ))}
          </div>
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">{t("attendance.report.summaryTitle")}</caption>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  <ModuleTableHeaderCell columnKey="class" className="px-3 py-2.5">{t("attendance.report.colClass")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="totalStudents" className="px-3 py-2.5">{t("attendance.report.colTotalStudents")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="avgRate" className="px-3 py-2.5">{t("attendance.report.colAvgRate")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="perfectAttendance" className="px-3 py-2.5">{t("attendance.report.colPerfectAttendance")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="belowThreshold" className="px-3 py-2.5">{t("attendance.report.colBelowThreshold")}</ModuleTableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {summary.map((summaryRow) => (
                  <TableRow key={summaryRow.class} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="px-3 py-2.5 font-medium text-foreground">
                      <TableCellLink tap onClick={() => onToggleClassFilter(summaryRow.class)}>
                        {summaryRow.class}
                      </TableCellLink>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">{summaryRow.total}</TableCell>
                    <TableCell className="px-3 py-2.5 w-36">{rateBar(summaryRow.avgRate)}</TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Badge pill tone="success">{summaryRow.perfectAttendance}</Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Badge pill tone="destructive">{summaryRow.belowThreshold}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

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
      {studentAttendanceRows.length === 0 ? (
        <EmptyState icon={Users} title={t("attendance.report.noStudentRecords")} compact />
      ) : (
        <div className={WORK_SURFACE}>
          <div className="space-y-3 p-3 md:hidden">
            {studentAttendanceRows.map((studentAttendance) => (
              <article key={studentAttendance.studentName} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
                <h4 className="truncate text-sm font-semibold text-foreground">{studentAttendance.studentName}</h4>
                <StatGrid>
                  <StatRow className="min-w-0" label={t("attendance.report.colStudentClass")} value={studentAttendance.class} />
                  <StatRow className="min-w-0" label={t("attendance.report.colPresent")} value={studentAttendance.present} ddClassName="text-success font-medium" />
                  <StatRow className="min-w-0" label={t("attendance.report.colAbsent")} value={studentAttendance.absent} ddClassName="text-destructive font-medium" />
                  <StatRow className="min-w-0" label={t("attendance.report.colLate")} value={studentAttendance.late} ddClassName="text-warning font-medium" />
                  <StatRow className="min-w-0" label={t("attendance.report.colTotal")} value={studentAttendance.total} />
                  <StatRow className="min-w-0" label={t("attendance.report.colRate")} value={rateBar(studentAttendance.rate)} />
                </StatGrid>
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
});
