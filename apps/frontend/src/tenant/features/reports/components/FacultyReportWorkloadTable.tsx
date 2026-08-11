import React from "react";
import { Button } from "@/components/ui/button";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
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
    <div className={WORK_SURFACE}>
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((faculty) => (
          <article
            key={faculty.faculty}
            className={`${WORK_SURFACE_INNER} space-y-3 p-3 ${selectedFaculty === faculty.faculty ? "ring-1 ring-primary/20" : ""}`}
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
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${(faculty.classes / maxClasses) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground">{faculty.classes}</span>
                  </div>
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
}
