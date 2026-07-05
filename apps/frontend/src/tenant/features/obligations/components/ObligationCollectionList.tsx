import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from "react";
import { Plus, Eye, Search, Receipt, Printer } from "lucide-react";
import {
  ObligationCollection, ObligationType, MujtahidRep, Mujtahid
} from '@/lib/data/obligationsData';
import { DEFAULT_CURRENCIES } from '@mms/shared';
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useDebounce } from "@/hooks/useDebounce";
import { useMergedObligationContacts } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import type { ModuleColumnRegistryEntry } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";

const PrintInvoiceModal = lazy(() => import("@/tenant/features/obligations/components/invoice/PrintInvoiceModal").then((module) => ({ default: module.PrintInvoiceModal })));

function fmtAmount(amount: string | number, currencyId: string, currencies: any[]): string {
  const currency = currencies.find((candidateCurrency) => candidateCurrency.id === currencyId);
  return `${currency?.code || ""} ${parseFloat(amount as string).toLocaleString()}`;
}

function fmtDate(date?: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

interface ColumnCustomizerProps {
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  labels: {
    trigger: string;
    title: string;
    visibleAndOrder: string;
    hidden: string;
    fixed: string;
    hideColumn: (label: string) => string;
  };
}

export interface ObligationCollectionListProps {
  collections: ObligationCollection[];
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  onAddNew: () => void;
  onView: (collection: ObligationCollection) => void;
  onFilteredCountChange?: (count: number) => void;
  isColumnVisible?: (key: string) => boolean;
  columnCustomizer?: ColumnCustomizerProps;
}

export function ObligationCollectionList({
  collections,
  obligationTypes,
  reps,
  mujtahids,
  onAddNew,
  onView,
  onFilteredCountChange,
  isColumnVisible,
  columnCustomizer,
}: ObligationCollectionListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const currencies = useLiveCollection<any>("currencies", DEFAULT_CURRENCIES);
  const [typeFilter, setTypeFilter] = useState("all");
  const [printCollection, setPrintCollection] = useState<ObligationCollection | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const senderIds = useMemo(() => collections.map((collection) => collection.sender_id), [collections]);
  const contacts = useMergedObligationContacts(senderIds);

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

  const selectOptions = useMemo(() => [
    { value: "all", label: t("obligations.filter.allTypes") },
    ...obligationTypes.map((item) => ({ value: item.id, label: item.name }))
  ], [obligationTypes, t]);

  return (
    <div className="space-y-4">
      <section aria-label={t("obligations.filter.label")} className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
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
            {!search && typeFilter === "all" && (
              <Button type="button" onClick={onAddNew}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("obligations.newCollection")}
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">{t("obligations.collectionsList")}</caption>
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    {showReceiptNo && (
                      <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.receiptNo")}
                      </th>
                    )}
                    {showReceivedDate && (
                      <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.receivedDate")}
                      </th>
                    )}
                    {showSender && (
                      <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.sender")}
                      </th>
                    )}
                    {showObligationType && (
                      <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.obligationType")}
                      </th>
                    )}
                    {showRepMujtahid && (
                      <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.repMujtahid")}
                      </th>
                    )}
                    {showAmount && (
                      <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.amount")}
                      </th>
                    )}
                    {showPaymentMode && (
                      <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                        {t("obligations.columns.paymentMode")}
                      </th>
                    )}
                    <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">
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
                        {showReceiptNo && (
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-xs font-bold text-primary">{collection.receipt_no}</span>
                          </td>
                        )}
                        {showReceivedDate && (
                          <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(collection.received_date)}</td>
                        )}
                        {showSender && (
                          <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{sender?.name || "—"}</td>
                        )}
                        {showObligationType && (
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">{obligationType?.name || "—"}</span>
                          </td>
                        )}
                        {showRepMujtahid && (
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">
                            <span>{rep?.name || "—"}</span>
                            {mujtahid && <span className="text-[10px] block text-muted-foreground/70">{mujtahid.name}</span>}
                          </td>
                        )}
                        {showAmount && (
                          <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{fmtAmount(collection.amount, collection.currency_id, currencies)}</td>
                        )}
                        {showPaymentMode && (
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${collection.payment_mode === "Cash" ? "bg-warning/15 text-warning border-warning/30" : "bg-info/15 text-info border-info/30"}`}>
                              {collection.payment_mode}
                            </span>
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button type="button" onClick={() => onView(collection)}
                              variant="ghost"
                              className="h-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary shadow-none transition-colors"
                              aria-label={t("obligations.actions.view", { receipt: collection.receipt_no })}
                              title={t("obligations.actions.viewShort")}>
                              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
                            <Button type="button" onClick={() => setPrintCollection(collection)}
                              variant="ghost"
                              className="h-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary shadow-none transition-colors"
                              aria-label={t("obligations.actions.print", { receipt: collection.receipt_no })}
                              title={t("obligations.actions.printShort")}>
                              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
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
