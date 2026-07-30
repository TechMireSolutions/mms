import React, { useState } from "react";
import { Gift } from "lucide-react";
import { Redemption, Distribution } from "@/lib/data/hasanatData";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { UserActorSelect } from "@/components/ui/UserActorSelect";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useUsersCollection } from "@/tenant/hooks/collections/users";
import { todayISO, type SystemUser } from "@mms/shared";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";

interface RedeemModalProps {
  open: boolean;
  distributions: Distribution[];
  onClose: () => void;
  onSave: (redemption: Redemption) => void | Promise<void>;
}

export function RedeemModal({ open, distributions, onClose, onSave }: RedeemModalProps) {
  const { t } = useTranslation();
  const activeDistributions = distributions.filter((distribution) => distribution.status === "active");
  const users = useUsersCollection() as unknown as SystemUser[];
  const [submitting, setSubmitting] = useState(false);
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
      saving={submitting}
      onSave={() => {
        void (async () => {
          const selectedUser = users.find((user) => user.id === data.approvedByUserId);
          const approvedBy = selectedUser ? selectedUser.name : (data.approvedByUserId ? `User #${data.approvedByUserId}` : '');
          setSubmitting(true);
          try {
            await onSave({
              ...data,
              id: `red${Date.now()}`,
              pointsUsed: Number(data.pointsUsed),
              studentName: selectedDistribution?.recipientName || "",
              approvedBy,
            } as Redemption);
          } finally {
            setSubmitting(false);
          }
        })();
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
            <p className="text-xs text-muted-foreground mt-1 m-0">{selectedDistribution.reason}</p>
          )}
        </div>
        <div>
          <label htmlFor="reward-given" className={FORM_LABEL}>{t("hasanat.columns.redemption.reward")} *</label>
          <Input id="reward-given" className={FORM_INPUT} value={data.reward} onChange={(event) => updateField("reward", event.target.value)} placeholder={t("hasanat.rewardPlaceholder")} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
