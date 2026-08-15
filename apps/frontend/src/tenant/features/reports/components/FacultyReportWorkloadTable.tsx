import React from "react";
import { TableCellLink } from "@/components/ui/TableCellLink";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import type { FacultyWorkloadItem } from "@/tenant/features/reports/components/teacherReportTypes";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface FacultyReportWorkloadTableProps {
  t: TranslationFunction;
  rows: FacultyWorkloadItem[];
  selectedFaculty: string | null;
  onToggleFacultyFilter: (faculty: string) => void;
}

export const FacultyReportWorkloadTable = React.memo(function FacultyReportWorkloadTable({
  t,
  rows,
  selectedFaculty,
  onToggleFacultyFilter,
}: FacultyReportWorkloadTableProps): React.JSX.Element {
  const maxClasses = Math.max(...rows.map((row) => row.classes), 1);

  return (
    <div className={WORK_SURFACE}>
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((faculty) => (
          <article
            key={faculty.faculty}
            className={`${WORK_SURFACE_INNER} space-y-3 p-3 ${selectedFaculty === faculty.faculty ? "ring-1 ring-primary/20" : ""}`}
          >
            <TableCellLink tap toggle selected={selectedFaculty === faculty.faculty} onClick={() => onToggleFacultyFilter(faculty.faculty)}>
              {faculty.faculty}
            </TableCellLink>
            <StatGrid>
              <StatRow
                className="min-w-0"
                label={t("teachers.report.colClasses")}
                value={
                  <ProgressBar
                    value={(faculty.classes / maxClasses) * 100}
                    fillClassName="bg-primary"
                    trackClassName="w-16 flex-none"
                    label={faculty.classes}
                    labelClassName="text-foreground"
                  />
                }
              />
              <StatRow className="min-w-0" label={t("teachers.report.colSessions")} value={faculty.sessions} />
              <StatRow
                className="min-w-0"
                label={t("teachers.report.colStudents")}
                value={faculty.totalStudents}
                ddClassName="font-semibold"
              />
            </StatGrid>
          </article>
        ))}
      </div>
      <div className="hidden md:block">
        <Table>
          <caption className="sr-only">{t("teachers.report.workloadReportTitle")}</caption>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              {[
                { key: "faculty", label: t("teachers.report.colFaculty") },
                { key: "classes", label: t("teachers.report.colClasses") },
                { key: "sessions", label: t("teachers.report.colSessions") },
                { key: "students", label: t("teachers.report.colStudents") },
              ].map((header) => (
                <ModuleTableHeaderCell key={header.key} columnKey={header.key} className="px-3 py-2.5">{header.label}</ModuleTableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {rows.map((faculty) => (
              <TableRow
                key={faculty.faculty}
                className={`hover:bg-muted/20 transition-colors ${selectedFaculty === faculty.faculty ? "bg-primary/10" : ""}`}
              >
                <TableCell className="px-3 py-2.5 font-medium">
                  <TableCellLink
                    toggle
                    selected={selectedFaculty === faculty.faculty}
                    onClick={() => onToggleFacultyFilter(faculty.faculty)}
                    className="font-medium"
                  >
                    {faculty.faculty}
                  </TableCellLink>
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <ProgressBar
                    value={(faculty.classes / maxClasses) * 100}
                    fillClassName="bg-primary"
                    trackClassName="w-16 flex-none"
                    label={faculty.classes}
                    labelClassName="text-foreground"
                  />
                </TableCell>
                <TableCell className="px-3 py-2.5 text-muted-foreground">{faculty.sessions}</TableCell>
                <TableCell className="px-3 py-2.5 font-semibold text-foreground">{faculty.totalStudents}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
