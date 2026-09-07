import React, { useState } from "react";
import { Gift } from "lucide-react";
import { type Redemption, type Distribution } from "@/lib/data/hasanatData";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { FieldErrorMessage, RequiredMark } from "@/components/ui/FormPrimitives";
import { UserActorSelect } from "@/components/ui/UserActorSelect";
import { FORM_INPUT, FORM_INPUT_ERROR, FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { todayISO } from "@mms/shared";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { cn } from "@/lib/utils";

interface RedeemModalProps {
  open: boolean;
  distributions: Distribution[];
  onClose: () => void;
  onSave: (redemption: Redemption) => void | Promise<void>;
}

export function RedeemModal({ open, distributions, onClose, onSave }: RedeemModalProps) {
  const { t } = useTranslation();
  const activeDistributions = distributions.filter((distribution) => distribution.status === "active");
  const [approvedByName, setApprovedByName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [data, setData] = useState<Partial<Redemption>>({
    distributionId: activeDistributions[0]?.id || "",
    reward: "",
    pointsUsed: 0,
    date: todayISO(),
    approvedByUserId: "",
  });

  const updateField = <K extends keyof Redemption>(field: K, value: Redemption[K]) => {
    setData((previousData: Partial<Redemption>) => ({ ...previousData, [field]: value }));
    if (errors[field as string]) {
      setErrors((previousErrors) => {
        const next = { ...previousErrors };
        delete next[field as string];
        return next;
      });
    }
  };

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
      setApprovedByName("");
      setErrors({});
      setSubmitError(null);
    }
  }, [open, distributions]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!data.distributionId) {
      newErrors.distributionId = t("common.required");
    }
    if (!data.reward?.trim()) {
      newErrors.reward = t("common.required");
    }
    if (!data.pointsUsed || Number(data.pointsUsed) < 1) {
      newErrors.pointsUsed = t("common.required");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitError(t("common.formPleaseFixErrors"));
      return;
    }

    setSubmitError(null);
    const approvedBy = approvedByName || (data.approvedByUserId ? `User #${data.approvedByUserId}` : "");
    setSubmitting(true);
    try {
      await onSave({
        ...data,
        id: `red${crypto.randomUUID()}`,
        pointsUsed: Number(data.pointsUsed),
        studentName: selectedDistribution?.recipientName || "",
        approvedBy,
      } as Redemption);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("hasanat.recordRedemption")}
      icon={Gift}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      saving={submitting}
      error={submitError || undefined}
      onSave={handleSave}
      saveDisabled={activeDistributions.length === 0}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="dist-sel" className={FORM_LABEL}>{t("hasanat.fieldRecipient")}<RequiredMark /></label>
          <FormSelect
            id="dist-sel"
            name="distributionId"
            value={data.distributionId || ""}
            onChange={(value) => updateField("distributionId", value)}
            aria-invalid={Boolean(errors.distributionId)}
            aria-describedby={errors.distributionId ? "dist-sel-error" : undefined}
            className={errors.distributionId ? FORM_INPUT_ERROR : undefined}
            options={activeDistributions.map((distribution) => ({
              value: distribution.id,
              label: `${distribution.recipientName} — ${distribution.denominationName} × ${distribution.quantity}`,
            }))}
          />
          <FieldErrorMessage id="dist-sel-error" message={errors.distributionId} />
          {selectedDistribution && (
            <p className="text-xs text-muted-foreground mt-1 m-0">{selectedDistribution.reason}</p>
          )}
        </div>
        <div>
          <label htmlFor="reward-given" className={FORM_LABEL}>{t("hasanat.columns.redemption.reward")}<RequiredMark /></label>
          <Input
            id="reward-given"
            name="reward"
            className={cn(FORM_INPUT, errors.reward && FORM_INPUT_ERROR)}
            value={data.reward || ""}
            onChange={(event) => updateField("reward", event.target.value)}
            placeholder={t("hasanat.rewardPlaceholder")}
            aria-invalid={Boolean(errors.reward)}
            aria-describedby={errors.reward ? "reward-error" : undefined}
          />
          <FieldErrorMessage id="reward-error" message={errors.reward} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="pts-used" className={FORM_LABEL}>{t("hasanat.columns.redemption.pointsUsed")}<RequiredMark /></label>
            <Input
              id="pts-used"
              name="pointsUsed"
              type="number"
              inputMode="numeric"
              className={cn(FORM_INPUT, errors.pointsUsed && FORM_INPUT_ERROR)}
              value={data.pointsUsed || ""}
              onChange={(event) => updateField("pointsUsed", Number(event.target.value))}
              placeholder="0"
              min={1}
              aria-invalid={Boolean(errors.pointsUsed)}
              aria-describedby={errors.pointsUsed ? "pts-used-error" : undefined}
            />
            <FieldErrorMessage id="pts-used-error" message={errors.pointsUsed} />
          </div>
          <div>
            <label htmlFor="red-date" className={FORM_LABEL}>{t("hasanat.columns.redemption.date")}</label>
            <DatePicker
              id="red-date"
              name="date"
              value={data.date || ""}
              onChange={(value) => updateField("date", value)}
            />
          </div>
        </div>
        <UserActorSelect
          id="approved-by"
          label={t("hasanat.columns.redemption.approvedBy")}
          value={data.approvedByUserId || ""}
          onChange={(id, name) => {
            updateField("approvedByUserId", id);
            setApprovedByName(name ?? "");
          }}
          allowEmpty
        />
      </div>
    </FormModal>
  );
}
