import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown, Eye, ReceiptText, X } from "lucide-react";
import SearchBar from "../ui/SearchBar";
import EmptyState from "../ui/EmptyState";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { INVOICE_STATUSES, Invoice } from '@/lib/data/financeData';

const STATUS_CFG: Record<string, { label: string, cls: string }> = {
  paid:      { label: "Paid",      cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  pending:   { label: "Pending",   cls: "bg-amber-50 text-amber-700 border-amber-100" },
  overdue:   { label: "Overdue",   cls: "bg-red-50 text-red-600 border-red-100" },
  partial:   { label: "Partial",   cls: "bg-blue-50 text-blue-700 border-blue-100" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground border-border" },
};

const fmt = (n: number) => `PKR ${Number(n).toLocaleString()}`;

interface InvoiceListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onRecord: (invoice: Invoice) => void;
}

/**
 * InvoiceList Component
 * 
 * Displays a filterable and searchable list of invoices.
 * 
 * @param {InvoiceListProps} props - The component props.
 * @returns {React.ReactElement}
 */
export default function InvoiceList({ invoices, onView, onRecord }: InvoiceListProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const q = search.toLowerCase();
      const matchSearch = !q || inv.studentName.toLowerCase().includes(q) || inv.id.toLowerCase().includes(q) || inv.session.toLowerCase().includes(q);
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(inv.status);
      return matchSearch && matchStatus;
    });
  }, [invoices, search, filterStatus]);

  const toggleStatus = (s: string) => setFilterStatus((l) => l.includes(s) ? l.filter((x) => x !== s) : [...l, s]);

  return (
    <section aria-label="Invoice List" className="space-y-4">
      {/* Search + filter row */}
      <header className="flex gap-3 flex-col sm:flex-row">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search invoices…" className="w-full" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${filterStatus.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}>
              <Filter className="w-3.5 h-3.5" aria-hidden="true" /> Status
              {filterStatus.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{filterStatus.length}</span>}
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {INVOICE_STATUSES.map((s) => (
              <DropdownMenuCheckboxItem key={s} checked={filterStatus.includes(s)} onCheckedChange={() => toggleStatus(s)}>
                {STATUS_CFG[s]?.label || s}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Active chips */}
      <AnimatePresence>
        {filterStatus.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex gap-2 flex-wrap" aria-label="Active Filters">
            {filterStatus.map((s) => (
              <button key={s} onClick={() => toggleStatus(s)} aria-label={`Remove filter ${STATUS_CFG[s]?.label}`} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {STATUS_CFG[s]?.label} <X className="w-3 h-3" aria-hidden="true" />
              </button>
            ))}
            <button onClick={() => setFilterStatus([])} className="text-xs text-muted-foreground hover:text-foreground underline">Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Invoices</caption>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Invoice", "Student", "Session / Class", "Base Fee", "Discount", "Final", "Status", "Due Date", "Actions"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h === "Actions" ? <span className="sr-only">{h}</span> : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-4"><EmptyState icon={ReceiptText} title="No invoices found" description="Try adjusting your search or filters." compact /></td></tr>
              ) : (
                filtered.map((inv, i) => {
                  const sCfg = STATUS_CFG[inv.status] || STATUS_CFG.pending;
                  return (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono font-semibold text-muted-foreground">{inv.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-semibold text-foreground whitespace-nowrap m-0">{inv.studentName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[12px] text-foreground m-0">{inv.class}</p>
                        <p className="text-[10px] text-muted-foreground m-0">{inv.session}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[12px] text-foreground">{fmt(inv.baseFee)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {inv.discountAmt > 0 ? (
                          <div>
                            <span className="text-[12px] text-amber-600 font-medium">-{fmt(inv.discountAmt)}</span>
                            <p className="text-[10px] text-muted-foreground m-0">{inv.discountType}</p>
                          </div>
                        ) : <span className="text-[12px] text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[13px] font-bold text-foreground">{fmt(inv.finalAmt)}</span>
                        {inv.paidAmt && inv.status === "partial" && (
                          <p className="text-[10px] text-blue-600 m-0">Paid: {fmt(inv.paidAmt)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sCfg.cls}`}>{sCfg.label}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[12px] ${inv.status === "overdue" ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>{inv.dueDate}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onView(inv)} aria-label={`View Invoice ${inv.id}`} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="View">
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          {inv.status !== "paid" && (
                            <button onClick={() => onRecord(inv)} aria-label={`Record Payment for ${inv.id}`} className="p-1.5 rounded-lg hover:bg-emerald-50 text-muted-foreground hover:text-emerald-700 transition-colors" title="Record Payment">
                              <ReceiptText className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
