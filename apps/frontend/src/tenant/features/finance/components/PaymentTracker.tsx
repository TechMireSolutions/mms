import React from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { Payment } from '@/lib/data/financeData';
import { PAYMENT_METHOD_BADGE } from "@/lib/semanticTone";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { formatDate } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";



interface PaymentTrackerProps {
  payments: Payment[];
  isColumnVisible?: (key: string) => boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

export function PaymentTracker({
  payments,
  isColumnVisible,
  columnCustomizer,
}: PaymentTrackerProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  const paymentsByMethod = payments.reduce((amountByMethod, payment) => {
    amountByMethod[payment.method] = (amountByMethod[payment.method] || 0) + payment.amount;
    return amountByMethod;
  }, {} as Record<string, number>);

  const showDate = isColumnVisible ? isColumnVisible("date") : true;
  const showStudent = isColumnVisible ? isColumnVisible("student") : true;
  const showInvoice = isColumnVisible ? isColumnVisible("invoice") : true;
  const showAmount = isColumnVisible ? isColumnVisible("amount") : true;
  const showMethod = isColumnVisible ? isColumnVisible("method") : true;
  const showReceivedBy = isColumnVisible ? isColumnVisible("receivedBy") : true;
  const showNote = isColumnVisible ? isColumnVisible("note") : true;

  const visibleColCount =
    (showDate ? 1 : 0) +
    (showStudent ? 1 : 0) +
    (showInvoice ? 1 : 0) +
    (showAmount ? 1 : 0) +
    (showMethod ? 1 : 0) +
    (showReceivedBy ? 1 : 0) +
    (showNote ? 1 : 0);

  return (
    <section aria-label={t("finance.payments")} className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label={t("finance.paymentsByMethod")}>
        {Object.entries(paymentsByMethod).map(([method, amount]) => (
          <Card key={method} className="p-3">
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full border", PAYMENT_METHOD_BADGE[method] || PAYMENT_METHOD_BADGE.Other)}>{method}</span>
            <p className="text-[15px] font-bold text-foreground mt-2 m-0">{formatCurrency(amount)}</p>
            <p className="text-[10px] text-muted-foreground m-0">
              {t("finance.paymentCount", { count: payments.filter((payment) => payment.method === method).length })}
            </p>
          </Card>
        ))}
      </div>

      <Card accentColor="primary" className="p-0 overflow-hidden">
        <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between gap-3 pl-6.5">
          <div className="flex items-center gap-2 min-w-0">
            <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <h3 className="text-sm font-bold text-foreground m-0">{t("finance.paymentLog")}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold text-success">{t("finance.paymentTotal", { amount: formatCurrency(totalPaid) })}</span>
            {columnCustomizer && (
              <ModuleColumnCustomizer
                columnRegistry={columnCustomizer.columnRegistry}
                updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
                labels={columnCustomizer.labels}
              />
            )}
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{t("finance.paymentLog")}</caption>
            <thead>
              <tr className="border-b border-border/50">
                {showDate && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.paymentDate")}
                  </th>
                )}
                {showStudent && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.student")}
                  </th>
                )}
                {showInvoice && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.invoice")}
                  </th>
                )}
                {showAmount && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.amount")}
                  </th>
                )}
                {showMethod && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.method")}
                  </th>
                )}
                {showReceivedBy && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.receivedBy")}
                  </th>
                )}
                {showNote && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.note")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {payments.length === 0 ? (
                <tr><td colSpan={visibleColCount || 1} className="py-10 text-center text-sm text-muted-foreground">{t("finance.empty.payments")}</td></tr>
              ) : (
                payments.map((payment, index) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    {showDate && (
                      <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{formatDate(payment.date)}</td>
                    )}
                    {showStudent && (
                      <td className="px-4 py-3 text-[13px] font-semibold text-foreground whitespace-nowrap">{payment.studentName}</td>
                    )}
                    {showInvoice && (
                      <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{payment.invoiceId}</td>
                    )}
                    {showAmount && (
                      <td className="px-4 py-3 text-[13px] font-bold text-success whitespace-nowrap">{formatCurrency(payment.amount)}</td>
                    )}
                    {showMethod && (
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full border", PAYMENT_METHOD_BADGE[payment.method] || PAYMENT_METHOD_BADGE.Other)}>{payment.method}</span>
                      </td>
                    )}
                    {showReceivedBy && (
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{payment.receivedBy || "—"}</td>
                    )}
                    {showNote && (
                      <td className="px-4 py-3 text-[12px] text-muted-foreground max-w-[160px] truncate">{payment.note || "—"}</td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
