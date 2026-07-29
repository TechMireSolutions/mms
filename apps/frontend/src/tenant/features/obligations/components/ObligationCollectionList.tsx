import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from "react";
import { Plus, Eye, Search, Receipt, Printer, MessageSquare, MessageCircle, Trash2, RotateCcw, Archive } from "lucide-react";
import {
  ObligationCollection, ObligationType, MujtahidRep, Mujtahid
} from '@/lib/data/obligationsData';
import { DEFAULT_CURRENCIES, formatMoney, formatDate } from '@mms/shared';
import { useDebounce } from "@/hooks/useDebounce";
import { useMergedObligationContacts } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";

const PrintInvoiceModal = lazy(() => import("@/tenant/features/obligations/components/invoice/PrintInvoiceModal").then((module) => ({ default: module.PrintInvoiceModal })));

export interface ObligationCollectionListProps {
  collections: ObligationCollection[];
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  onAddNew: () => void;
  onView: (collection: ObligationCollection) => void;
  onFilteredCountChange?: (count: number) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  onToggleShowDeleted?: () => void;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onMessage?: (channel: 'sms' | 'whatsapp' | 'email', collections: ObligationCollection[]) => void;
}

export function ObligationCollectionList({
  collections,
  obligationTypes,
  reps,
  mujtahids,
  onAddNew,
  onView,
  onFilteredCountChange,
  canWrite = true,
  canDelete = true,
  showDeleted = false,
  onToggleShowDeleted,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
  onMessage,
}: ObligationCollectionListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const currencies = DEFAULT_CURRENCIES;
  const [typeFilter, setTypeFilter] = useState("all");
  const [printCollection, setPrintCollection] = useState<ObligationCollection | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const debouncedSearch = useDebounce(search, 300);
  const senderIds = useMemo(() => collections.map((collection) => collection.sender_id), [collections]);
  const contacts = useMergedObligationContacts(senderIds);

  useEffect(() => {
    setSelectedIds([]);
  }, [showDeleted]);

  const getContact = useCallback((contactId?: string | number | null) => contacts.find((contact) => String(contact.id) === String(contactId)), [contacts]);
  const getRep = (repId: string) => reps.find((rep) => rep.id === repId);
  const getMujtahid = (repId: string) => {
    const rep = getRep(repId);
    return rep ? mujtahids.find((mujtahid) => mujtahid.id === rep.mujtahid_id) : null;
  };
  const getObType = (obligationTypeId: string) => obligationTypes.find((obligationType) => obligationType.id === obligationTypeId);

  const filtered = useMemo(() => collections.filter((collection) => {
    if (typeFilter !== "all" && collection.obligation_type_id !== typeFilter) return false;
    if (debouncedSearch) {
      const searchQuery = debouncedSearch.toLowerCase();
      const sender = getContact(collection.sender_id)?.name?.toLowerCase() || "";
      const receipt = collection.receipt_no.toLowerCase();
      if (!sender.includes(searchQuery) && !receipt.includes(searchQuery)) return false;
    }
    return true;
  }), [collections, debouncedSearch, typeFilter, getContact]);

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  const showReceiptNo = isColumnVisible ? isColumnVisible("receiptNo") : true;
  const showReceivedDate = isColumnVisible ? isColumnVisible("receivedDate") : true;
  const showSender = isColumnVisible ? isColumnVisible("sender") : true;
  const showObligationType = isColumnVisible ? isColumnVisible("obligationType") : true;
  const showRepMujtahid = isColumnVisible ? isColumnVisible("repMujtahid") : true;
  const showAmount = isColumnVisible ? isColumnVisible("amount") : true;
  const showPaymentMode = isColumnVisible ? isColumnVisible("paymentMode") : true;

  const paymentModeConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    Cash: { label: t("obligations.paymentMode.cash"), cls: SEMANTIC_BADGE.warning },
    Online: { label: t("obligations.paymentMode.online"), cls: SEMANTIC_BADGE.info },
  }), [t]);

  const selectOptions = useMemo(() => [
    { value: "all", label: t("obligations.filter.allTypes") },
    ...obligationTypes.map((item) => ({ value: item.id, label: item.name }))
  ], [obligationTypes, t]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((collection) => selectedIds.includes(collection.id));

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) return;
    if (showDeleted) {
      if (!confirm(t("obligations.trash.bulkRestoreConfirm", { count: selectedIds.length }))) return;
      await onBulkRestore?.(selectedIds);
    } else {
      if (!confirm(t("obligations.trash.bulkDeleteConfirm", { count: selectedIds.length }))) return;
      await onBulkDelete?.(selectedIds);
    }
    setSelectedIds([]);
  };

  return (
    <div className="space-y-4">
      <section aria-label={t("obligations.filter.label")} className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            aria-label={t("obligations.searchPlaceholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("obligations.searchPlaceholder")}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="min-w-[150px]">
          <FormSelect
            aria-label={t("obligations.filter.type")}
            value={typeFilter}
            onChange={(selectedType) => setTypeFilter(selectedType)}
            options={selectOptions}
            className="text-sm rounded-xl border border-border bg-background"
          />
        </div>
        {columnCustomizer && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
        {canDelete && onToggleShowDeleted && (
          <Button
            type="button"
            variant="ghost"
            onClick={onToggleShowDeleted}
            aria-pressed={showDeleted}
            className={`flex items-center gap-1.5 px-3 min-h-11 rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
              showDeleted
                ? "border-primary/40 bg-primary/10 text-primary hover:text-primary hover:bg-primary/10"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive className="w-3.5 h-3.5" aria-hidden="true" />
            {showDeleted ? t("obligations.trash.showActive") : t("obligations.trash.showDeleted")}
          </Button>
        )}
        {canDelete && selectedIds.length > 0 && (
          <Button
            type="button"
            variant={showDeleted ? "outline" : "destructive"}
            onClick={() => { void handleBulkAction(); }}
            className="gap-1.5"
          >
            {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
            {showDeleted ? t("obligations.trash.restore") : t("common.delete")} ({selectedIds.length})
          </Button>
        )}
      </section>

      <section aria-label={t("obligations.collectionsList")}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border bg-card gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
              <Receipt className="w-7 h-7 text-primary/50" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground m-0">{t("obligations.empty.collectionsTitle")}</p>
              <p className="text-xs text-muted-foreground mt-1 m-0">
                {search || typeFilter !== "all"
                  ? t("obligations.empty.collectionsFiltered")
                  : t("obligations.empty.collectionsNone")}
              </p>
            </div>
            {!search && typeFilter === "all" && canWrite && !showDeleted && (
              <Button type="button" onClick={onAddNew}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("obligations.newCollection")}
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <caption className="sr-only">{t("obligations.collectionsList")}</caption>
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    {canDelete && (
                      <th scope="col" className="px-3 py-2.5 w-10">
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={(checked) => {
                            if (checked === true) setSelectedIds(filtered.map((collection) => collection.id));
                            else setSelectedIds([]);
                          }}
                          aria-label={t("obligations.trash.selectAll")}
                        />
                      </th>
                    )}
                    {showReceiptNo && (
                      <ResizableTableHead columnKey="receiptNo" width={getColumnWidth?.("receiptNo")} onResize={onColumnResize} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.receiptNo")}
                      </ResizableTableHead>
                    )}
                    {showReceivedDate && (
                      <ResizableTableHead columnKey="receivedDate" width={getColumnWidth?.("receivedDate")} onResize={onColumnResize} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.receivedDate")}
                      </ResizableTableHead>
                    )}
                    {showSender && (
                      <ResizableTableHead columnKey="sender" width={getColumnWidth?.("sender")} onResize={onColumnResize} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.sender")}
                      </ResizableTableHead>
                    )}
                    {showObligationType && (
                      <ResizableTableHead columnKey="obligationType" width={getColumnWidth?.("obligationType")} onResize={onColumnResize} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.obligationType")}
                      </ResizableTableHead>
                    )}
                    {showRepMujtahid && (
                      <ResizableTableHead columnKey="repMujtahid" width={getColumnWidth?.("repMujtahid")} onResize={onColumnResize} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.repMujtahid")}
                      </ResizableTableHead>
                    )}
                    {showAmount && (
                      <ResizableTableHead columnKey="amount" width={getColumnWidth?.("amount")} onResize={onColumnResize} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.amount")}
                      </ResizableTableHead>
                    )}
                    {showPaymentMode && (
                      <ResizableTableHead columnKey="paymentMode" width={getColumnWidth?.("paymentMode")} onResize={onColumnResize} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.paymentMode")}
                      </ResizableTableHead>
                    )}
                    <th scope="col" className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase">
                      <span className="sr-only">{t("obligations.columns.actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((collection) => {
                    const sender = getContact(collection.sender_id);
                    const obligationType = getObType(collection.obligation_type_id);
                    const rep = getRep(collection.mujtahid_representative_id);
                    const mujtahid = getMujtahid(collection.mujtahid_representative_id);
                    return (
                      <tr key={collection.id} className="hover:bg-muted/20 transition-colors">
                        {canDelete && (
                          <td className="px-3 py-2.5">
                            <Checkbox
                              checked={selectedIds.includes(collection.id)}
                              onCheckedChange={(checked) => {
                                setSelectedIds((prev) =>
                                  checked === true
                                    ? [...prev, collection.id]
                                    : prev.filter((id) => id !== collection.id),
                                );
                              }}
                              aria-label={t("obligations.trash.selectCollection", { receipt: collection.receipt_no })}
                            />
                          </td>
                        )}
                        {showReceiptNo && (
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-xs font-bold text-primary">{collection.receipt_no}</span>
                          </td>
                        )}
                        {showReceivedDate && (
                          <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(collection.received_date)}</td>
                        )}
                        {showSender && (
                          <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{sender?.name || "—"}</td>
                        )}
                        {showObligationType && (
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">{obligationType?.name || "—"}</span>
                          </td>
                        )}
                        {showRepMujtahid && (
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">
                            <span>{rep?.name || "—"}</span>
                            {mujtahid && <span className="text-xs block text-muted-foreground/70">{mujtahid.name}</span>}
                          </td>
                        )}
                        {showAmount && (
                          <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{formatMoney(collection.amount, currencies.find((c) => c.id === collection.currency_id)?.code)}</td>
                        )}
                        {showPaymentMode && (
                          <td className="px-3 py-2.5">
                            <StatusBadge status={collection.payment_mode} config={paymentModeConfig} size="sm" />
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onMessage && !showDeleted && (
                              <>
                                <Button type="button" onClick={() => onMessage('whatsapp', [collection])}
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-lg hover:bg-muted text-muted-foreground hover:text-success shadow-none transition-colors"
                                  title={t("obligations.list.actionWhatsApp")}
                                  aria-label={t("obligations.list.actionWhatsApp")}>
                                  <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                </Button>
                                <Button type="button" onClick={() => onMessage('sms', [collection])}
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-lg hover:bg-muted text-muted-foreground hover:text-info shadow-none transition-colors"
                                  title={t("obligations.list.actionSms")}
                                  aria-label={t("obligations.list.actionSms")}>
                                  <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                                </Button>
                              </>
                            )}
                            <Button type="button" onClick={() => onView(collection)}
                              variant="ghost"
                              size="icon"
                              className="rounded-lg hover:bg-muted text-muted-foreground hover:text-primary shadow-none transition-colors"
                              aria-label={t("obligations.actions.view", { receipt: collection.receipt_no })}
                              title={t("obligations.actions.viewShort")}>
                              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
                            {!showDeleted && (
                              <Button type="button" onClick={() => setPrintCollection(collection)}
                                variant="ghost"
                                size="icon"
                                className="rounded-lg hover:bg-muted text-muted-foreground hover:text-primary shadow-none transition-colors"
                                aria-label={t("obligations.actions.print", { receipt: collection.receipt_no })}
                                title={t("obligations.actions.printShort")}>
                                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={`rounded-lg hover:bg-muted shadow-none transition-colors ${showDeleted ? "text-muted-foreground hover:text-primary" : "text-muted-foreground hover:text-destructive"}`}
                                aria-label={showDeleted ? t("obligations.trash.restore") : t("common.delete")}
                                onClick={() => {
                                  if (showDeleted) {
                                    if (!confirm(t("obligations.trash.bulkRestoreConfirm", { count: 1 }))) return;
                                    void onRestore?.(collection.id);
                                  } else {
                                    if (!confirm(t("obligations.trash.deleteConfirm"))) return;
                                    void onDelete?.(collection.id);
                                  }
                                }}
                              >
                                {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">{t("obligations.recordsShown", { count: filtered.length })}</p>
      </section>

      {printCollection && (
        <Suspense fallback={null}>
          <PrintInvoiceModal
            collection={printCollection}
            obligationTypes={obligationTypes}
            reps={reps}
            mujtahids={mujtahids}
            onClose={() => setPrintCollection(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
