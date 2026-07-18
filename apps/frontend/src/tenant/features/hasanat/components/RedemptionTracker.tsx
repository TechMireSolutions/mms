import React, { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Gift, Plus, Star } from "lucide-react";
import { Redemption, Distribution } from '@/lib/data/hasanatData';
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { UserActorSelect } from "@/components/ui/UserActorSelect";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useUsersCollection } from "@/tenant/features/users/hooks/useUsersApi";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { formatDate, todayISO, type SystemUser } from "@mms/shared";
import { useHasanatRedemptionsCollection, useHasanatMutations } from "@/tenant/features/hasanat/hooks/useHasanatApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";



interface RedeemModalProps {
  open: boolean;
  distributions: Distribution[];
  onClose: () => void;
  onSave: (redemption: Redemption) => void;
}

function RedeemModal({ open, distributions, onClose, onSave }: RedeemModalProps) {
  const { t } = useTranslation();
  const activeDistributions = distributions.filter((distribution) => distribution.status === "active");
  const users = useUsersCollection() as unknown as SystemUser[];
  const [data, setData] = useState<Partial<Redemption>>({
    distributionId: activeDistributions[0]?.id || "",
    reward: "",
    pointsUsed: 0,
    date: todayISO(),
    approvedByUserId: "",
  });

  const updateField = <K extends keyof Redemption>(field: K, value: Redemption[K]) => setData((previousData: Partial<Redemption>) => ({ ...previousData, [field]: value }));
  const selectedDistribution = activeDistributions.find((distribution) => distribution.id === data.distributionId);

  React.useEffect(() => {
    if (open) {
      const active = distributions.filter((distribution) => distribution.status === "active");
      setData({
        distributionId: active[0]?.id || "",
        reward: "",
        pointsUsed: 0,
        date: todayISO(),
        approvedByUserId: "",
      });
    }
  }, [open, distributions]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("hasanat.recordRedemption")}
      icon={Gift}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={() => {
        const selectedUser = users.find((user) => user.id === data.approvedByUserId);
        const approvedBy = selectedUser ? selectedUser.name : (data.approvedByUserId ? `User #${data.approvedByUserId}` : '');
        onSave({
          ...data,
          id: `red${Date.now()}`,
          pointsUsed: Number(data.pointsUsed),
          studentName: selectedDistribution?.recipientName || "",
          approvedBy,
        } as Redemption);
      }}
      saveDisabled={!data.distributionId || !data.reward || !data.pointsUsed}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="dist-sel" className={FORM_LABEL}>{t("hasanat.fieldRecipient")} *</label>
          <FormSelect
            id="dist-sel"
            value={data.distributionId || ""}
            onChange={(value) => updateField("distributionId", value)}
            options={activeDistributions.map((distribution) => ({
              value: distribution.id,
              label: `${distribution.recipientName} — ${distribution.denominationName} × ${distribution.quantity}`
            }))}
          />
          {selectedDistribution && (
            <p className="text-[11px] text-muted-foreground mt-1 m-0">{selectedDistribution.reason}</p>
          )}
        </div>
        <div>
          <label htmlFor="reward-given" className={FORM_LABEL}>{t("hasanat.columns.redemption.reward")} *</label>
          <Input id="reward-given" className={FORM_INPUT} value={data.reward} onChange={(event) => updateField("reward", event.target.value)} placeholder={t("hasanat.rewardPlaceholder")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pts-used" className={FORM_LABEL}>{t("hasanat.columns.redemption.pointsUsed")} *</label>
            <Input id="pts-used" type="number" className={FORM_INPUT} value={data.pointsUsed || ""} onChange={(event) => updateField("pointsUsed", Number(event.target.value))} placeholder="0" min={1} />
          </div>
          <div>
            <label htmlFor="red-date" className={FORM_LABEL}>{t("hasanat.columns.redemption.date")}</label>
            <DatePicker
              id="red-date"
              value={data.date || ""}
              onChange={(value) => updateField("date", value)}
            />
          </div>
        </div>
        <UserActorSelect
          id="approved-by"
          label={t("hasanat.columns.redemption.approvedBy")}
          value={data.approvedByUserId || ""}
          onChange={(id) => updateField("approvedByUserId", id)}
          allowEmpty
        />
      </div>
    </FormModal>
  );
}

