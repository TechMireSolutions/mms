import type React from "react";
import { CreditCard } from "lucide-react";
import { EditableSelect, Field } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard } from "./ContactSubListCards";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type ContactBankDetail,
  DEFAULT_BANK_NAMES,
  DEFAULT_BANK_ACCOUNT_TYPES,
} from "@mms/shared";
import { SUB_LIST_CARD_ACCENTS } from "@/lib/semanticTone";
import { FORM_INPUT_ERROR } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

export interface ContactBankDetailCardProps {
  bankDetail: ContactBankDetail;
  idx: number;
  formInstanceId: string;
  bankNameOptions?: string[];
  onUpdateBankNameOptions?: (options: string[]) => void;
  accountTypeOptions?: string[];
  onUpdateAccountTypeOptions?: (options: string[]) => void;
  showBankName: boolean;
  showAccountType: boolean;
  showAccountNumber: boolean;
  isFieldRequired?: (group: string, field: string) => boolean;
  getListItemError?: (group: string, field: string, index: number) => string | undefined;
  getLocalId: (group: string, index: number) => string;
  updateBankDetail: (idx: number, patch: Partial<ContactBankDetail> & Record<string, unknown>) => void;
  removeBankDetail: (idx: number) => void;
}

export function ContactBankDetailCard({
  bankDetail,
  idx,
  formInstanceId,
  bankNameOptions = DEFAULT_BANK_NAMES,
  onUpdateBankNameOptions,
  accountTypeOptions = DEFAULT_BANK_ACCOUNT_TYPES,
  onUpdateAccountTypeOptions,
  showBankName,
  showAccountType,
  showAccountNumber,
  getListItemError,
  getLocalId,
  updateBankDetail,
  removeBankDetail,
}: ContactBankDetailCardProps): React.JSX.Element {
  const { t } = useTranslation();

  const bankNameError = getListItemError?.("bankDetails", "bankName", idx);
  const accountTypeError = getListItemError?.("bankDetails", "accountType", idx);
  const accountNumberError = getListItemError?.("bankDetails", "accountNumber", idx);

  return (
    <ListFieldCard
      id={getLocalId("bankDetails", idx)}
      index={idx}
      accentClass={SUB_LIST_CARD_ACCENTS.bankDetails.accent}
      label={t("contacts.form.bankAccountSequence", { index: idx + 1 })}
      onRemove={() => removeBankDetail(idx)}
      removeLabel={t("contacts.form.removeBankDetail", { index: idx + 1 })}
    >
      <div className="grid grid-cols-1 gap-4 w-full">
        {/* Field 1: Bank Name */}
        {showBankName && (
          <Field
            label={t("contacts.fields.bankName")}
            required={false}
            error={bankNameError}
            id={`cf-${formInstanceId}-bank-name-${idx}`}
          >
            <EditableSelect
              id={`cf-${formInstanceId}-bank-name-${idx}`}
              name={`cf-${formInstanceId}-bank-name-${idx}`}
              options={bankNameOptions}
              value={bankDetail.bankName || ""}
              onChange={(val) => updateBankDetail(idx, { bankName: val })}
              onUpdateOptions={onUpdateBankNameOptions}
              className="w-full"
              placeholder={t("contacts.fields.bankNamePlaceholder")}
            />
          </Field>
        )}

        {/* Field 2: Account Type */}
        {showAccountType && (
          <Field
            label={t("contacts.fields.bankAccountType")}
            required={false}
            error={accountTypeError}
            id={`cf-${formInstanceId}-bank-type-${idx}`}
          >
            <EditableSelect
              id={`cf-${formInstanceId}-bank-type-${idx}`}
              name={`cf-${formInstanceId}-bank-type-${idx}`}
              options={accountTypeOptions}
              value={bankDetail.accountType || ""}
              onChange={(val) => updateBankDetail(idx, { accountType: val })}
              onUpdateOptions={onUpdateAccountTypeOptions}
              className="w-full"
              placeholder={t("contacts.fields.bankAccountTypePlaceholder")}
            />
          </Field>
        )}

        {/* Field 3: Account Number / IBAN */}
        {showAccountNumber && (
          <Field
            label={t("contacts.fields.bankAccountNumber")}
            required={false}
            error={accountNumberError}
            id={`cf-${formInstanceId}-bank-acc-no-${idx}`}
          >
            <LeadingIconInput
              icon={CreditCard}
              id={`cf-${formInstanceId}-bank-acc-no-${idx}`}
              name={`cf-${formInstanceId}-bank-acc-no-${idx}`}
              spellCheck={false}
              enterKeyHint="done"
              aria-invalid={Boolean(accountNumberError)}
              className={cn("font-mono", accountNumberError && FORM_INPUT_ERROR)}
              value={bankDetail.accountNumber || ""}
              onChange={(e) => updateBankDetail(idx, { accountNumber: e.target.value })}
              placeholder={t("contacts.fields.bankAccountNumberPlaceholder")}
            />
          </Field>
        )}
      </div>
    </ListFieldCard>
  );
}
