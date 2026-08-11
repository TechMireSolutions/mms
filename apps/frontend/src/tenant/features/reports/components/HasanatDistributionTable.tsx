import React from "react";
import { Star } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
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
import { Badge } from "@/components/ui/badge";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { useTranslation } from "@/hooks/useTranslation";
import type { HasanatReportItem } from "./HasanatReport";

interface HasanatDistributionTableProps {
  distribution: HasanatReportItem[];
  selectedFaculty: string | null;
  onToggleFacultyFilter: (faculty: string) => void;
}

export function HasanatDistributionTable({
  distribution,
  selectedFaculty,
  onToggleFacultyFilter,
}: HasanatDistributionTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const headers = [
    { key: "student", label: t("hasanat.report.colStudent") },
    { key: "class", label: t("hasanat.report.colClass") },
    { key: "faculty", label: t("hasanat.report.colFaculty") },
    { key: "distributed", label: t("hasanat.report.colDistributed") },
    { key: "redeemed", label: t("hasanat.report.colRedeemed") },
    { key: "balance", label: t("hasanat.report.colBalance") },
  ];
  const exportHeaders = headers.map((header) => header.label);

  return (
    <>
      <ExportToolbar title={t("hasanat.report.distributionTitle")} data={distribution} headers={exportHeaders} />
      {distribution.length === 0 ? (
        <EmptyState icon={Star} title={t("hasanat.report.noData")} compact />
      ) : (
        <div className={WORK_SURFACE}>
          <div className="space-y-3 p-3 md:hidden">
            {distribution.map((hasanatRow) => (
              <article
                key={hasanatRow.studentName}
                className={`${WORK_SURFACE_INNER} space-y-3 p-3 ${selectedFaculty === hasanatRow.faculty ? "ring-1 ring-primary/20" : ""}`}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <h4 className="truncate text-sm font-semibold text-foreground">{hasanatRow.studentName}</h4>
                  <Badge
                    pill
                    tone={hasanatRow.balance > 0 ? "warning" : "muted"}
                    className="shrink-0"
                  >
                    {hasanatRow.balance}
                  </Badge>
                </div>
                <StatGrid>
                  <StatRow
                    className="min-w-0"
                    label={t("hasanat.report.colClass")}
                    value={hasanatRow.class}
                  />
                  <StatRow
                    className="min-w-0"
                    label={t("hasanat.report.colFaculty")}
                    value={
                      <TableCellLink
                        tap
                        muted
                        toggle
                        selected={selectedFaculty === hasanatRow.faculty}
                        onClick={() => onToggleFacultyFilter(hasanatRow.faculty)}
                      >
                        {hasanatRow.faculty}
                      </TableCellLink>
                    }
                  />
                  <StatRow
                    className="min-w-0"
                    label={t("hasanat.report.colDistributed")}
                    value={hasanatRow.distributed}
                    ddClassName="font-semibold text-primary"
                  />
                  <StatRow
                    className="min-w-0"
                    label={t("hasanat.report.colRedeemed")}
                    value={hasanatRow.redeemed}
                    ddClassName="font-semibold text-success"
                  />
                </StatGrid>
              </article>
            ))}
          </div>
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">{t("hasanat.report.distributionTitle")}</caption>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  {headers.map((header) => (
                    <ModuleTableHeaderCell key={header.key} columnKey={header.key} className="px-3 py-2.5">
                      {header.label}
                    </ModuleTableHeaderCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {distribution.map((hasanatRow) => (
                  <TableRow key={hasanatRow.studentName} className={`hover:bg-muted/20 transition-colors ${selectedFaculty === hasanatRow.faculty ? "bg-primary/10" : ""}`}>
                    <TableCell className="px-3 py-2.5 font-medium">{hasanatRow.studentName}</TableCell>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">{hasanatRow.class}</TableCell>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">
                      <TableCellLink
                        muted
                        toggle
                        selected={selectedFaculty === hasanatRow.faculty}
                        onClick={() => onToggleFacultyFilter(hasanatRow.faculty)}
                      >
                        {hasanatRow.faculty}
                      </TableCellLink>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 font-semibold text-primary">{hasanatRow.distributed}</TableCell>
                    <TableCell className="px-3 py-2.5 font-semibold text-success">{hasanatRow.redeemed}</TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Badge as="span" pill tone={hasanatRow.balance > 0 ? "warning" : "muted"}>
                        {hasanatRow.balance}
                      </Badge>
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
}
