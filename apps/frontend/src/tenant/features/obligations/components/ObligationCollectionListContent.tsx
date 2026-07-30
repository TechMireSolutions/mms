import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { Mujtahid, MujtahidRep, ObligationCollection, ObligationType } from "@/lib/data/obligationsData";
import { ObligationCollectionRowActions } from "@/tenant/features/obligations/components/ObligationCollectionRowActions";
import { DEFAULT_CURRENCIES, formatDate, formatMoney } from "@mms/shared";
import { motion } from "framer-motion";
import { Plus, Receipt } from "lucide-react";

interface ObligationContact {
  name?: string;
}

export interface ObligationCollectionVisibleColumns {
  receiptNo: boolean;
  receivedDate: boolean;
  sender: boolean;
  obligationType: boolean;
  repMujtahid: boolean;
  amount: boolean;
  paymentMode: boolean;
}

interface ObligationCollectionListContentProps {
  collections: ObligationCollection[];
  search: string;
  typeFilter: string;
  selectedIds: string[];
  visibleColumns: ObligationCollectionVisibleColumns;
  allFilteredSelected: boolean;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  paymentModeConfig: Record<string, StatusBadgeConfigItem>;
  getContact: (contactId?: string | number | null) => ObligationContact | undefined;
  getRep: (repId: string) => MujtahidRep | undefined;
  getMujtahid: (repId: string) => Mujtahid | null | undefined;
  getObligationType: (obligationTypeId: string) => ObligationType | undefined;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onAddNew: () => void;
  onView: (collection: ObligationCollection) => void;
  onPrint: (collection: ObligationCollection) => void;
  onSelectAll: (checked: boolean) => void;
  onToggleSelected: (id: string, checked: boolean) => void;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onMessage?: (channel: "sms" | "whatsapp" | "email", collections: ObligationCollection[]) => void;
}

