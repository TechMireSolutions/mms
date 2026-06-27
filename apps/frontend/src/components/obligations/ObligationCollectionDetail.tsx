import React, { useState, lazy, Suspense, useMemo } from "react";
import { Receipt, Printer } from "lucide-react";
import { ObligationCollection, ObligationType, MujtahidRep, Mujtahid, WakalaType, ObligationDistribution } from '@/lib/data/obligationsData';
import { DEFAULT_CURRENCIES } from '@mms/shared';
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { useMergedObligationContacts, useMergedObligationUsers } from "../../hooks/useObligationLookups";
import { ObligationModal } from "./ObligationModal";
import { InvoiceTemplateEditor } from "./invoice/InvoiceTemplateEditor";
import { Button } from "@/components/ui/button";

const PrintInvoiceModal = lazy(() => import("./invoice/PrintInvoiceModal").then((module) => ({ default: module.PrintInvoiceModal })));

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

interface RowProps {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}

function Row({ label, value, mono = false }: RowProps) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0">{label}</span>
      <span className={`text-sm text-end font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}

export interface ObligationCollectionDetailProps {
  collection: ObligationCollection;
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  distributions: ObligationDistribution[];
  wakalaTypes: WakalaType[];
  onClose: () => void;
}

/**
 * ObligationCollectionDetail component.
 * 
 * Displays the details of an obligation collection including distribution.
 * 
 * @param {ObligationCollectionDetailProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function ObligationCollectionDetail({ collection, obligationTypes, reps, mujtahids, distributions, wakalaTypes, onClose }: ObligationCollectionDetailProps) {
  const currencies = useLiveCollection<any>("currencies", DEFAULT_CURRENCIES);
  const [showPrint, setShowPrint] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const contactIds = useMemo(
    () => [collection.sender_id, collection.reference_id],
    [collection.sender_id, collection.reference_id],
  );
  const contacts = useMergedObligationContacts(contactIds);
  const users = useMergedObligationUsers();

  const getContact = (id?: string | number | null) => contacts.find((c) => String(c.id) === String(id));
  const getCurrency = (id: string) => currencies.find((c: any) => c.id === id);
  const getUser = (id?: string | number | null) => users.find((u) => String(u.id) === String(id));
  const getRep = (id: string) => reps.find((r) => r.id === id);
  const getMujtahid = (repId: string) => {
    const rep = getRep(repId);
    return rep ? mujtahids.find((m) => m.id === rep.mujtahid_id) : null;
  };
  const getObType = (id: string) => obligationTypes.find((t) => t.id === id);

  const c = collection;
  const sender = getContact(c.sender_id);
  const reference = c.reference_id ? getContact(c.reference_id) : null;
  const currency = getCurrency(c.currency_id);
  const user = getUser(c.received_by);
  const rep = getRep(c.mujtahid_representative_id);
  const mujtahid = getMujtahid(c.mujtahid_representative_id);
  const obType = getObType(c.obligation_type_id);

  // Find applicable Wakala Type and its distributions
  const wakalaType = wakalaTypes.find(
    (w) => w.obligation_type_id === c.obligation_type_id && w.mujtahid_representative_id === c.mujtahid_representative_id
  );
  const dists = wakalaType ? distributions.filter((d) => d.wakala_type_id === wakalaType.id) : [];

  return (
    <ObligationModal title="Collection Details" onClose={onClose}>
      <div className="space-y-5">
        {/* Receipt header */}
        <header className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
          <Receipt className="w-5 h-5 text-primary" aria-hidden="true" />
          <div>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide m-0">Receipt No.</h3>
            <p className="text-xl font-bold text-primary font-mono m-0">{c.receipt_no}</p>
          </div>
          <div className="ms-auto text-end">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Date</h3>
            <p className="text-sm font-semibold text-foreground m-0">{fmtDate(c.received_date)}</p>
          </div>
        </header>

        {/* Main details */}
        <section aria-label="Main Collection Details" className="rounded-xl border border-border divide-y divide-border px-4">
          <Row label="Sender" value={sender?.name} />
          {reference && <Row label="Reference" value={reference?.name} />}
          <Row label="Obligation Type" value={obType?.name} />
          <Row label="Designated For" value={obType?.designated_for} />
          <Row label="Representative" value={rep?.name} />
          <Row label="Mujtahid" value={mujtahid?.name} />
          <Row label="Amount" value={`${currency?.code || ""} ${c.amount.toLocaleString()}`} mono />
          <Row label="Payment Mode" value={c.payment_mode} />
          <Row label="Received By" value={user?.name} />
          <Row label="Created" value={fmtDate(c.created_at)} />
        </section>

        {/* Distribution breakdown */}
        {dists.length > 0 && (
          <section aria-label="Distribution Breakdown">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 m-0">Distribution Breakdown</h4>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <caption className="sr-only">Distribution breakdown for collection {c.receipt_no}</caption>
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-start text-[11px] font-semibold text-muted-foreground uppercase">Name</th>
                    <th scope="col" className="px-4 py-2 text-start text-[11px] font-semibold text-muted-foreground uppercase">Type</th>
                    <th scope="col" className="px-4 py-2 text-end text-[11px] font-semibold text-muted-foreground uppercase">%</th>
                    <th scope="col" className="px-4 py-2 text-end text-[11px] font-semibold text-muted-foreground uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dists.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium text-foreground">{d.name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${d.type === "Income" ? "bg-success/15 text-success" : "bg-info/15 text-info"}`}>
                          {d.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-end font-mono text-xs font-semibold">{d.percentage}%</td>
                      <td className="px-4 py-2.5 text-end font-mono text-xs font-semibold text-foreground">
                        {currency?.code} {((c.amount * d.percentage) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {dists.length === 0 && wakalaType && (
          <div className="px-4 py-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning" role="alert">
            No distribution entries configured for this Wakala Type yet.
          </div>
        )}

        <footer className="flex items-center justify-between">
          <Button type="button" onClick={() => setShowPrint(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Printer className="w-4 h-4" aria-hidden="true" /> Print Receipt
          </Button>
          <Button type="button" onClick={onClose}
            variant="outline"
            className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
            Close
          </Button>
        </footer>
      </div>

      {showPrint && (
        <Suspense fallback={null}>
          <PrintInvoiceModal
            collection={collection}
            obligationTypes={obligationTypes}
            reps={reps}
            mujtahids={mujtahids}
            onClose={() => setShowPrint(false)}
            onOpenEditor={() => { setShowPrint(false); setShowEditor(true); }}
          />
        </Suspense>
      )}
      {showEditor && <InvoiceTemplateEditor onClose={() => setShowEditor(false)} />}
    </ObligationModal>
  );
}
