import React from "react";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { TableSkeleton } from "@/components/ui/LoadingState";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { useTranslation } from "@/hooks/useTranslation";
import { toTitleCase } from "@mms/shared";
import { FacultyReportWorkloadTable } from "@/tenant/features/reports/components/FacultyReportWorkloadTable";

import type { TeacherReportTablesProps } from "./teacherReportTypes";

export const FacultyReportTables = React.memo(function FacultyReportTables({
  activeSubTab,
  teachers,
  statusBadgeConfig,
  listLoading,
  workloadRows,
  selectedFaculty,
  onToggleFacultyFilter,
}: TeacherReportTablesProps): React.JSX.Element {
  const { t } = useTranslation();

  if (activeSubTab === "workload") {
    if (workloadRows.length === 0) {
      return (
        <EmptyState
          icon={Users}
          title={t("teachers.report.noFacultyData")}
          description={t("teachers.report.adjustFilters")}
          compact
        />
      );
    }
    return (
      <FacultyReportWorkloadTable
        t={t}
        rows={workloadRows}
        selectedFaculty={selectedFaculty}
        onToggleFacultyFilter={onToggleFacultyFilter}
      />
    );
  }

  if (listLoading) {
    return <TableSkeleton rows={5} cols={6} />;
  }

  return teachers.length === 0 ? (
    <EmptyState icon={Users} title={t("teachers.report.noTeachersFound")} description={t("teachers.report.adjustFilters")} compact />
  ) : (
    <div className={WORK_SURFACE}>
      <div className="space-y-3 p-3 md:hidden">
        {teachers.map((teacher) => (
          <article key={teacher.id} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <h4 className="truncate text-sm font-semibold text-foreground">{teacher.name}</h4>
              <StatusBadge status={teacher.status} config={statusBadgeConfig} />
            </div>
            <StatGrid>
              <StatRow className="min-w-0" label={t("teachers.report.colEmployeeId")} value={teacher.employeeId} />
              <StatRow
                className="min-w-0"
                label={t("teachers.report.colSpecialization")}
                value={teacher.specialization}
                ddClassName="truncate"
              />
              <StatRow
                className="min-w-0"
                label={t("teachers.report.colQualification")}
                value={teacher.qualification}
                ddClassName="truncate"
              />
              <StatRow
                className="min-w-0"
                label={t("teachers.report.colGender")}
                value={toTitleCase(teacher.gender)}
                ddClassName="truncate"
              />
              <StatRow
                className="min-w-0"
                label={t("teachers.report.colJoinDate")}
                value={teacher.joinDate}
                ddClassName="text-muted-foreground"
              />
            </StatGrid>
          </article>
        ))}
      </div>
      <div className="hidden md:block">
        <Table>
          <caption className="sr-only">{t("teachers.report.rosterTab")}</caption>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <ModuleTableHeaderCell columnKey="name" className="px-3 py-2.5">{t("teachers.report.colName")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="employeeId" className="px-3 py-2.5 hidden sm:table-cell">{t("teachers.report.colEmployeeId")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="specialization" className="px-3 py-2.5 hidden sm:table-cell">{t("teachers.report.colSpecialization")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="qualification" className="px-3 py-2.5 hidden md:table-cell">{t("teachers.report.colQualification")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="gender" className="px-3 py-2.5 hidden lg:table-cell">{t("teachers.report.colGender")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="joinDate" className="px-3 py-2.5 hidden lg:table-cell">{t("teachers.report.colJoinDate")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="status" className="px-3 py-2.5">{t("teachers.report.colStatus")}</ModuleTableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {teachers.map((teacher) => (
              <TableRow key={teacher.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="px-3 py-2.5 font-medium text-foreground">{teacher.name}</TableCell>
                <TableCell className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{teacher.employeeId}</TableCell>
                <TableCell className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{teacher.specialization}</TableCell>
                <TableCell className="px-3 py-2.5 text-muted-foreground max-w-cell-lg truncate hidden md:table-cell">{teacher.qualification}</TableCell>
                <TableCell className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">{toTitleCase(teacher.gender)}</TableCell>
                <TableCell className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">{teacher.joinDate}</TableCell>
                <TableCell className="px-3 py-2.5">
                  <StatusBadge status={teacher.status} config={statusBadgeConfig} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
