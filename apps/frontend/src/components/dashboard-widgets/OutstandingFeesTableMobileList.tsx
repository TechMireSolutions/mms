import { motion } from "framer-motion";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  OutstandingFeeMessagingActions,
  OutstandingFeeOverdueBadge,
  type OpenComposer,
} from "@/components/dashboard-widgets/OutstandingFeesTableParts";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export interface OutstandingFeeRow {
  id: string;
  studentId: string;
  student: string;
  class: string;
  amount: number;
  months: number;
  contact: string;
  email: string;
  dueDate: string;
}

interface OutstandingFeesTableMobileListProps {
  rows: OutstandingFeeRow[];
  canWriteMessaging: boolean;
  formatCurrency: (amount: number) => string;
  openComposer: OpenComposer;
  t: TranslationFunction;
}

export function OutstandingFeesTableMobileList({
  rows,
  canWriteMessaging,
  formatCurrency,
  openComposer,
  t,
}: OutstandingFeesTableMobileListProps) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground select-none">
        {t("finance.report.noInvoicesMatch")}
      </p>
    );
  }

  return (
    <>
      {rows.map((outstandingFee, index) => (
        <motion.article
          key={outstandingFee.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.04, duration: 0.25 }}
          className="space-y-3 rounded-xl border border-border bg-card p-3"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <UserAvatar id={outstandingFee.studentId} name={outstandingFee.student} className="w-7 h-7 rounded-full text-xs font-bold shrink-0" />
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold text-foreground m-0">{outstandingFee.student}</h4>
                {outstandingFee.class ? (
                  <p className="truncate text-xs text-muted-foreground m-0">{outstandingFee.class}</p>
                ) : null}
              </div>
            </div>
            <span className="shrink-0 text-sm font-bold text-destructive tabular-nums">{formatCurrency(outstandingFee.amount)}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
            <OutstandingFeeOverdueBadge months={outstandingFee.months} t={t} />
            {canWriteMessaging && (
              <OutstandingFeeMessagingActions row={outstandingFee} openComposer={openComposer} t={t} />
            )}
          </div>
        </motion.article>
      ))}
    </>
  );
}
