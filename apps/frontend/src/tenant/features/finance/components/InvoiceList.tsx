import React, { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown, Eye, ReceiptText, X, MessageCircle, MessageSquare, Trash2, RotateCcw } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";
import { INVOICE_STATUSES, Invoice } from '@/lib/data/financeData';
import { Button } from "@/components/ui/button";
import { formatDate, getOutstandingAmountForInvoice, type AppTranslationKey } from "@mms/shared";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";

const MessageComposer = React.lazy(() => import("@/components/ui/MessageComposer"));



interface InvoiceListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onRecord: (invoice: Invoice) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  canWriteMessaging?: boolean;
  showDeleted?: boolean;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  selectionResetKey?: string;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

export function InvoiceList({
  invoices,
  onView,
  onRecord,
  canWrite = true,
  canDelete = false,
  canWriteMessaging = false,
  showDeleted = false,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  selectionResetKey,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
}: InvoiceListProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  useEffect(() => setSelectedIds([]), [selectionResetKey, showDeleted]);

  const statusLabel = (status: string) => {
    const key = `finance.invoiceStatus.${status}` as AppTranslationKey;
    return t(key);
  };

  const statusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    paid:      { label: t("finance.invoiceStatus.paid"),      cls: SEMANTIC_BADGE.success },
    pending:   { label: t("finance.invoiceStatus.pending"),   cls: SEMANTIC_BADGE.warning },
    overdue:   { label: t("finance.invoiceStatus.overdue"),   cls: SEMANTIC_BADGE.destructive },
    partial:   { label: t("finance.invoiceStatus.partial"),   cls: SEMANTIC_BADGE.info },
    cancelled: { label: t("finance.invoiceStatus.cancelled"), cls: SEMANTIC_BADGE.muted },
  }), [t]);

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
    (canDelete ? 1 : 0) +
    1;

  const filtered = useMemo(() => {
    return invoices.filter((invoice) => {
      const normalizedSearch = search.toLowerCase();
      const matchSearch = !normalizedSearch
        || invoice.studentName.toLowerCase().includes(normalizedSearch)
        || invoice.id.toLowerCase().includes(normalizedSearch)
        || invoice.session.toLowerCase().includes(normalizedSearch);
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(invoice.status);
      return matchSearch && matchStatus;
    });
  }, [invoices, search, filterStatus]);
  const allSelected = filtered.length > 0 && filtered.every((invoice) => selectedIds.includes(invoice.id));

  const toggleStatus = (status: string) => setFilterStatus((currentStatuses) => currentStatuses.includes(status)
    ? currentStatuses.filter((selectedStatus) => selectedStatus !== status)
    : [...currentStatuses, status]);

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
              {filterStatus.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{filterStatus.length}</span>}
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">{t("finance.filter.status")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {INVOICE_STATUSES.map((status) => (
              <DropdownMenuCheckboxItem key={status} checked={filterStatus.includes(status)} onCheckedChange={() => toggleStatus(status)}>
                {statusLabel(status)}
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
            {filterStatus.map((status) => (
              <Button key={status} onClick={() => toggleStatus(status)} aria-label={t("finance.filter.remove", { label: statusLabel(status) })} className="flex min-h-11 items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {statusLabel(status)} <X className="w-3 h-3" aria-hidden="true" />
              </Button>
            ))}
            <Button variant="link" onClick={() => setFilterStatus([])} className="text-xs text-muted-foreground hover:text-foreground underline min-h-11 px-2">{t("contacts.clearFilters")}</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {canDelete && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium">{t("finance.trash.selected", { count: selectedIds.length })}</span>
          <Button type="button" variant={showDeleted ? "outline" : "destructive"} onClick={() => setConfirmBulkOpen(true)}>
            {showDeleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
            {showDeleted ? t("finance.trash.restore") : t("common.delete")}
          </Button>
        </div>
      )}

      <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm border-border/80 shadow-sm">
        <div className="space-y-3 p-3 md:hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={ReceiptText} title={t("finance.empty.invoicesTitle")} description={t("finance.empty.invoicesSubtitle")} compact />
          ) : (
            filtered.map((invoice, index) => {
              const invRec = invoice as unknown as Record<string, unknown>;
              const phone = typeof invRec.phone === "string" ? invRec.phone.trim() : "";
              const email = typeof invRec.email === "string" ? invRec.email : undefined;
              const amount = getOutstandingAmountForInvoice(invoice);
              const recipient = {
                id: invoice.id,
                name: invoice.studentName,
                phone,
                email,
                amount,
                dueDate: invoice.dueDate,
              };
              return (
                <motion.article
                  key={invoice.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="space-y-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      {showStudent && <h4 className="truncate text-sm font-semibold text-foreground">{invoice.studentName}</h4>}
                      {showInvoice && <p className="truncate font-mono text-xs text-muted-foreground">{invoice.id}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {showFinal && <span className="text-sm font-bold text-foreground">{formatCurrency(invoice.finalAmt)}</span>}
                      {showStatus && <StatusBadge status={invoice.status} config={statusConfig} size="sm" />}
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    {showSessionClass && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.sessionClass")}</dt>
                        <dd className="text-foreground">{invoice.class}</dd>
                        <dd className="text-xs text-muted-foreground">{invoice.session}</dd>
                      </div>
                    )}
                    {showBaseFee && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.baseFee")}</dt>
                        <dd className="text-foreground">{formatCurrency(invoice.baseFee)}</dd>
                      </div>
                    )}
                    {showDiscount && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.discount")}</dt>
                        <dd className="text-foreground">
                          {invoice.discountAmt > 0 ? `-${formatCurrency(invoice.discountAmt)}` : "—"}
                        </dd>
                        {invoice.discountAmt > 0 ? <dd className="text-xs text-muted-foreground">{invoice.discountType}</dd> : null}
                      </div>
                    )}
                    {showDueDate && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.dueDate")}</dt>
                        <dd className={invoice.status === "overdue" ? "font-semibold text-destructive" : "text-foreground"}>
                          {formatDate(invoice.dueDate)}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                    {canDelete ? (
                      <Checkbox
                        checked={selectedIds.includes(invoice.id)}
                        onCheckedChange={(checked) => setSelectedIds((ids) => checked ? [...ids, invoice.id] : ids.filter((id) => id !== invoice.id))}
                        aria-label={t("finance.trash.selectInvoice", { id: invoice.id })}
                      />
                    ) : <span />}
                    <div className="flex flex-wrap items-center gap-1">
                      {canWriteMessaging && !showDeleted && phone ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openComposer("whatsapp", [recipient])}
                            title={t("messaging.sendWhatsapp")}
                            aria-label={t("messaging.sendWhatsapp")}
                            className="rounded-lg hover:bg-muted text-success hover:text-success transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openComposer("sms", [recipient])}
                            title={t("messaging.sendSms")}
                            aria-label={t("messaging.sendSms")}
                            className="rounded-lg hover:bg-muted text-info hover:text-info transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                        </>
                      ) : null}
                      <Button variant="ghost" size="icon" onClick={() => onView(invoice)} aria-label={t("finance.viewInvoice", { id: invoice.id })} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                      {canWrite && !showDeleted && invoice.status !== "paid" && (
                        <Button variant="ghost" size="icon" onClick={() => onRecord(invoice)} aria-label={t("finance.recordPaymentFor", { id: invoice.id })} className="rounded-lg hover:bg-success/10 text-muted-foreground hover:text-success transition-colors">
                          <ReceiptText className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>
                      )}
                      {canDelete && (showDeleted ? onRestore : onDelete) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => showDeleted ? onRestore?.(invoice.id) : setPendingDeleteId(invoice.id)}
                          aria-label={showDeleted ? t("finance.trash.restore") : t("common.delete")}
                        >
                          {showDeleted ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm table-fixed">
            <caption className="sr-only">{t("finance.invoices")}</caption>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {canDelete && (
                  <th scope="col" className="w-10 px-3 py-2.5">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => setSelectedIds(checked ? filtered.map((invoice) => invoice.id) : [])}
                      aria-label={t("finance.trash.selectAll")}
                    />
                  </th>
                )}
                {showInvoice && (
                  <ResizableTableHead columnKey="invoice" width={getColumnWidth?.("invoice")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.invoice")}
                  </ResizableTableHead>
                )}
                {showStudent && (
                  <ResizableTableHead columnKey="student" width={getColumnWidth?.("student")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.student")}
                  </ResizableTableHead>
                )}
                {showSessionClass && (
                  <ResizableTableHead columnKey="sessionClass" width={getColumnWidth?.("sessionClass")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.sessionClass")}
                  </ResizableTableHead>
                )}
                {showBaseFee && (
                  <ResizableTableHead columnKey="baseFee" width={getColumnWidth?.("baseFee")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.baseFee")}
                  </ResizableTableHead>
                )}
                {showDiscount && (
                  <ResizableTableHead columnKey="discount" width={getColumnWidth?.("discount")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.discount")}
                  </ResizableTableHead>
                )}
                {showFinal && (
                  <ResizableTableHead columnKey="final" width={getColumnWidth?.("final")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.final")}
                  </ResizableTableHead>
                )}
                {showStatus && (
                  <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.status")}
                  </ResizableTableHead>
                )}
                {showDueDate && (
                  <ResizableTableHead columnKey="dueDate" width={getColumnWidth?.("dueDate")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.dueDate")}
                  </ResizableTableHead>
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
                filtered.map((invoice, index) => {
                  return (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      {canDelete && (
                        <td className="px-3 py-3">
                          <Checkbox
                            checked={selectedIds.includes(invoice.id)}
                            onCheckedChange={(checked) => setSelectedIds((ids) => checked ? [...ids, invoice.id] : ids.filter((id) => id !== invoice.id))}
                            aria-label={t("finance.trash.selectInvoice", { id: invoice.id })}
                          />
                        </td>
                      )}
                      {showInvoice && (
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono font-semibold text-muted-foreground">{invoice.id}</span>
                        </td>
                      )}
                      {showStudent && (
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-foreground whitespace-nowrap m-0">{invoice.studentName}</p>
                        </td>
                      )}
                      {showSessionClass && (
                        <td className="px-4 py-3">
                          <p className="text-sm text-foreground m-0">{invoice.class}</p>
                          <p className="text-xs text-muted-foreground m-0">{invoice.session}</p>
                        </td>
                      )}
                      {showBaseFee && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-foreground">{formatCurrency(invoice.baseFee)}</span>
                        </td>
                      )}
                      {showDiscount && (
                        <td className="px-4 py-3">
                          {invoice.discountAmt > 0 ? (
                            <div>
                              <span className="text-sm text-warning font-medium">-{formatCurrency(invoice.discountAmt)}</span>
                              <p className="text-xs text-muted-foreground m-0">{invoice.discountType}</p>
                            </div>
                          ) : <span className="text-sm text-muted-foreground">—</span>}
                        </td>
                      )}
                      {showFinal && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-bold text-foreground">{formatCurrency(invoice.finalAmt)}</span>
                          {invoice.paidAmt && invoice.status === "partial" && (
                            <p className="text-xs text-info m-0">{t("finance.paidAmount", { amount: formatCurrency(invoice.paidAmt) })}</p>
                          )}
                        </td>
                      )}
                      {showStatus && (
                        <td className="px-4 py-3">
                          <StatusBadge status={invoice.status} config={statusConfig} size="sm" />
                        </td>
                      )}
                      {showDueDate && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-sm ${invoice.status === "overdue" ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{formatDate(invoice.dueDate)}</span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        {(() => {
                          const invRec = invoice as unknown as Record<string, unknown>;
                          const phone = typeof invRec.phone === "string" ? invRec.phone.trim() : "";
                          const email = typeof invRec.email === "string" ? invRec.email : undefined;
                          const amount = getOutstandingAmountForInvoice(invoice);
                          const recipient = {
                            id: invoice.id,
                            name: invoice.studentName,
                            phone,
                            email,
                            amount,
                            dueDate: invoice.dueDate,
                          };
                          return (
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                              {canWriteMessaging && !showDeleted && phone ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openComposer("whatsapp", [recipient])}
                                    title={t("messaging.sendWhatsapp")}
                                    aria-label={t("messaging.sendWhatsapp")}
                                    className="rounded-lg hover:bg-muted text-success hover:text-success transition-colors"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openComposer("sms", [recipient])}
                                    title={t("messaging.sendSms")}
                                    aria-label={t("messaging.sendSms")}
                                    className="rounded-lg hover:bg-muted text-info hover:text-info transition-colors"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                                  </Button>
                                </>
                              ) : null}
                              <Button variant="ghost" size="icon" onClick={() => onView(invoice)} aria-label={t("finance.viewInvoice", { id: invoice.id })} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                              {canWrite && !showDeleted && invoice.status !== "paid" && (
                                <Button variant="ghost" size="icon" onClick={() => onRecord(invoice)} aria-label={t("finance.recordPaymentFor", { id: invoice.id })} className="rounded-lg hover:bg-success/10 text-muted-foreground hover:text-success transition-colors">
                                  <ReceiptText className="w-3.5 h-3.5" aria-hidden="true" />
                                </Button>
                              )}
                              {canDelete && (showDeleted ? onRestore : onDelete) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => showDeleted ? onRestore?.(invoice.id) : setPendingDeleteId(invoice.id)}
                                  aria-label={showDeleted ? t("finance.trash.restore") : t("common.delete")}
                                >
                                  {showDeleted ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </Button>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Message Composer Modal */}
      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </React.Suspense>
      )}
      <ConfirmAlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
        title={t("finance.trash.deleteTitle")}
        description={t("finance.trash.deleteInvoiceConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          if (pendingDeleteId) onDelete?.(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
      <ConfirmAlertDialog
        open={confirmBulkOpen}
        onOpenChange={setConfirmBulkOpen}
        title={showDeleted ? t("finance.trash.restore") : t("finance.trash.deleteTitle")}
        description={t(showDeleted ? "finance.trash.bulkRestoreConfirm" : "finance.trash.bulkDeleteConfirm", { count: selectedIds.length })}
        confirmLabel={showDeleted ? t("finance.trash.restore") : t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          if (showDeleted) onBulkRestore?.(selectedIds);
          else onBulkDelete?.(selectedIds);
          setSelectedIds([]);
          setConfirmBulkOpen(false);
        }}
      />
    </section>
  );
}
