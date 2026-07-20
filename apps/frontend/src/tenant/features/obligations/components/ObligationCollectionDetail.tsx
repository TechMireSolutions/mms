import React, { useState, lazy, Suspense, useMemo } from "react";
import { Receipt, Printer } from "lucide-react";
import { ObligationCollection, ObligationType, MujtahidRep, Mujtahid, WakalaType, ObligationDistribution } from '@/lib/data/obligationsData';
import { DEFAULT_CURRENCIES, formatMoney, formatDate } from '@mms/shared';
import { useMergedObligationContacts, useMergedObligationUsers } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/card";
import { InvoiceTemplateEditor } from "@/tenant/features/obligations/components/invoice/InvoiceTemplateEditor";
import { Button } from "@/components/ui/button";

const PrintInvoiceModal = lazy(() => import("@/tenant/features/obligations/components/invoice/PrintInvoiceModal").then((module) => ({ default: module.PrintInvoiceModal })));


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
  const currencies = DEFAULT_CURRENCIES;
  const [showPrint, setShowPrint] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const contactIds = useMemo(
    () => [collection.sender_id, collection.reference_id],
    [collection.sender_id, collection.reference_id],
  );
  const contacts = useMergedObligationContacts(contactIds);
  const users = useMergedObligationUsers();

  const getContact = (id?: string | number | null) => contacts.find((contact) => String(contact.id) === String(id));
  const getCurrency = (id: string) => currencies.find((currencyOption) => currencyOption.id === id);
  const getUser = (id?: string | number | null) => users.find((u) => String(u.id) === String(id));
  const getRep = (id: string) => reps.find((r) => r.id === id);
  const getMujtahid = (repId: string) => {
    const rep = getRep(repId);
    return rep ? mujtahids.find((m) => m.id === rep.mujtahid_id) : null;
  };
  const getObType = (id: string) => obligationTypes.find((t) => t.id === id);

  const selectedCollection = collection;
  const sender = getContact(selectedCollection.sender_id);
  const reference = selectedCollection.reference_id ? getContact(selectedCollection.reference_id) : null;
  const currency = getCurrency(selectedCollection.currency_id);
  const user = getUser(selectedCollection.received_by);
  const rep = getRep(selectedCollection.mujtahid_representative_id);
  const mujtahid = getMujtahid(selectedCollection.mujtahid_representative_id);
  const obType = getObType(selectedCollection.obligation_type_id);

  // Find applicable Wakala Type and its distributions
  const wakalaType = wakalaTypes.find(
    (wakalaTypeItem) => wakalaTypeItem.obligation_type_id === selectedCollection.obligation_type_id && wakalaTypeItem.mujtahid_representative_id === selectedCollection.mujtahid_representative_id
  );
  const dists = wakalaType ? distributions.filter((d) => d.wakala_type_id === wakalaType.id) : [];

  return (
    <Modal open onClose={onClose} title="Collection Details" size="lg">
      <div className="space-y-5">
        {/* Receipt header */}
        <header className="relative overflow-hidden group rounded-2xl border border-primary/25 bg-primary/5 backdrop-blur-sm p-4 px-5.5 flex items-center gap-3.5 shadow-sm transition-all duration-300">
          <div className="absolute start-0 top-0 bottom-0 w-1.5 bg-primary/70" />
          <Receipt className="w-5 h-5 text-primary" aria-hidden="true" />
          <div>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide m-0">Receipt No.</h3>
            <p className="text-xl font-bold text-primary font-mono m-0">{selectedCollection.receipt_no}</p>
          </div>
          <div className="ms-auto text-end">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Date</h3>
            <p className="text-sm font-semibold text-foreground m-0">{formatDate(selectedCollection.received_date)}</p>
          </div>
        </header>

        {/* Main details */}
        <Card accentColor="indigo" className="divide-y divide-border px-5.5 pb-2.5">
          <Row label="Sender" value={sender?.name} />
          {reference && <Row label="Reference" value={reference?.name} />}
          <Row label="Obligation Type" value={obType?.name} />
          <Row label="Designated For" value={obType?.designated_for} />
          <Row label="Representative" value={rep?.name} />
          <Row label="Mujtahid" value={mujtahid?.name} />
          <Row label="Amount" value={formatMoney(selectedCollection.amount, currency?.code)} mono />
          <Row label="Payment Mode" value={selectedCollection.payment_mode} />
          <Row label="Received By" value={user?.name} />
          <Row label="Created" value={formatDate(selectedCollection.created_at)} />
        </Card>

        {/* Distribution breakdown */}
        {dists.length > 0 && (
          <section aria-label="Distribution Breakdown">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 m-0">Distribution Breakdown</h4>
            <Card accentColor="emerald" className="p-0 overflow-hidden">
              <table className="w-full text-sm">
                <caption className="sr-only">Distribution breakdown for collection {selectedCollection.receipt_no}</caption>
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th scope="col" className="px-5 py-2 text-start text-[11px] font-semibold text-muted-foreground uppercase">Name</th>
                    <th scope="col" className="px-4 py-2 text-start text-[11px] font-semibold text-muted-foreground uppercase">Type</th>
                    <th scope="col" className="px-4 py-2 text-end text-[11px] font-semibold text-muted-foreground uppercase">%</th>
                    <th scope="col" className="px-5 py-2 text-end text-[11px] font-semibold text-muted-foreground uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dists.map((distribution) => (
                    <tr key={distribution.id} className="hover:bg-muted/20">
                      <td className="px-5 py-2.5 font-medium text-foreground">{distribution.name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${distribution.type === "Income" ? "bg-success/15 text-success" : "bg-info/15 text-info"}`}>
                          {distribution.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-end font-mono text-xs font-semibold">{distribution.percentage}%</td>
                      <td className="px-5 py-2.5 text-end font-mono text-xs font-semibold text-foreground">
                        {formatMoney((selectedCollection.amount * distribution.percentage) / 100, currency?.code)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
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
    </Modal>
  );
}
