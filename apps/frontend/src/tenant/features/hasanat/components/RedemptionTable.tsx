import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Star } from "lucide-react";
import { formatDate } from "@mms/shared";
import type { Redemption } from "@/lib/data/hasanatData";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
} from "@/components/ui/table";
import { MutedTableHeaderRow } from "@/components/ui/reports/FinancialDebitCreditTableChrome";
import { WORK_SURFACE } from "@/components/ui/formStyles";

export interface RedemptionTableProps {
  redemptions: Redemption[];
  columnVisible: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  rowMotion: (index: number) => HTMLMotionProps<"tr">;
}

export function RedemptionTable({
  redemptions,
  columnVisible,
  getColumnWidth,
  onColumnResize,
  rowMotion,
}: RedemptionTableProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={WORK_SURFACE}>
      <Table className="table-fixed">
        <caption className="sr-only">{t("hasanat.tabs.redemptions")}</caption>
        <TableHeader>
          <MutedTableHeaderRow>
            {columnVisible("student") && (
              <ModuleTableHeaderCell
                columnKey="student"
                width={getColumnWidth?.("student")}
                onResize={onColumnResize}
                className="px-3 py-2.5"
              >
                {t("hasanat.columns.redemption.student")}
              </ModuleTableHeaderCell>
            )}
            {columnVisible("reward") && (
              <ModuleTableHeaderCell
                columnKey="reward"
                width={getColumnWidth?.("reward")}
                onResize={onColumnResize}
                className="px-3 py-2.5"
              >
                {t("hasanat.columns.redemption.reward")}
              </ModuleTableHeaderCell>
            )}
            {columnVisible("pointsUsed") && (
              <ModuleTableHeaderCell
                columnKey="pointsUsed"
                width={getColumnWidth?.("pointsUsed")}
                onResize={onColumnResize}
                className="px-3 py-2.5"
              >
                {t("hasanat.columns.redemption.pointsUsed")}
              </ModuleTableHeaderCell>
            )}
            {columnVisible("date") && (
              <ModuleTableHeaderCell
                columnKey="date"
                width={getColumnWidth?.("date")}
                onResize={onColumnResize}
                className="px-3 py-2.5"
              >
                {t("hasanat.columns.redemption.date")}
              </ModuleTableHeaderCell>
            )}
            {columnVisible("approvedBy") && (
              <ModuleTableHeaderCell
                columnKey="approvedBy"
                width={getColumnWidth?.("approvedBy")}
                onResize={onColumnResize}
                className="px-3 py-2.5"
              >
                {t("hasanat.columns.redemption.approvedBy")}
              </ModuleTableHeaderCell>
            )}
          </MutedTableHeaderRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/50">
          {redemptions.map((redemption, index) => (
            <motion.tr
              key={redemption.id}
              {...rowMotion(index * 0.04)}
              className="hover:bg-muted/20 transition-colors"
            >
              {columnVisible("student") && (
                <TableCell className="px-3 py-2.5 text-sm font-semibold text-foreground whitespace-nowrap">
                  {redemption.studentName || "—"}
                </TableCell>
              )}
              {columnVisible("reward") && (
                <TableCell className="px-3 py-2.5 text-sm text-foreground">
                  {redemption.reward}
                </TableCell>
              )}
              {columnVisible("pointsUsed") && (
                <TableCell className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-warning" aria-hidden="true" />
                    <span className="text-sm font-bold text-warning">
                      {redemption.pointsUsed}
                    </span>
                  </div>
                </TableCell>
              )}
              {columnVisible("date") && (
                <TableCell className="px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(redemption.date)}
                </TableCell>
              )}
              {columnVisible("approvedBy") && (
                <TableCell className="px-3 py-2.5 text-sm text-muted-foreground">
                  {redemption.approvedBy || "—"}
                </TableCell>
              )}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
