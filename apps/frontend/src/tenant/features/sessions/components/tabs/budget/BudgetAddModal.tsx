import React from "react";
import { Wallet } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import type { Class } from "@/lib/data/sessionsData";

interface BudgetAddModalProps {
  open: boolean;
  onClose: () => void;
  budgetType: "income" | "expense";
  classes: Class[];
  targetClassId: string;
  onTargetClassIdChange: (id: string) => void;
  detail: string;
  onDetailChange: (detail: string) => void;
  amount: number;
  onAmountChange: (amount: number) => void;
  currencyLabel: string;
  saving: boolean;
  onSave: () => Promise<void> | void;
}

export function BudgetAddModal({
  open,
  onClose,
  budgetType,
  classes,
  targetClassId,
  onTargetClassIdChange,
  detail,
  onDetailChange,
  amount,
  onAmountChange,
  currencyLabel,
  saving,
  onSave,
}: BudgetAddModalProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={budgetType === "income" ? t("sessions.budget.addIncomeTitle") : t("sessions.budget.addExpenseTitle")}
      icon={Wallet}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={onSave}
      saving={saving}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="target-class">Target Class</label>
          <FormSelect
            id="target-class"
            name="targetClassId"
            value={targetClassId}
            onChange={onTargetClassIdChange}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            className="w-full"
          />
        </div>

        <div>
          <label className={FORM_LABEL} htmlFor="budget-detail">Detail / Description</label>
          <Input
            id="budget-detail"
            value={detail}
            onChange={(e) => onDetailChange(e.target.value)}
            placeholder={t("sessions.budget.detailPlaceholder")}
          />
        </div>

        <div>
          <label className={FORM_LABEL} htmlFor="budget-amount">
            {currencyLabel
              ? t("sessions.budget.form.amount", { currency: currencyLabel })
              : t("sessions.budget.form.amountPlain")}
          </label>
          <Input
            id="budget-amount"
            type="number"
            min={0}
            value={amount || ""}
            onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
    </FormModal>
  );
}
