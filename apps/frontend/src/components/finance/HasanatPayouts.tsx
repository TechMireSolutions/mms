import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Gift, Plus, X, Save } from "lucide-react";
import { HASANAT_PAYOUTS, HasanatPayout } from '@/lib/data/financeData';
import { DatePicker } from "../ui/DatePicker";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";


interface PayoutModalProps {
  onClose: () => void;
  onSave: (payout: HasanatPayout) => void;
}

function PayoutModal({ onClose, onSave }: PayoutModalProps) {
  const [data, setData] = useState<Partial<HasanatPayout>>({
    studentName: "",
    class: "",
    pointsRedeemed: 0,
    rewardGiven: "",
    date: new Date().toISOString().split("T")[0],
    approvedBy: "",
  });

  const upd = (f: keyof HasanatPayout, v: HasanatPayout[keyof HasanatPayout]) => setData((d) => ({ ...d, [f]: v }));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="payout-modal-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.form
        onSubmit={(e) => { e.preventDefault(); onSave({ ...data, id: `h${Date.now()}`, pointsRedeemed: Number(data.pointsRedeemed) } as HasanatPayout); }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm z-10"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 id="payout-modal-title" className="text-sm font-bold text-foreground m-0">Record Hasanat Payout</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" aria-hidden="true" /></button>
        </header>
        <fieldset className="px-5 py-4 space-y-4 border-none m-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FORM_LABEL} htmlFor="payout-studentName">Student Name *</label>
              <input id="payout-studentName" className={FORM_INPUT} value={data.studentName || ""} onChange={(e) => upd("studentName", e.target.value)} placeholder="Full name" required />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="payout-class">Class</label>
              <input id="payout-class" className={FORM_INPUT} value={data.class || ""} onChange={(e) => upd("class", e.target.value)} placeholder="e.g. Hifz A" />
            </div>
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="payout-points">Points Redeemed *</label>
            <input id="payout-points" type="number" className={FORM_INPUT} value={data.pointsRedeemed || ""} onChange={(e) => upd("pointsRedeemed", e.target.value)} placeholder="0" min={0} required />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="payout-reward">Reward Given *</label>
            <input id="payout-reward" className={FORM_INPUT} value={data.rewardGiven || ""} onChange={(e) => upd("rewardGiven", e.target.value)} placeholder="e.g. Prize Voucher PKR 500" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FORM_LABEL} htmlFor="payout-date">Date</label>
              <DatePicker
                id="payout-date"
                value={data.date || ""}
                onChange={(val) => upd("date", val)}
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="payout-approvedBy">Approved By</label>
              <input id="payout-approvedBy" className={FORM_INPUT} value={data.approvedBy || ""} onChange={(e) => upd("approvedBy", e.target.value)} placeholder="Name" />
            </div>
          </div>
        </fieldset>
        <footer className="px-5 py-4 border-t border-border flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button
            type="submit"
            disabled={!data.studentName || !data.pointsRedeemed || !data.rewardGiven}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" /> Save
          </button>
        </footer>
      </motion.form>
    </div>
  );
}

/**
 * HasanatPayouts Component
 * 
 * Manages the records for hasanat points earned and redeemed.
 * 
 * @returns {React.ReactElement}
 */
export default function HasanatPayouts() {
  const [payouts, setPayouts] = useState<HasanatPayout[]>(HASANAT_PAYOUTS);
  const [showModal, setShowModal] = useState(false);

  const totalRedeemed = payouts.reduce((s, p) => s + p.pointsRedeemed, 0);
  const totalEarned = payouts.reduce((s, p) => s + p.pointsEarned, 0);

  const handleSave = (payout: HasanatPayout) => {
    setPayouts((p) => [...p, { ...payout, pointsEarned: payout.pointsRedeemed }]);
    setShowModal(false);
  };

  return (
    <section aria-label="Hasanat Payouts" className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3" aria-label="Hasanat Summary">
        {[
          { label: "Total Earned", value: totalEarned, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
          { label: "Total Redeemed", value: totalRedeemed, color: "text-primary", bg: "bg-primary/10", border: "border-primary/10" },
          { label: "Unredeemed", value: totalEarned - totalRedeemed, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
        ].map((s) => (
          <article key={s.label} className={`rounded-xl border ${s.border} p-3`}>
            <div className="flex items-center gap-1.5 mb-1" aria-hidden="true">
              <Star className={`w-3.5 h-3.5 ${s.color}`} />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</span>
            </div>
            <p className={`text-[18px] font-bold ${s.color} m-0`}>{s.value.toLocaleString()} pts</p>
          </article>
        ))}
      </div>

      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{payouts.length} records</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Record Payout
        </button>
      </header>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Hasanat Payout Records</caption>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Student", "Class", "Earned", "Redeemed", "Reward", "Date", "Approved By"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {payouts.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 text-[13px] font-semibold text-foreground whitespace-nowrap">{p.studentName}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{p.class}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" aria-label={`Earned ${p.pointsEarned} points`}>
                      <Star className="w-3 h-3 text-warning" aria-hidden="true" />
                      <span className="text-[13px] font-bold text-warning">{p.pointsEarned}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.pointsRedeemed > 0 ? (
                      <div className="flex items-center gap-1" aria-label={`Redeemed ${p.pointsRedeemed} points`}>
                        <Gift className="w-3 h-3 text-primary" aria-hidden="true" />
                        <span className="text-[13px] font-bold text-primary">{p.pointsRedeemed}</span>
                      </div>
                    ) : <span className="text-[12px] text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-foreground">{p.rewardGiven || "—"}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{p.date || "—"}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{p.approvedBy || "—"}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && <PayoutModal onClose={() => setShowModal(false)} onSave={handleSave} />}
      </AnimatePresence>
    </section>
  );
}
