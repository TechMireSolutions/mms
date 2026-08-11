import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  MotionTableRow,
  OutstandingFeeMessagingActions,
  OutstandingFeeOverdueBadge,
  type OpenComposer,
} from "@/components/dashboard-widgets/OutstandingFeesTableParts";
import type { OutstandingFeeRow } from "@/components/dashboard-widgets/OutstandingFeesTableMobileList";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface OutstandingFeesTableDesktopBodyProps {
  rows: OutstandingFeeRow[];
  canWriteMessaging: boolean;
  formatCurrency: (amount: number) => string;
  openComposer: OpenComposer;
  t: TranslationFunction;
}

export function OutstandingFeesTableDesktopBody({
  rows,
  canWriteMessaging,
  formatCurrency,
  openComposer,
  t,
}: OutstandingFeesTableDesktopBodyProps) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <Table className="w-full text-sm">
        <TableHeader>
          <TableRow className="border-b border-border/45 bg-muted/30 hover:bg-transparent">
            <ModuleTableHeaderCell columnKey="student" className="px-5 py-3 select-none">
              {t("hasanat.columns.redemption.student")}
            </ModuleTableHeaderCell>
            <ModuleTableHeaderCell columnKey="class" className="px-3 py-3 hidden sm:table-cell select-none">
              {t("sessions.report.colClass")}
            </ModuleTableHeaderCell>
            <ModuleTableHeaderCell columnKey="amount" className="px-3 py-3 select-none">
              {t("finance.columns.amount")}
            </ModuleTableHeaderCell>
            <ModuleTableHeaderCell columnKey="overdue" className="px-3 py-3 hidden md:table-cell select-none">
              {t("finance.metrics.overdue")}
            </ModuleTableHeaderCell>
            {canWriteMessaging && (
              <ModuleTableHeaderCell columnKey="actions" className="px-3 py-3 text-end select-none">
                {t("hasanat.columns.actions")}
              </ModuleTableHeaderCell>
            )}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/50">
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canWriteMessaging ? 5 : 4} className="p-0">
                <EmptyState title={t("finance.report.noInvoicesMatch")} compact icon={null} className="select-none" />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((outstandingFee, index) => (
              <MotionTableRow
                key={outstandingFee.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                className="hover:bg-muted/20 transition-colors"
              >
                <TableCell className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar id={outstandingFee.studentId} name={outstandingFee.student} className="w-7 h-7 rounded-full text-xs font-bold" />
                    <span className="text-sm font-semibold text-foreground">{outstandingFee.student}</span>
                  </div>
                </TableCell>
                <TableCell className="px-3 py-3 text-sm text-muted-foreground/80 font-medium hidden sm:table-cell">{outstandingFee.class}</TableCell>
                <TableCell className="px-3 py-3">
                  <span className="text-sm font-bold text-destructive tabular-nums">{formatCurrency(outstandingFee.amount)}</span>
                </TableCell>
                <TableCell className="px-3 py-3 hidden md:table-cell">
                  <OutstandingFeeOverdueBadge months={outstandingFee.months} t={t} />
                </TableCell>
                {canWriteMessaging && (
                  <TableCell className="px-3 py-3 text-end">
                    <OutstandingFeeMessagingActions row={outstandingFee} openComposer={openComposer} t={t} />
                  </TableCell>
                )}
              </MotionTableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
