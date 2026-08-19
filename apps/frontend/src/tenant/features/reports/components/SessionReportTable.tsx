import React, { useMemo } from "react";
import { CalendarCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useTranslation } from "@/hooks/useTranslation";
import { utilisationColour } from "./sessionReportUtils";

import type { SessionReportTableProps } from "./sessionReportTypes";

const UtilisationBar = React.memo(function UtilisationBar({ rate }: { rate: number }): React.JSX.Element {
  return (
    <ProgressBar
      value={rate}
      fillClassName={utilisationColour(rate)}
      label={`${rate}%`}
      labelClassName="text-foreground"
    />
  );
});

export const SessionReportTable = React.memo(function SessionReportTable({
  sessionCapacityData,
  sessionStatusConfig,
  onToggleSessionFilter,
  onToggleClassFilter,
}: SessionReportTableProps): React.JSX.Element {
  const { t } = useTranslation();

  const headers = useMemo(() => [
    t("sessions.report.colSession"),
    t("sessions.report.colClass"),
    t("sessions.report.colEnrolled"),
    t("sessions.report.colCapacity"),
    t("sessions.report.colUtilisation"),
    t("sessions.report.colStatus"),
  ], [t]);

  return (
    <>
      <ExportToolbar
        title={t("sessions.report.capacityReportTitle")}
        data={sessionCapacityData}
        headers={headers}
      />
      {sessionCapacityData.length === 0 ? (
        <EmptyState icon={CalendarCheck} title={t("sessions.report.noData")} compact />
      ) : (
        <div className={WORK_SURFACE}>
          <div className="space-y-3 p-3 md:hidden">
            {sessionCapacityData.map((sessionCapacity) => (
              <article
                key={`${sessionCapacity.sessionId}-${sessionCapacity.classId}`}
                className={`${WORK_SURFACE_INNER} space-y-3 p-3`}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <TableCellLink tap onClick={() => onToggleSessionFilter(sessionCapacity.session)} className="max-w-full truncate">
                      {sessionCapacity.session}
                    </TableCellLink>
                    <TableCellLink tap muted onClick={() => onToggleClassFilter(sessionCapacity.class)} className="text-xs">
                      {sessionCapacity.class}
                    </TableCellLink>
                  </div>
                  <StatusBadge status={sessionCapacity.status} config={sessionStatusConfig} size="sm" />
                </div>
                <StatGrid>
                  <StatRow
                    className="min-w-0"
                    label={t("sessions.report.colEnrolled")}
                    value={sessionCapacity.enrolled}
                    ddClassName="font-semibold"
                  />
                  <StatRow
                    className="min-w-0"
                    label={t("sessions.report.colCapacity")}
                    value={sessionCapacity.capacity}
                    ddClassName="text-muted-foreground"
                  />
                  <StatRow
                    fullWidth
                    label={t("sessions.report.colUtilisation")}
                    value={<UtilisationBar rate={sessionCapacity.rate} />}
                    dtClassName="mb-1"
                  />
                </StatGrid>
              </article>
            ))}
          </div>
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">{t("sessions.report.capacityReportTitle")}</caption>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  {[
                    { key: "session", label: t("sessions.report.colSession") },
                    { key: "class", label: t("sessions.report.colClass") },
                    { key: "enrolled", label: t("sessions.report.colEnrolled") },
                    { key: "capacity", label: t("sessions.report.colCapacity") },
                    { key: "utilisation", label: t("sessions.report.colUtilisation") },
                    { key: "status", label: t("sessions.report.colStatus") },
                  ].map((header) => (
                    <ModuleTableHeaderCell key={header.key} columnKey={header.key} className="px-3 py-2.5">{header.label}</ModuleTableHeaderCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {sessionCapacityData.map((sessionCapacity) => (
                  <TableRow key={`${sessionCapacity.sessionId}-${sessionCapacity.classId}`} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="px-3 py-2.5 font-medium max-w-cell-md truncate">
                      <TableCellLink onClick={() => onToggleSessionFilter(sessionCapacity.session)} className="max-w-cell-md truncate font-medium">
                        {sessionCapacity.session}
                      </TableCellLink>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">
                      <TableCellLink muted onClick={() => onToggleClassFilter(sessionCapacity.class)}>
                        {sessionCapacity.class}
                      </TableCellLink>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 font-semibold text-foreground">{sessionCapacity.enrolled}</TableCell>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">{sessionCapacity.capacity}</TableCell>
                    <TableCell className="px-3 py-2.5 w-36">
                      <UtilisationBar rate={sessionCapacity.rate} />
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <StatusBadge status={sessionCapacity.status} config={sessionStatusConfig} size="sm" />
                    </TableCell>
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