export interface RedemptionTrackerProps {
  distributions: Distribution[];
  onUpdateDistributions: (distributions: Distribution[]) => void;
  onFilteredCountChange?: (count: number) => void;
  isColumnVisible?: (key: string) => boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

export function RedemptionTracker({
  distributions,
  onUpdateDistributions,
  onFilteredCountChange,
  isColumnVisible,
  columnCustomizer,
}: RedemptionTrackerProps) {
  const { t } = useTranslation();
  const redemptions = useHasanatRedemptionsCollection();
  const { replaceRedemptions } = useHasanatMutations();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    onFilteredCountChange?.(redemptions.length);
  }, [redemptions.length, onFilteredCountChange]);

  const saveRedemptions = useCallback((next: Redemption[]) => {
    replaceRedemptions.mutate(next);
  }, [replaceRedemptions]);

  const totalPoints = redemptions.reduce((sum: number, redemption: Redemption) => sum + redemption.pointsUsed, 0);

  const handleSave = (redemption: Redemption) => {
    saveRedemptions([...redemptions, redemption]);
    onUpdateDistributions(distributions.map((distribution: Distribution) => distribution.id === redemption.distributionId ? { ...distribution, status: "redeemed" as const } : distribution));
    setShowModal(false);
  };

  const showStudent = isColumnVisible ? isColumnVisible("student") : true;
  const showReward = isColumnVisible ? isColumnVisible("reward") : true;
  const showPointsUsed = isColumnVisible ? isColumnVisible("pointsUsed") : true;
  const showDate = isColumnVisible ? isColumnVisible("date") : true;
  const showApprovedBy = isColumnVisible ? isColumnVisible("approvedBy") : true;

  return (
    <section aria-label={t("hasanat.tabs.redemptions")} className="space-y-4">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-warning" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground m-0">
            {t("hasanat.redemptionsSummary", { count: redemptions.length, points: totalPoints.toLocaleString() })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {columnCustomizer && (
            <ModuleColumnCustomizer
              columnRegistry={columnCustomizer.columnRegistry}
              updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
              labels={columnCustomizer.labels}
            />
          )}
          <Button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("hasanat.recordRedemption")}
          </Button>
        </div>
      </header>

      {redemptions.length === 0 ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">{t("hasanat.empty.redemptions")}</p>
        </div>
      ) : (
        <Card accentColor="primary" className="shadow-sm hover:shadow-md border-border/80 p-0 overflow-hidden bg-card/45 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("hasanat.tabs.redemptions")}</caption>
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {showStudent && (
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {t("hasanat.columns.redemption.student")}
                    </th>
                  )}
                  {showReward && (
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {t("hasanat.columns.redemption.reward")}
                    </th>
                  )}
                  {showPointsUsed && (
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {t("hasanat.columns.redemption.pointsUsed")}
                    </th>
                  )}
                  {showDate && (
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {t("hasanat.columns.redemption.date")}
                    </th>
                  )}
                  {showApprovedBy && (
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {t("hasanat.columns.redemption.approvedBy")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {redemptions.map((redemption, index) => (
                  <motion.tr key={redemption.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.04 }} className="hover:bg-muted/20 transition-colors">
                    {showStudent && (
                      <td className="px-4 py-3 text-[13px] font-semibold text-foreground whitespace-nowrap">{redemption.studentName || "—"}</td>
                    )}
                    {showReward && (
                      <td className="px-4 py-3 text-[13px] text-foreground">{redemption.reward}</td>
                    )}
                    {showPointsUsed && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-warning" aria-hidden="true" />
                          <span className="text-[13px] font-bold text-warning">{redemption.pointsUsed}</span>
                        </div>
                      </td>
                    )}
                    {showDate && (
                      <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{formatDate(redemption.date)}</td>
                    )}
                    {showApprovedBy && (
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{redemption.approvedBy || "—"}</td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <RedeemModal open={showModal} distributions={distributions} onClose={() => setShowModal(false)} onSave={handleSave} />
    </section>
  );
}
