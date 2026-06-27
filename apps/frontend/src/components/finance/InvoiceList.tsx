import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown, Eye, ReceiptText, X } from "lucide-react";
import { SearchBar } from "../ui/SearchBar";
import { EmptyState } from "../ui/EmptyState";
import { ModuleColumnCustomizer } from "../ui/ModuleColumnCustomizer";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";
import { INVOICE_STATUSES, Invoice } from '@/lib/data/financeData';
import type { AppTranslationKey, ModuleColumnRegistryEntry } from "@mms/shared";
import { Button } from "@/components/ui/button";

const fmt = (n: number) => `PKR ${Number(n).toLocaleString()}`;

interface ColumnCustomizerProps {
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (cols: ModuleColumnRegistryEntry[]) => void;
  labels: {
    trigger: string;
    title: string;
    visibleAndOrder: string;
    hidden: string;
    fixed: string;
    hideColumn: (label: string) => string;
  };
}

interface InvoiceListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onRecord: (invoice: Invoice) => void;
  isColumnVisible?: (key: string) => boolean;
  columnCustomizer?: ColumnCustomizerProps;
}

export function InvoiceList({
  invoices,
  onView,
  onRecord,
  isColumnVisible,
  columnCustomizer,
}: InvoiceListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  const statusLabel = (status: string) => {
    const key = `finance.invoiceStatus.${status}` as AppTranslationKey;
    return t(key);
  };

  const statusCls: Record<string, string> = {
    paid: "bg-success/10 text-success border-success/20",
    pending: "bg-warning/10 text-warning border-warning/20",
    overdue: "bg-destructive/10 text-destructive border-destructive/20",
    partial: "bg-info/10 text-info border-info/20",
    cancelled: "bg-muted text-muted-foreground border-border",
  };

  const showInvoice = isColumnVisible ? isColumnVisible("invoice") : true;
  const showStudent = isColumnVisible ? isColumnVisible("student") : true;
  const showSessionClass = isColumnVisible ? isColumnVisible("sessionClass") : true;
  const showBaseFee = isColumnVisible ? isColumnVisible("baseFee") : true;
  const showDiscount = isColumnVisible ? isColumnVisible("discount") : true;
  const showFinal = isColumnVisible ? isColumnVisible("final") : true;
  const showStatus = isColumnVisible ? isColumnVisible("status") : true;
  const showDueDate = isColumnVisible ? isColumnVisible("dueDate") : true;

  const visibleColCount =
    (showInvoice ? 1 : 0) +
    (showStudent ? 1 : 0) +
    (showSessionClass ? 1 : 0) +
    (showBaseFee ? 1 : 0) +
    (showDiscount ? 1 : 0) +
    (showFinal ? 1 : 0) +
    (showStatus ? 1 : 0) +
    (showDueDate ? 1 : 0) +
    1;

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
    <section aria-label={t("finance.invoices")} className="space-y-4">
      <header className="flex gap-3 flex-col sm:flex-row">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder={t("finance.searchInvoices")} className="w-full" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${filterStatus.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}>
              <Filter className="w-3.5 h-3.5" aria-hidden="true" /> {t("finance.filter.status")}
              {filterStatus.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{filterStatus.length}</span>}
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">{t("finance.filter.status")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {INVOICE_STATUSES.map((s) => (
              <DropdownMenuCheckboxItem key={s} checked={filterStatus.includes(s)} onCheckedChange={() => toggleStatus(s)}>
                {statusLabel(s)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {columnCustomizer && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
      </header>

      <AnimatePresence>
        {filterStatus.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex gap-2 flex-wrap" aria-label={t("finance.filter.active")}>
            {filterStatus.map((s) => (
              <Button key={s} onClick={() => toggleStatus(s)} aria-label={t("finance.filter.remove", { label: statusLabel(s) })} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {statusLabel(s)} <X className="w-3 h-3" aria-hidden="true" />
              </Button>
            ))}
            <Button variant="link" onClick={() => setFilterStatus([])} className="text-xs text-muted-foreground hover:text-foreground underline p-0 h-auto">{t("contacts.clearFilters")}</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{t("finance.invoices")}</caption>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {showInvoice && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.invoice")}
                  </th>
                )}
                {showStudent && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.student")}
                  </th>
                )}
                {showSessionClass && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.sessionClass")}
                  </th>
                )}
                {showBaseFee && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.baseFee")}
                  </th>
                )}
                {showDiscount && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.discount")}
                  </th>
                )}
                {showFinal && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.final")}
                  </th>
                )}
                {showStatus && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.status")}
                  </th>
                )}
                {showDueDate && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.dueDate")}
                  </th>
                )}
                <th scope="col" className="px-4 py-2.5 w-10">
                  <span className="sr-only">{t("common.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={visibleColCount} className="py-4"><EmptyState icon={ReceiptText} title={t("finance.empty.invoicesTitle")} description={t("finance.empty.invoicesSubtitle")} compact /></td></tr>
              ) : (
                filtered.map((inv, i) => {
                  const cls = statusCls[inv.status] || statusCls.pending;
                  return (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      {showInvoice && (
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-mono font-semibold text-muted-foreground">{inv.id}</span>
                        </td>
                      )}
                      {showStudent && (
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-semibold text-foreground whitespace-nowrap m-0">{inv.studentName}</p>
                        </td>
                      )}
                      {showSessionClass && (
                        <td className="px-4 py-3">
                          <p className="text-[12px] text-foreground m-0">{inv.class}</p>
                          <p className="text-[10px] text-muted-foreground m-0">{inv.session}</p>
                        </td>
                      )}
                      {showBaseFee && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[12px] text-foreground">{fmt(inv.baseFee)}</span>
                        </td>
                      )}
                      {showDiscount && (
                        <td className="px-4 py-3">
                          {inv.discountAmt > 0 ? (
                            <div>
                              <span className="text-[12px] text-warning font-medium">-{fmt(inv.discountAmt)}</span>
                              <p className="text-[10px] text-muted-foreground m-0">{inv.discountType}</p>
                            </div>
                          ) : <span className="text-[12px] text-muted-foreground">—</span>}
                        </td>
                      )}
                      {showFinal && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[13px] font-bold text-foreground">{fmt(inv.finalAmt)}</span>
                          {inv.paidAmt && inv.status === "partial" && (
                            <p className="text-[10px] text-info m-0">{t("finance.paidAmount", { amount: fmt(inv.paidAmt) })}</p>
                          )}
                        </td>
                      )}
                      {showStatus && (
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{statusLabel(inv.status)}</span>
                        </td>
                      )}
                      {showDueDate && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[12px] ${inv.status === "overdue" ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{inv.dueDate}</span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" onClick={() => onView(inv)} aria-label={t("finance.viewInvoice", { id: inv.id })} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                          {inv.status !== "paid" && (
                            <Button variant="ghost" onClick={() => onRecord(inv)} aria-label={t("finance.recordPaymentFor", { id: inv.id })} className="p-1.5 rounded-lg hover:bg-success/10 text-muted-foreground hover:text-success transition-colors">
                              <ReceiptText className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
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
