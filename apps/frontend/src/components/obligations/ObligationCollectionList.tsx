import React, { useState, useMemo, lazy, Suspense } from "react";
import { Plus, Eye, Search, Receipt, Printer } from "lucide-react";
import {
  MOCK_CURRENCIES,
  ObligationCollection, ObligationType, MujtahidRep, Mujtahid
} from '@/lib/data/obligationsData';
import useDebounce from "../../hooks/useDebounce";
import { useMergedObligationContacts } from "../../hooks/useObligationLookups";

const PrintInvoiceModal = lazy(() => import("./invoice/PrintInvoiceModal"));

function fmtAmount(amount: string | number, currencyId: string): string {
  const cur = MOCK_CURRENCIES.find((c) => c.id === currencyId);
  return `${cur?.code || ""} ${parseFloat(amount as string).toLocaleString()}`;
}

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

export interface ObligationCollectionListProps {
  collections: ObligationCollection[];
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  onAddNew: () => void;
  onView: (c: ObligationCollection) => void;
}

/**
 * ObligationCollectionList component.
 *
 * @param {ObligationCollectionListProps} props
 * @returns {React.ReactElement}
 */
export default function ObligationCollectionList({ collections, obligationTypes, reps, mujtahids, onAddNew, onView }: ObligationCollectionListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [printCollection, setPrintCollection] = useState<ObligationCollection | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const contacts = useMergedObligationContacts();

  const getContact = (id?: string | number | null) => contacts.find((c) => String(c.id) === String(id));
  const getRep = (id: string) => reps.find((r) => r.id === id);
  const getMujtahid = (repId: string) => {
    const rep = getRep(repId);
    return rep ? mujtahids.find((m) => m.id === rep.mujtahid_id) : null;
  };
  const getObType = (id: string) => obligationTypes.find((t) => t.id === id);

  const filtered = useMemo(() => collections.filter((c) => {
    if (typeFilter !== "all" && c.obligation_type_id !== typeFilter) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const sender = getContact(c.sender_id)?.name?.toLowerCase() || "";
      const receipt = c.receipt_no.toLowerCase();
      if (!sender.includes(q) && !receipt.includes(q)) return false;
    }
    return true;
  }), [collections, debouncedSearch, typeFilter, contacts]);

  const totalAmount = filtered.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <section aria-label="Filters and Actions" className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input 
            type="search"
            aria-label="Search receipt or sender"
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt or sender…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" 
          />
        </div>
        <select 
          aria-label="Filter by obligation type"
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Types</option>
          {obligationTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </section>

      {/* Summary strip */}
      <section aria-label="Collections Summary" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-xl font-bold text-foreground m-0">{filtered.length}</p>
          <h2 className="text-xs text-muted-foreground m-0">Receipts</h2>
        </div>
        <div className="rounded-xl border border-border bg-emerald-50 px-4 py-3">
          <p className="text-xl font-bold text-emerald-700 m-0">PKR {totalAmount.toLocaleString()}</p>
          <h2 className="text-xs text-muted-foreground m-0">Total (PKR)</h2>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-xl font-bold text-foreground m-0">{obligationTypes.length}</p>
          <h2 className="text-xs text-muted-foreground m-0">Obligation Types</h2>
        </div>
      </section>

      {/* Table */}
      <section aria-label="Obligation Collections List">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border bg-card gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
              <Receipt className="w-7 h-7 text-primary/50" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground m-0">No collections found</p>
              <p className="text-xs text-muted-foreground mt-1 m-0">
                {search || typeFilter !== "all" ? "Try adjusting your filters." : "Record the first obligation collection."}
              </p>
            </div>
            {!search && typeFilter === "all" && (
              <button type="button" onClick={onAddNew}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> New Collection
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">List of obligation collections</caption>
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Receipt #</th>
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Date</th>
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Sender</th>
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Obligation</th>
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Rep / Mujtahid</th>
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Amount</th>
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Mode</th>
                    <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((c) => {
                    const sender = getContact(c.sender_id);
                    const obType = getObType(c.obligation_type_id);
                    const rep = getRep(c.mujtahid_representative_id);
                    const mujtahid = getMujtahid(c.mujtahid_representative_id);
                    return (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-xs font-bold text-primary">{c.receipt_no}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(c.received_date)}</td>
                        <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{sender?.name || "—"}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">{obType?.name || "—"}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          <span>{rep?.name || "—"}</span>
                          {mujtahid && <span className="text-[10px] block text-muted-foreground/70">{mujtahid.name}</span>}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{fmtAmount(c.amount, c.currency_id)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.payment_mode === "Cash" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                            {c.payment_mode}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => onView(c)}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" aria-label={`View collection ${c.receipt_no}`} title="View">
                              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <button type="button" onClick={() => setPrintCollection(c)}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" aria-label={`Print receipt for ${c.receipt_no}`} title="Print Receipt">
                              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
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
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} record{filtered.length !== 1 ? "s" : ""} shown</p>
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
