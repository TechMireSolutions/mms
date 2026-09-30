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
import { FacultyReportWorkloadTable } from "@/components/ui/reports/FacultyReportWorkloadTable";

import type { FacultyReportTablesProps } from "./facultyReportTypes";

export const FacultyReportTables = (function FacultyReportTables({
  activeSubTab,
  faculty,
  statusBadgeConfig,
  listLoading,
  workloadRows,
  selectedFaculty,
  onToggleFacultyFilter,
}: FacultyReportTablesProps): React.JSX.Element {
  const { t } = useTranslation();

  if (activeSubTab === "workload") {
    if (workloadRows.length === 0) {
      return (
        <EmptyState
          icon={Users}
          title={t("faculty.report.noFacultyData")}
          description={t("faculty.report.adjustFilters")}
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

  return faculty.length === 0 ? (
    <EmptyState icon={Users} title={t("faculty.report.noTeachersFound")} description={t("faculty.report.adjustFilters")} compact />
  ) : (
    <div className={WORK_SURFACE}>
      <div className="space-y-3 p-3 md:hidden">
        {faculty.map((member) => (
          <article key={member.id} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <h4 className="truncate text-sm font-semibold text-foreground">{member.name}</h4>
              <StatusBadge status={member.status} config={statusBadgeConfig} />
            </div>
            <StatGrid>
              <StatRow className="min-w-0" label={t("faculty.report.colEmployeeId")} value={member.employeeId} />
              <StatRow
                className="min-w-0"
                label={t("faculty.report.colSpecialization")}
                value={member.specialization}
                ddClassName="truncate"
              />
              <StatRow
                className="min-w-0"
                label={t("faculty.report.colQualification")}
                value={member.qualification}
                ddClassName="truncate"
              />
              <StatRow
                className="min-w-0"
                label={t("faculty.report.colGender")}
                value={toTitleCase(member.gender)}
                ddClassName="truncate"
              />
              <StatRow
                className="min-w-0"
                label={t("faculty.report.colJoinDate")}
                value={member.joinDate}
                ddClassName="text-muted-foreground"
              />
            </StatGrid>
          </article>
        ))}
      </div>
      <div className="hidden md:block">
        <Table>
          <caption className="sr-only">{t("faculty.report.rosterTab")}</caption>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <ModuleTableHeaderCell columnKey="name" className="px-3 py-2.5">{t("faculty.report.colName")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="employeeId" className="px-3 py-2.5 hidden sm:table-cell">{t("faculty.report.colEmployeeId")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="specialization" className="px-3 py-2.5 hidden sm:table-cell">{t("faculty.report.colSpecialization")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="qualification" className="px-3 py-2.5 hidden md:table-cell">{t("faculty.report.colQualification")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="gender" className="px-3 py-2.5 hidden lg:table-cell">{t("faculty.report.colGender")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="joinDate" className="px-3 py-2.5 hidden lg:table-cell">{t("faculty.report.colJoinDate")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="status" className="px-3 py-2.5">{t("faculty.report.colStatus")}</ModuleTableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {faculty.map((member) => (
              <TableRow key={member.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="px-3 py-2.5 font-medium text-foreground">{member.name}</TableCell>
                <TableCell className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{member.employeeId}</TableCell>
                <TableCell className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{member.specialization}</TableCell>
                <TableCell className="px-3 py-2.5 text-muted-foreground max-w-cell-lg truncate hidden md:table-cell">{member.qualification}</TableCell>
                <TableCell className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">{toTitleCase(member.gender)}</TableCell>
                <TableCell className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">{member.joinDate}</TableCell>
                <TableCell className="px-3 py-2.5">
                  <StatusBadge status={member.status} config={statusBadgeConfig} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