export function ObligationCollectionListContent({
  collections,
  search,
  typeFilter,
  selectedIds,
  visibleColumns,
  allFilteredSelected,
  canWrite,
  canDelete,
  showDeleted,
  paymentModeConfig,
  getContact,
  getRep,
  getMujtahid,
  getObligationType,
  getColumnWidth,
  onColumnResize,
  onAddNew,
  onView,
  onPrint,
  onSelectAll,
  onToggleSelected,
  onDelete,
  onRestore,
  onMessage,
}: ObligationCollectionListContentProps): React.JSX.Element {
  const { t } = useTranslation();
  const currencies = DEFAULT_CURRENCIES;

  return (
    <section aria-label={t("obligations.collectionsList")}>
      {collections.length === 0 ? (
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
            <Button
              type="button"
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("obligations.newCollection")}
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {collections.map((collection, index) => {
              const sender = getContact(collection.sender_id);
              const obligationType = getObligationType(collection.obligation_type_id);
              const rep = getRep(collection.mujtahid_representative_id);
              const mujtahid = getMujtahid(collection.mujtahid_representative_id);
              const isSelected = selectedIds.includes(collection.id);

              return (
                <motion.article
                  key={collection.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className={`space-y-3 rounded-xl border border-border bg-card p-3 ${isSelected ? "ring-1 ring-primary/20" : ""}`}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {visibleColumns.receiptNo && (
                        <p className="font-mono text-xs font-bold text-primary">{collection.receipt_no}</p>
                      )}
                      {visibleColumns.sender && (
                        <p className="truncate text-sm font-semibold text-foreground">{sender?.name || "—"}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {visibleColumns.amount && (
                        <span className="text-sm font-bold text-foreground">
                          {formatMoney(collection.amount, currencies.find((currency) => currency.id === collection.currency_id)?.code)}
                        </span>
                      )}
                      {canDelete && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => onToggleSelected(collection.id, checked === true)}
                          aria-label={t("obligations.trash.selectCollection", { receipt: collection.receipt_no })}
                        />
                      )}
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    {visibleColumns.receivedDate && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.columns.receivedDate")}</dt>
                        <dd className="text-foreground">{formatDate(collection.received_date)}</dd>
                      </div>
                    )}
                    {visibleColumns.obligationType && (
                      <div>
                        <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("obligations.columns.obligationType")}</dt>
                        <dd>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                            {obligationType?.name || "—"}
                          </span>
                        </dd>
                      </div>
                    )}
                    {visibleColumns.repMujtahid && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.columns.repMujtahid")}</dt>
                        <dd className="text-foreground">
                          <span>{rep?.name || "—"}</span>
                          {mujtahid && <span className="block text-xs text-muted-foreground/70">{mujtahid.name}</span>}
                        </dd>
                      </div>
                    )}
                    {visibleColumns.paymentMode && (
                      <div>
                        <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("obligations.columns.paymentMode")}</dt>
                        <dd><StatusBadge status={collection.payment_mode} config={paymentModeConfig} size="sm" /></dd>
                      </div>
                    )}
                  </dl>
                  <div className="border-t border-border pt-2">
                    <ObligationCollectionRowActions
                      collection={collection}
                      canDelete={canDelete}
                      showDeleted={showDeleted}
                      onView={onView}
                      onPrint={onPrint}
                      onDelete={onDelete}
                      onRestore={onRestore}
                      onMessage={onMessage}
                    />
                  </div>
                </motion.article>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm table-fixed">
              <caption className="sr-only">{t("obligations.collectionsList")}</caption>
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  {canDelete && (
                    <th scope="col" className="px-3 py-2.5 w-10">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={(checked) => onSelectAll(checked === true)}
                        aria-label={t("obligations.trash.selectAll")}
                      />
                    </th>
                  )}
                  {visibleColumns.receiptNo && (
                    <ResizableTableHead columnKey="receiptNo" width={getColumnWidth?.("receiptNo")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                      {t("obligations.columns.receiptNo")}
                    </ResizableTableHead>
                  )}
                  {visibleColumns.receivedDate && (
                    <ResizableTableHead columnKey="receivedDate" width={getColumnWidth?.("receivedDate")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                      {t("obligations.columns.receivedDate")}
                    </ResizableTableHead>
                  )}
                  {visibleColumns.sender && (
                    <ResizableTableHead columnKey="sender" width={getColumnWidth?.("sender")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                      {t("obligations.columns.sender")}
                    </ResizableTableHead>
                  )}
                  {visibleColumns.obligationType && (
                    <ResizableTableHead columnKey="obligationType" width={getColumnWidth?.("obligationType")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                      {t("obligations.columns.obligationType")}
                    </ResizableTableHead>
                  )}
                  {visibleColumns.repMujtahid && (
                    <ResizableTableHead columnKey="repMujtahid" width={getColumnWidth?.("repMujtahid")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                      {t("obligations.columns.repMujtahid")}
                    </ResizableTableHead>
                  )}
                  {visibleColumns.amount && (
                    <ResizableTableHead columnKey="amount" width={getColumnWidth?.("amount")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                      {t("obligations.columns.amount")}
                    </ResizableTableHead>
                  )}
                  {visibleColumns.paymentMode && (
                    <ResizableTableHead columnKey="paymentMode" width={getColumnWidth?.("paymentMode")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                      {t("obligations.columns.paymentMode")}
                    </ResizableTableHead>
                  )}
                  <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">
                    <span className="sr-only">{t("obligations.columns.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {collections.map((collection) => {
                  const sender = getContact(collection.sender_id);
                  const obligationType = getObligationType(collection.obligation_type_id);
                  const rep = getRep(collection.mujtahid_representative_id);
                  const mujtahid = getMujtahid(collection.mujtahid_representative_id);

                  return (
                    <tr key={collection.id} className="hover:bg-muted/20 transition-colors">
                      {canDelete && (
                        <td className="px-3 py-2.5">
                          <Checkbox
                            checked={selectedIds.includes(collection.id)}
                            onCheckedChange={(checked) => onToggleSelected(collection.id, checked === true)}
                            aria-label={t("obligations.trash.selectCollection", { receipt: collection.receipt_no })}
                          />
                        </td>
                      )}
                      {visibleColumns.receiptNo && (
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-xs font-bold text-primary">{collection.receipt_no}</span>
                        </td>
                      )}
                      {visibleColumns.receivedDate && (
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(collection.received_date)}</td>
                      )}
                      {visibleColumns.sender && (
                        <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{sender?.name || "—"}</td>
                      )}
                      {visibleColumns.obligationType && (
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">{obligationType?.name || "—"}</span>
                        </td>
                      )}
                      {visibleColumns.repMujtahid && (
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          <span>{rep?.name || "—"}</span>
                          {mujtahid && <span className="text-xs block text-muted-foreground/70">{mujtahid.name}</span>}
                        </td>
                      )}
                      {visibleColumns.amount && (
                        <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{formatMoney(collection.amount, currencies.find((currency) => currency.id === collection.currency_id)?.code)}</td>
                      )}
                      {visibleColumns.paymentMode && (
                        <td className="px-3 py-2.5">
                          <StatusBadge status={collection.payment_mode} config={paymentModeConfig} size="sm" />
                        </td>
                      )}
                      <td className="px-3 py-2.5 text-end">
                        <ObligationCollectionRowActions
                          collection={collection}
                          canDelete={canDelete}
                          showDeleted={showDeleted}
                          onView={onView}
                          onPrint={onPrint}
                          onDelete={onDelete}
                          onRestore={onRestore}
                          onMessage={onMessage}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-2">{t("obligations.recordsShown", { count: collections.length })}</p>
    </section>
  );
}
