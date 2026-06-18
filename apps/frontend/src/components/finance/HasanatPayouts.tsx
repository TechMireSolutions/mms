import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, Gift, Plus } from "lucide-react";
import { HASANAT_PAYOUTS, HasanatPayout } from '@/lib/data/financeData';
import { DatePicker } from "../ui/DatePicker";
import FormModal from "../ui/FormModal";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import RegistryPersonSelect from "@/components/ui/RegistryPersonSelect";
import UserActorSelect from "@/components/ui/UserActorSelect";
import useTranslation from "@/hooks/useTranslation";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { saveCollection } from "@/lib/db";

interface PayoutModalProps {
  onClose: () => void;
  onSave: (payout: HasanatPayout) => void;
}

function PayoutModal({ onClose, onSave }: PayoutModalProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<Partial<HasanatPayout>>({
    studentId: "",
    class: "",
    pointsRedeemed: 0,
    rewardGiven: "",
    date: new Date().toISOString().split("T")[0],
    approvedByUserId: "",
  });

  const upd = (f: keyof HasanatPayout, v: HasanatPayout[keyof HasanatPayout]) => setData((d) => ({ ...d, [f]: v }));

  const handleSave = (): void => {
    onSave({
      ...data,
      id: `h${Date.now()}`,
      studentId: data.studentId || "",
      pointsRedeemed: Number(data.pointsRedeemed),
    } as HasanatPayout);
  };

  return (
    <FormModal
      open
      onClose={onClose}
      title={t("finance.hasanatPayoutTitle")}
      icon={Gift}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={handleSave}
      saveDisabled={!data.studentId || !data.pointsRedeemed || !data.rewardGiven}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <RegistryPersonSelect
            id="payout-student"
            kind="student"
            label={t("hasanat.fieldRecipient")}
            required
            value={data.studentId || ""}
            onChange={(id) => upd("studentId", id)}
          />
          <div>
            <label className={FORM_LABEL} htmlFor="payout-class">{t("finance.hasanatPayoutClass")}</label>
            <input id="payout-class" className={FORM_INPUT} value={data.class || ""} onChange={(e) => upd("class", e.target.value)} placeholder={t("finance.hasanatPayoutClassPlaceholder")} />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="payout-points">{t("finance.hasanatPayoutPoints")} *</label>
          <input id="payout-points" type="number" className={FORM_INPUT} value={data.pointsRedeemed || ""} onChange={(e) => upd("pointsRedeemed", e.target.value)} placeholder="0" min={0} required />
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="payout-reward">{t("finance.hasanatPayoutReward")} *</label>
          <input id="payout-reward" className={FORM_INPUT} value={data.rewardGiven || ""} onChange={(e) => upd("rewardGiven", e.target.value)} placeholder={t("finance.hasanatPayoutRewardPlaceholder")} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="payout-date">{t("finance.hasanatPayoutDate")}</label>
            <DatePicker
              id="payout-date"
              value={data.date || ""}
              onChange={(val) => upd("date", val)}
            />
          </div>
          <UserActorSelect
            id="payout-approvedBy"
            label={t("finance.hasanatPayoutApprovedBy")}
            value={data.approvedByUserId || ""}
            onChange={(id) => upd("approvedByUserId", id)}
            allowEmpty
          />
        </div>
      </div>
    </FormModal>
  );
}

/**
 * HasanatPayouts Component
 *
 * Manages the records for hasanat points earned and redeemed.
 */
export default function HasanatPayouts() {
  const { t } = useTranslation();
  const payouts = useLiveCollection<HasanatPayout>("hasanat_payouts", HASANAT_PAYOUTS);
  const [showModal, setShowModal] = useState(false);

  const savePayouts = useCallback((next: HasanatPayout[]) => {
    saveCollection("hasanat_payouts", next);
  }, []);

  const totalRedeemed = payouts.reduce((s, p) => s + p.pointsRedeemed, 0);
  const totalEarned = payouts.reduce((s, p) => s + p.pointsEarned, 0);

  const handleSave = (payout: HasanatPayout) => {
    savePayouts([...payouts, { ...payout, pointsEarned: payout.pointsRedeemed }]);
    setShowModal(false);
  };

  return (
    <section aria-label={t("finance.hasanatPayoutsSection")} className="space-y-4">
      <div className="grid grid-cols-3 gap-3" aria-label={t("finance.hasanatPayoutSummary")}>
        {[
          { label: t("finance.hasanatPayoutTotalEarned"), value: totalEarned, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
          { label: t("finance.hasanatPayoutTotalRedeemed"), value: totalRedeemed, color: "text-primary", bg: "bg-primary/10", border: "border-primary/10" },
          { label: t("finance.hasanatPayoutUnredeemed"), value: totalEarned - totalRedeemed, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
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
        <p className="text-sm font-semibold text-foreground m-0">{t("finance.hasanatPayoutRecordCount", { count: payouts.length })}</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("finance.hasanatPayoutRecord")}
        </button>
      </header>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{t("finance.hasanatPayoutsSection")}</caption>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[t("finance.hasanatPayoutColStudent"), t("finance.hasanatPayoutClass"), t("finance.hasanatPayoutColEarned"), t("finance.hasanatPayoutColRedeemed"), t("finance.hasanatPayoutReward"), t("finance.hasanatPayoutDate"), t("finance.hasanatPayoutApprovedBy")].map((h) => (
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
                  <td className="px-4 py-3 text-[13px] font-semibold text-foreground whitespace-nowrap">{p.studentName || "—"}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{p.class}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" aria-label={t("finance.hasanatPayoutEarnedAria", { points: p.pointsEarned })}>
                      <Star className="w-3 h-3 text-warning" aria-hidden="true" />
                      <span className="text-[13px] font-bold text-warning">{p.pointsEarned}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.pointsRedeemed > 0 ? (
                      <div className="flex items-center gap-1" aria-label={t("finance.hasanatPayoutRedeemedAria", { points: p.pointsRedeemed })}>
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

      {showModal ? <PayoutModal onClose={() => setShowModal(false)} onSave={handleSave} /> : null}
    </section>
  );
}
