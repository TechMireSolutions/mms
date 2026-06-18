import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Gift, Plus, Star } from "lucide-react";
import { REDEMPTIONS, Redemption, Distribution } from '@/lib/data/hasanatData';
import { DatePicker } from "../ui/DatePicker";
import FormModal from "@/components/ui/FormModal";
import UserActorSelect from "@/components/ui/UserActorSelect";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { saveCollection } from "@/lib/db";

interface RedeemModalProps {
  open: boolean;
  distributions: Distribution[];
  onClose: () => void;
  onSave: (red: Redemption) => void;
}

function RedeemModal({ open, distributions, onClose, onSave }: RedeemModalProps) {
  const activeDistr = distributions.filter((d) => d.status === "active");
  const [data, setData] = useState<Partial<Redemption>>({
    distributionId: activeDistr[0]?.id || "",
    reward: "",
    pointsUsed: 0,
    date: new Date().toISOString().split("T")[0],
    approvedByUserId: "",
  });

  const upd = <K extends keyof Redemption>(f: K, v: Redemption[K]) => setData((d: Partial<Redemption>) => ({ ...d, [f]: v }));
  const selected = activeDistr.find((d) => d.id === data.distributionId);

  React.useEffect(() => {
    if (open) {
      const active = distributions.filter((d) => d.status === "active");
      setData({
        distributionId: active[0]?.id || "",
        reward: "",
        pointsUsed: 0,
        date: new Date().toISOString().split("T")[0],
        approvedByUserId: "",
      });
    }
  }, [open, distributions]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Record Redemption"
      icon={Gift}
      cancelLabel="Cancel"
      saveLabel="Record"
      onSave={() => {
        onSave({
          ...data,
          id: `red${Date.now()}`,
          pointsUsed: Number(data.pointsUsed),
        } as Redemption);
      }}
      saveDisabled={!data.distributionId || !data.reward || !data.pointsUsed}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="dist-sel" className={FORM_LABEL}>Distribution / Student *</label>
          <select id="dist-sel" className={`${FORM_INPUT} cursor-pointer`} value={data.distributionId} onChange={(e) => upd("distributionId", e.target.value)}>
            {activeDistr.map((d) => (
              <option key={d.id} value={d.id}>{d.recipientName} — {d.denominationName} × {d.quantity}</option>
            ))}
          </select>
          {selected && (
            <p className="text-[11px] text-muted-foreground mt-1 m-0">Reason: {selected.reason}</p>
          )}
        </div>
        <div>
          <label htmlFor="reward-given" className={FORM_LABEL}>Reward Given *</label>
          <input id="reward-given" className={FORM_INPUT} value={data.reward} onChange={(e) => upd("reward", e.target.value)} placeholder="e.g. Stationery Kit, Book Voucher" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pts-used" className={FORM_LABEL}>Points Used *</label>
            <input id="pts-used" type="number" className={FORM_INPUT} value={data.pointsUsed || ""} onChange={(e) => upd("pointsUsed", Number(e.target.value))} placeholder="0" min={1} />
          </div>
          <div>
            <label htmlFor="red-date" className={FORM_LABEL}>Date</label>
            <DatePicker
              id="red-date"
              value={data.date || ""}
              onChange={(val) => upd("date", val)}
            />
          </div>
        </div>
        <UserActorSelect
          id="approved-by"
          label="Approved By"
          value={data.approvedByUserId || ""}
          onChange={(id) => upd("approvedByUserId", id)}
          allowEmpty
        />
      </div>
    </FormModal>
  );
}

export interface RedemptionTrackerProps {
  distributions: Distribution[];
  onUpdateDistributions: (dists: Distribution[]) => void;
}

export default function RedemptionTracker({ distributions, onUpdateDistributions }: RedemptionTrackerProps) {
  const redemptions = useLiveCollection<Redemption>("hasanat_redemptions", REDEMPTIONS);
  const [showModal, setShowModal] = useState(false);

  const saveRedemptions = useCallback((next: Redemption[]) => {
    saveCollection("hasanat_redemptions", next);
  }, []);

  const totalPts = redemptions.reduce((s: number, r: Redemption) => s + r.pointsUsed, 0);

  const handleSave = (r: Redemption) => {
    saveRedemptions([...redemptions, r]);
    onUpdateDistributions(distributions.map((d: Distribution) => d.id === r.distributionId ? { ...d, status: "redeemed" as const } : d));
    setShowModal(false);
  };

  return (
    <section aria-label="Redemption Tracker" className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-warning" aria-hidden="true" />
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
                    <td className="px-4 py-3 text-[13px] font-semibold text-foreground whitespace-nowrap">{r.studentName || "—"}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground">{r.reward}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-warning" aria-hidden="true" />
                        <span className="text-[13px] font-bold text-warning">{r.pointsUsed}</span>
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

      <RedeemModal open={showModal} distributions={distributions} onClose={() => setShowModal(false)} onSave={handleSave} />
    </section>
  );
}
