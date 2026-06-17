import React from "react";
import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { Payment } from '@/lib/data/financeData';

const METHOD_COLORS: Record<string, string> = {
  "Cash":          "bg-success/10 text-success border-success/20",
  "Bank Transfer": "bg-info/10 text-info border-info/20",
  "Online":        "bg-primary/10 text-primary border-primary/20",
  "Cheque":        "bg-warning/10 text-warning border-warning/20",
  "Other":         "bg-muted text-muted-foreground border-border",
};

const fmt = (n: number) => `PKR ${Number(n).toLocaleString()}`;

interface PaymentTrackerProps {
  payments: Payment[];
}

/**
 * PaymentTracker Component
 * 
 * Displays a summary of payments by method and a detailed log of all payments.
 * 
 * @param {PaymentTrackerProps} props - The component props.
 * @returns {React.ReactElement}
 */
export default function PaymentTracker({ payments }: PaymentTrackerProps) {
  const total = payments.reduce((s, p) => s + p.amount, 0);

  const byMethod = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <section aria-label="Payment Tracker" className="space-y-4">
      {/* Method breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Payments by Method">
        {Object.entries(byMethod).map(([method, amount]) => (
          <article key={method} className="rounded-xl border border-border bg-card p-3">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${METHOD_COLORS[method] || METHOD_COLORS.Other}`}>{method}</span>
            <p className="text-[15px] font-bold text-foreground mt-2 m-0">{fmt(amount)}</p>
            <p className="text-[10px] text-muted-foreground m-0">{payments.filter((p) => p.method === method).length} payment{payments.filter((p) => p.method === method).length !== 1 ? "s" : ""}</p>
          </article>
        ))}
      </div>

      {/* Payment log */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <header className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="text-sm font-bold text-foreground m-0">Payment Log</h3>
          </div>
          <span className="text-[11px] font-semibold text-success">{fmt(total)} total</span>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Payment Log Entries</caption>
            <thead>
              <tr className="border-b border-border/50">
                {["Date", "Student", "Invoice", "Amount", "Method", "Received By", "Note"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {payments.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No payments recorded</td></tr>
              ) : (
                payments.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{p.date}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-foreground whitespace-nowrap">{p.studentName}</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{p.invoiceId}</td>
                    <td className="px-4 py-3 text-[13px] font-bold text-success whitespace-nowrap">{fmt(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${METHOD_COLORS[p.method] || METHOD_COLORS.Other}`}>{p.method}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">{p.receivedBy || "—"}</td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">{p.note || "—"}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
