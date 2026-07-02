import React, { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Bell, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { ROUTES } from "@/lib/config/routes";
import { Button } from "../ui/button";

export interface OverdueStudent {
  id: number;
  name: string;
  obligationType: string;
  dueDate: string;
  amount: number;
  currency: string;
  daysOverdue: number;
}

const DEFAULT_OVERDUE_STUDENTS: OverdueStudent[] = [
  { id: 1, name: "Ahmad Raza",       obligationType: "Khums",   dueDate: "2026-04-01", amount: 12000, currency: "PKR", daysOverdue: 48 },
  { id: 2, name: "Fatima Noor",      obligationType: "Zakat",   dueDate: "2026-04-10", amount: 8500,  currency: "PKR", daysOverdue: 39 },
  { id: 3, name: "Hassan Ali",       obligationType: "Khums",   dueDate: "2026-04-15", amount: 30000, currency: "PKR", daysOverdue: 34 },
  { id: 4, name: "Zainab Hussain",   obligationType: "Fidya",   dueDate: "2026-04-22", amount: 3200,  currency: "PKR", daysOverdue: 27 },
  { id: 5, name: "Ibrahim Khalid",   obligationType: "Kaffarah",dueDate: "2026-04-28", amount: 15000, currency: "PKR", daysOverdue: 21 },
  { id: 6, name: "Maryam Tahir",     obligationType: "Zakat",   dueDate: "2026-05-01", amount: 6000,  currency: "PKR", daysOverdue: 18 },
  { id: 7, name: "Ali Mustafa",      obligationType: "Khums",   dueDate: "2026-05-05", amount: 22500, currency: "PKR", daysOverdue: 14 },
  { id: 8, name: "Sara Jaffery",     obligationType: "Fidya",   dueDate: "2026-05-10", amount: 1800,  currency: "PKR", daysOverdue: 9  },
];

interface UrgencyBadge {
  label: string;
  cls: string;
}

function urgencyBadge(days: number): UrgencyBadge {
  if (days >= 30) return { label: "Critical", cls: "bg-destructive/15 text-destructive border-destructive/30" };
  if (days >= 14) return { label: "High",     cls: "bg-warning/15 text-warning border-warning/30" };
  return              { label: "Moderate",    cls: "bg-warning/15 text-warning border-warning/30" };
}

/**
 * OverdueObligationsWidget Component
 *
 * Displays a list of overdue obligations requiring follow-up, along with a
 * quick action to send out reminder notifications.
 *
 * @returns {React.ReactElement} The overdue obligations widget.
 */
export default function OverdueObligationsWidget({ title }: { title?: string }) {
  const overdueStudents = useLiveCollection<OverdueStudent>("overdue_obligations", DEFAULT_OVERDUE_STUDENTS);

  const [expanded, setExpanded] = useState(true);
  const [remindedIds, setRemindedIds] = useState<Set<number>>(new Set());

  const totalOverdue = overdueStudents.reduce((sum, overdueStudent) => sum + overdueStudent.amount, 0);

  const handleRemind = (id: number) => {
    setRemindedIds((prev) => new Set([...prev, id]));
  };

  const handleRemindAll = () => {
    setRemindedIds(new Set(overdueStudents.map((overdueStudent) => overdueStudent.id)));
  };

  return (
    <section aria-labelledby="overdue-obligations-heading" className="relative overflow-hidden group/overdue rounded-2xl border border-destructive/30 bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive/50 transition-colors group-hover/overdue:bg-destructive" />
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-destructive/10 border-b border-destructive/30 pl-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center" aria-hidden="true">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <h3 id="overdue-obligations-heading" className="text-sm font-bold text-destructive m-0">
              {title || "Overdue Obligations"}
            </h3>
            <p className="text-xs text-destructive m-0">
              {overdueStudents.length} students · PKR {totalOverdue.toLocaleString()} outstanding
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={handleRemindAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors h-auto"
          >
            <Bell className="w-3 h-3" aria-hidden="true" />
            Remind All
          </Button>
          <Button
            variant="ghost"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label="Toggle overdue obligations list"
            className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/15 text-destructive hover:text-destructive transition-colors shadow-none"
          >
            {expanded ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
          </Button>
        </div>
      </header>

      {/* Table */}
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Student</th>
                <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Obligation</th>
                <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Due Date</th>
                <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Amount</th>
                <th scope="col" className="px-3 py-2.5 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Status</th>
                <th scope="col" className="px-3 py-2.5 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {overdueStudents.map((overdueStudent) => {
                const badge = urgencyBadge(overdueStudent.daysOverdue);
                const reminded = remindedIds.has(overdueStudent.id);
                return (
                  <tr key={overdueStudent.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                          <span className="text-[10px] font-bold text-primary">
                            {overdueStudent.name.split(" ").map((namePart) => namePart[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <span className="font-medium text-foreground text-xs">{overdueStudent.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <Scale className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                        <span className="text-xs text-foreground">{overdueStudent.obligationType}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div>
                        <p className="text-xs text-foreground m-0">{overdueStudent.dueDate}</p>
                        <p className="text-[10px] text-destructive font-semibold m-0">{overdueStudent.daysOverdue}d overdue</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-xs font-bold text-foreground">
                        {overdueStudent.currency} {overdueStudent.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleRemind(overdueStudent.id)}
                        disabled={reminded}
                        aria-label={reminded ? `Reminder sent to ${overdueStudent.name}` : `Send reminder to ${overdueStudent.name}`}
                        className={`flex items-center gap-1 mx-auto px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors h-auto shadow-none ${
                          reminded
                            ? "bg-success/10 text-success border border-success/30 cursor-default hover:bg-success/10 hover:text-success"
                            : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:text-primary"
                        }`}
                      >
                        <Bell className="w-2.5 h-2.5" aria-hidden="true" />
                        {reminded ? "Sent" : "Remind"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer */}
          <footer className="px-4 py-2.5 border-t border-border flex items-center justify-between bg-muted/20">
            <p className="text-xs text-muted-foreground m-0">
              {remindedIds.size > 0 && `${remindedIds.size} reminder${remindedIds.size > 1 ? "s" : ""} sent`}
            </p>
            <Link to={ROUTES.obligations} className="text-xs font-semibold text-primary hover:underline">
              View Obligations →
            </Link>
          </footer>
        </div>
      )}
    </section>
  );
}
