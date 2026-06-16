import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Plus, Star, X } from "lucide-react";
import { REDEMPTIONS, Redemption, Distribution } from '@/lib/data/hasanatData';
import { DatePicker } from "../ui/DatePicker";

const INPUT = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

interface RedeemModalProps {
  distributions: Distribution[];
  onClose: () => void;
  onSave: (red: Redemption) => void;
}

function RedeemModal({ distributions, onClose, onSave }: RedeemModalProps) {
  const activeDistr = distributions.filter((d) => d.status === "active");
  const [data, setData] = useState<Partial<Redemption>>({ 
    distributionId: activeDistr[0]?.id || "", 
    reward: "", 
    pointsUsed: 0, 
    date: new Date().toISOString().split("T")[0], 
    approvedBy: "" 
  });
  
  const upd = <K extends keyof Redemption>(f: K, v: Redemption[K]) => setData((d: Partial<Redemption>) => ({ ...d, [f]: v }));
  const selected = activeDistr.find((d) => d.id === data.distributionId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="redeem-modal-title"
        initial={{ opacity: 0, scale: 0.96 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm z-10"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 id="redeem-modal-title" className="text-sm font-bold text-foreground m-0">Record Redemption</h3>
          <button type="button" aria-label="Close modal" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" aria-hidden="true" /></button>
        </header>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label htmlFor="dist-sel" className={LABEL}>Distribution / Student *</label>
            <select id="dist-sel" className={INPUT + " cursor-pointer"} value={data.distributionId} onChange={(e) => upd("distributionId", e.target.value)}>
              {activeDistr.map((d) => (
                <option key={d.id} value={d.id}>{d.recipientName} — {d.denominationName} × {d.quantity}</option>
              ))}
            </select>
            {selected && (
              <p className="text-[11px] text-muted-foreground mt-1 m-0">Reason: {selected.reason}</p>
            )}
          </div>
          <div>
            <label htmlFor="reward-given" className={LABEL}>Reward Given *</label>
            <input id="reward-given" className={INPUT} value={data.reward} onChange={(e) => upd("reward", e.target.value)} placeholder="e.g. Stationery Kit, Book Voucher" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pts-used" className={LABEL}>Points Used *</label>
              <input id="pts-used" type="number" className={INPUT} value={data.pointsUsed || ""} onChange={(e) => upd("pointsUsed", Number(e.target.value))} placeholder="0" min={1} />
            </div>
            <div>
              <label htmlFor="red-date" className={LABEL}>Date</label>
              <DatePicker
                id="red-date"
                value={data.date || ""}
                onChange={(val) => upd("date", val)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="approved-by" className={LABEL}>Approved By</label>
            <input id="approved-by" className={INPUT} value={data.approvedBy} onChange={(e) => upd("approvedBy", e.target.value)} placeholder="Admin / Teacher" />
          </div>
        </div>
        <footer className="px-5 py-4 border-t border-border flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
          <button
            type="button"
            onClick={() => {
              const dist = activeDistr.find((d) => d.id === data.distributionId);
              onSave({ ...data, id: `red${Date.now()}`, studentName: dist?.recipientName || "", pointsUsed: Number(data.pointsUsed) } as Redemption);
            }}
            disabled={!data.distributionId || !data.reward || !data.pointsUsed}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            <Gift className="w-3.5 h-3.5" aria-hidden="true" /> Record
          </button>
        </footer>
      </motion.div>
    </div>
  );
}

export interface RedemptionTrackerProps {
  distributions: Distribution[];
  onUpdateDistributions: (dists: Distribution[]) => void;
}

/**
 * RedemptionTracker Component
 *
 * Renders the dashboard and ledger interface for tracking student points redemptions.
 * Users can view the history of rewards claimed, total points utilized, and approve
 * new points redemptions for eligible students.
 *
 * @param props - Component properties.
 * @returns React element representing the redemption tracker UI.
 */
export default function RedemptionTracker({ distributions, onUpdateDistributions }: RedemptionTrackerProps) {
  const [redemptions, setRedemptions] = useState<Redemption[]>(REDEMPTIONS);
  const [showModal, setShowModal] = useState(false);

  const totalPts = redemptions.reduce((s: number, r: Redemption) => s + r.pointsUsed, 0);

  const handleSave = (r: Redemption) => {
    setRedemptions((prev: Redemption[]) => [...prev, r]);
    // mark distribution as redeemed
    onUpdateDistributions(distributions.map((d: Distribution) => d.id === r.distributionId ? { ...d, status: "redeemed" as const } : d));
    setShowModal(false);
  };

  return (
    <section aria-label="Redemption Tracker" className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground m-0">{redemptions.length} redemption{redemptions.length !== 1 ? "s" : ""} · {totalPts.toLocaleString()} pts total</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Record Redemption
        </button>
      </header>

      {redemptions.length === 0 ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">No redemptions yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Redemptions</caption>
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Student", "Reward", "Points Used", "Date", "Approved By"].map((h) => (
                    <th scope="col" key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {redemptions.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-[13px] font-semibold text-foreground whitespace-nowrap">{r.studentName}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground">{r.reward}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500" aria-hidden="true" />
                        <span className="text-[13px] font-bold text-amber-600">{r.pointsUsed}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">{r.approvedBy || "—"}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && <RedeemModal distributions={distributions} onClose={() => setShowModal(false)} onSave={handleSave} />}
      </AnimatePresence>
    </section>
  );
}
