import { AlertTriangle } from "lucide-react";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import type { WizardFormState } from "./simpleTransactionWizardTypes";

export interface AccountLegConfig {
  id: string;
  label: string;
  field: "debitAcc" | "creditAcc";
  options: { value: string; label: string }[];
}

interface SimpleTransactionAccountLegsProps {
  prefix: string;
  leg1: AccountLegConfig;
  leg2: AccountLegConfig;
  form: WizardFormState;
  onAccountChange: (field: "debitAcc" | "creditAcc", accountId: string) => void;
  showLowBalanceWarning: boolean;
  isSameAccount: boolean;
}

export function SimpleTransactionAccountLegs({
  prefix,
  leg1,
  leg2,
  form,
  onAccountChange,
  showLowBalanceWarning,
  isSameAccount,
}: SimpleTransactionAccountLegsProps) {
  const { t } = useTranslation();
  const selectAccountPlaceholder = t("accounting.journal.form.selectAccount");

  return (
    <>
      <div>
        <label htmlFor={leg1.id} className={FORM_LABEL}>{leg1.label}</label>
        <FormSelect
          id={leg1.id}
          name={leg1.field}
          value={form[leg1.field]}
          onChange={(accountId) => onAccountChange(leg1.field, accountId)}
          options={leg1.options}
          placeholder={selectAccountPlaceholder}
          aria-invalid={isSameAccount}
          aria-describedby={isSameAccount ? `${prefix}-account-same-error` : undefined}
        />
        {showLowBalanceWarning && leg1.field === "creditAcc" && (
          <p className="flex items-center gap-1 text-xs text-warning mt-1">
            <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
            {t("accounting.journal.dashboard.wizard.lowBalanceWarning")}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={leg2.id} className={FORM_LABEL}>{leg2.label}</label>
        <FormSelect
          id={leg2.id}
          name={leg2.field}
          value={form[leg2.field]}
          onChange={(accountId) => onAccountChange(leg2.field, accountId)}
          options={leg2.options}
          placeholder={selectAccountPlaceholder}
          aria-invalid={isSameAccount}
          aria-describedby={isSameAccount ? `${prefix}-account-same-error` : undefined}
        />
      </div>

      {isSameAccount && (
        <div className="sm:col-span-2">
          <p id={`${prefix}-account-same-error`} className="text-xs text-destructive m-0" role="alert">
            {t("accounting.journal.dashboard.wizard.errorSameAccount")}
          </p>
        </div>
      )}
    </>
  );
}
