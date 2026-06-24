import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Phone, Send } from "lucide-react";
import type { Invoice } from '@/lib/data/financeData';
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { useStudentsByIds } from "../../hooks/useStudents";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import { Button } from "../ui/button";

/**
 * OutstandingFeesTable Component
 *
 * Displays a list of recent overdue payments and outstanding fees.
 * Includes quick actions for sending reminders or calling the contacts.
 *
 * @returns {React.ReactElement} The outstanding fees table widget.
 */
export default function OutstandingFeesTable({ title }: { title?: string }) {
  const invoices = useLiveCollection<Invoice>("finance_invoices", []);
  const unpaidInvoices = useMemo(
    () => invoices.filter((inv) => inv.status !== "paid" && inv.status !== "cancelled"),
    [invoices],
  );
  const studentIds = useMemo(
    () => uniqueRegistryIds(unpaidInvoices.map((inv) => inv.studentId)),
    [unpaidInvoices],
  );
  const { data: students = [] } = useStudentsByIds(studentIds);

  const list = unpaidInvoices
    .map((inv) => {
      const student = students.find((s) => String(s.id) === String(inv.studentId));
      const contact = student?.phone || "+92 300 1234567";
      const amount = inv.status === "partial" ? (inv.finalAmt - (inv.paidAmt || 0)) : inv.finalAmt;

      const due = new Date(inv.dueDate);
      const now = new Date();
      const diffMonths = Math.max(1, (now.getFullYear() - due.getFullYear()) * 12 + now.getMonth() - due.getMonth());

      return {
        id: inv.id,
        student: inv.studentName,
        class: inv.class,
        amount,
        months: diffMonths,
        contact,
      };
    })
    .slice(0, 5);
    
  const totalUnpaid = unpaidInvoices.length;

  return (
    <section aria-labelledby="outstanding-fees-heading" className="bg-card rounded-xl border border-border">
      <header className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-destructive" aria-hidden="true" />
          <h3 id="outstanding-fees-heading" className="text-sm font-semibold text-foreground m-0">
            {title || "Outstanding Payments"}
          </h3>
          <span className="text-[11px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full" aria-label={`${totalUnpaid} students with unpaid fees`}>
            {totalUnpaid} students
          </span>
        </div>
        <Button variant="link" className="text-[12px] font-semibold h-auto p-0">
          Send all reminders
        </Button>
      </header>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th scope="col" className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
              <th scope="col" className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Class</th>
              <th scope="col" className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
              <th scope="col" className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Overdue</th>
              <th scope="col" className="px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {list.map((fee, i) => (
              <motion.tr
                key={fee.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <span className="text-[10px] font-bold text-primary">
                        {fee.student.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <span className="text-[13px] font-medium text-foreground">{fee.student}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-[12px] text-muted-foreground hidden sm:table-cell">{fee.class}</td>
                <td className="px-3 py-3">
                  <span className="text-[13px] font-bold text-destructive">₨ {fee.amount.toLocaleString()}</span>
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    fee.months >= 3
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning"
                  }`}>
                    {fee.months} {fee.months === 1 ? "month" : "months"}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      aria-label={`Call ${fee.student}`}
                      title="Call"
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-none"
                    >
                      <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label={`Send reminder to ${fee.student}`}
                      title="Send reminder"
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shadow-none"
                    >
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="px-5 py-3 border-t border-border">
        <Button variant="link" className="text-xs font-medium h-auto p-0">
          View all outstanding payments
        </Button>
      </footer>
    </section>
  );
}
