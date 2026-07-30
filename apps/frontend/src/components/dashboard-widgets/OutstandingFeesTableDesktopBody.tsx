import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/ui/UserAvatar";
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
            <TableHead scope="col" className="text-start px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
              {t("hasanat.columns.redemption.student")}
            </TableHead>
            <TableHead scope="col" className="text-start px-3 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell h-auto select-none">
              {t("sessions.report.colClass")}
            </TableHead>
            <TableHead scope="col" className="text-start px-3 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
              {t("finance.columns.amount")}
            </TableHead>
            <TableHead scope="col" className="text-start px-3 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell h-auto select-none">
              {t("finance.metrics.overdue")}
            </TableHead>
            {canWriteMessaging && (
              <TableHead scope="col" className="px-3 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-end h-auto select-none">
                {t("hasanat.columns.actions")}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/40">
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canWriteMessaging ? 5 : 4} className="text-center py-8 text-xs text-muted-foreground select-none">
                {t("finance.report.noInvoicesMatch")}
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
