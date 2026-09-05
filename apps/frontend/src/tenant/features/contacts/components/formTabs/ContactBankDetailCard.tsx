import type React from "react";
import { Building2, CreditCard, Globe, MapPin, User, Landmark, Hash } from "lucide-react";
import { CardPrimaryButton, EditableSelect, Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard } from "./ContactSubListCards";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type ContactBankDetail,
  DEFAULT_BANK_LABELS,
  DEFAULT_BANK_CURRENCIES,
} from "@mms/shared";
import { SUB_LIST_CARD_ACCENTS } from "@/lib/semanticTone";
import { FORM_INPUT_ERROR } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

export interface ContactBankDetailCardProps {
  bankDetail: ContactBankDetail;
  idx: number;
  formInstanceId: string;
  labelOptions?: string[];
  onUpdateLabelOptions?: (options: string[]) => void;
  currencyOptions?: string[];
  showBankName: boolean;
  showAccountTitle: boolean;
  showAccountNumber: boolean;
  showIban: boolean;
  showSwiftCode: boolean;
  showBranchName: boolean;
  showBranchCode: boolean;
  showRoutingNumber: boolean;
  showCurrency: boolean;
  showIsPrimary: boolean;
  isFieldRequired: (group: string, field: string) => boolean;
  getListItemError: (group: string, field: string, index: number) => string | undefined;
  getLocalId: (group: string, index: number) => string;
  onSetPrimary?: () => void;
  updateBankDetail: (idx: number, patch: Partial<ContactBankDetail> & Record<string, unknown>) => void;
  removeBankDetail: (idx: number) => void;
}

export function ContactBankDetailCard({
  bankDetail,
  idx,
  formInstanceId,
  labelOptions = DEFAULT_BANK_LABELS,
  onUpdateLabelOptions,
  currencyOptions = DEFAULT_BANK_CURRENCIES,
  showBankName,
  showAccountTitle,
  showAccountNumber,
  showIban,
  showSwiftCode,
  showBranchName,
  showBranchCode,
  showRoutingNumber,
  showCurrency,
  showIsPrimary,
  isFieldRequired,
  getListItemError,
  getLocalId,
  onSetPrimary,
  updateBankDetail,
  removeBankDetail,
}: ContactBankDetailCardProps): React.JSX.Element {
  const { t } = useTranslation();

  const bankNameError = getListItemError("bankDetails", "bankName", idx);
  const accountTitleError = getListItemError("bankDetails", "accountTitle", idx);
  const accountNumberError = getListItemError("bankDetails", "accountNumber", idx);
  const ibanError = getListItemError("bankDetails", "iban", idx);
  const swiftCodeError = getListItemError("bankDetails", "swiftCode", idx);
  const branchNameError = getListItemError("bankDetails", "branchName", idx);
  const branchCodeError = getListItemError("bankDetails", "branchCode", idx);
  const routingNumberError = getListItemError("bankDetails", "routingNumber", idx);

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    updateBankDetail(idx, { iban: raw });
  };

  const handleSwiftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    updateBankDetail(idx, { swiftCode: raw });
  };

  return (
    <ListFieldCard
      id={getLocalId("bankDetails", idx)}
      index={idx}
      accentClass={SUB_LIST_CARD_ACCENTS.bankDetails.accent}
      label={`${t("contacts.fields.bankDetailsLabel")}:`}
      typeSelect={
        <EditableSelect
          options={labelOptions}
          value={bankDetail.label || labelOptions[0] || "Primary"}
          onChange={(val) => updateBankDetail(idx, { label: val })}
          onUpdateOptions={onUpdateLabelOptions}
          className="w-36 @sm:w-44 min-w-0"
          id={`cf-${formInstanceId}-bank-label-${idx}`}
          name={`cf-${formInstanceId}-bank-label-${idx}`}
          placeholder={t("contacts.fields.bankLabel")}
        />
      }
      headerExtras={
        showIsPrimary ? (
          <CardPrimaryButton
            isPrimary={Boolean(bankDetail.isPrimary)}
            onClick={() => onSetPrimary?.()}
            title={t("contacts.fields.bankIsPrimary")}
            ariaLabel={t("contacts.fields.bankIsPrimary")}
            primaryLabel={t("contacts.form.primary")}
            setPrimaryLabel={t("contacts.form.setPrimary")}
          />
        ) : undefined
      }
      onRemove={() => removeBankDetail(idx)}
      removeLabel={t("contacts.form.removeBankDetail", { index: idx + 1 })}
    >
      <div className="space-y-3">
        {/* Row 1: Bank Name & Account Title */}
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
          {showBankName && (
            <Field
              label={t("contacts.fields.bankName")}
              required={isFieldRequired("bankDetails", "bankName")}
              error={bankNameError}
              id={`cf-${formInstanceId}-bank-name-${idx}`}
            >
              <LeadingIconInput
                icon={Landmark}
                id={`cf-${formInstanceId}-bank-name-${idx}`}
                name={`cf-${formInstanceId}-bank-name-${idx}`}
                autoCapitalize="words"
                enterKeyHint="next"
                aria-invalid={Boolean(bankNameError)}
                value={bankDetail.bankName || ""}
                onChange={(e) => updateBankDetail(idx, { bankName: e.target.value })}
                placeholder={t("contacts.fields.bankNamePlaceholder")}
                className={cn(bankNameError && FORM_INPUT_ERROR)}
              />
            </Field>
          )}

          {showAccountTitle && (
            <Field
              label={t("contacts.fields.bankAccountTitle")}
              required={isFieldRequired("bankDetails", "accountTitle")}
              error={accountTitleError}
              id={`cf-${formInstanceId}-bank-title-${idx}`}
            >
              <LeadingIconInput
                icon={User}
                id={`cf-${formInstanceId}-bank-title-${idx}`}
                name={`cf-${formInstanceId}-bank-title-${idx}`}
                autoCapitalize="words"
                enterKeyHint="next"
                aria-invalid={Boolean(accountTitleError)}
                value={bankDetail.accountTitle || ""}
                onChange={(e) => updateBankDetail(idx, { accountTitle: e.target.value })}
                placeholder={t("contacts.fields.bankAccountTitlePlaceholder")}
                className={cn(accountTitleError && FORM_INPUT_ERROR)}
              />
            </Field>
          )}
        </div>

        {/* Row 2: Account Number & Currency */}
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-3">
          {showAccountNumber && (
            <div className="@sm:col-span-2">
              <Field
                label={t("contacts.fields.bankAccountNumber")}
                required={isFieldRequired("bankDetails", "accountNumber")}
                error={accountNumberError}
                id={`cf-${formInstanceId}-bank-acc-no-${idx}`}
              >
                <LeadingIconInput
                  icon={CreditCard}
                  id={`cf-${formInstanceId}-bank-acc-no-${idx}`}
                  name={`cf-${formInstanceId}-bank-acc-no-${idx}`}
                  inputMode="numeric"
                  spellCheck={false}
                  enterKeyHint="next"
                  aria-invalid={Boolean(accountNumberError)}
                  className={cn("font-mono", accountNumberError && FORM_INPUT_ERROR)}
                  value={bankDetail.accountNumber || ""}
                  onChange={(e) => updateBankDetail(idx, { accountNumber: e.target.value })}
                  placeholder={t("contacts.fields.bankAccountNumberPlaceholder")}
                />
              </Field>
            </div>
          )}

          {showCurrency && (
            <Field
              label={t("contacts.fields.bankCurrency")}
              id={`cf-${formInstanceId}-bank-currency-${idx}`}
            >
              <FormSelect
                id={`cf-${formInstanceId}-bank-currency-${idx}`}
                name={`cf-${formInstanceId}-bank-currency-${idx}`}
                value={bankDetail.currency || "PKR"}
                onChange={(val) => updateBankDetail(idx, { currency: val })}
                options={currencyOptions}
                aria-label={t("contacts.fields.bankCurrency")}
                className="w-full"
              />
            </Field>
          )}
        </div>

        {/* Row 3: IBAN & SWIFT / BIC */}
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
          {showIban && (
            <Field
              label={t("contacts.fields.bankIban")}
              required={isFieldRequired("bankDetails", "iban")}
              error={ibanError}
              id={`cf-${formInstanceId}-bank-iban-${idx}`}
            >
              <LeadingIconInput
                icon={Globe}
                id={`cf-${formInstanceId}-bank-iban-${idx}`}
                name={`cf-${formInstanceId}-bank-iban-${idx}`}
                spellCheck={false}
                enterKeyHint="next"
                aria-invalid={Boolean(ibanError)}
                className={cn("font-mono uppercase tracking-wider", ibanError && FORM_INPUT_ERROR)}
                value={bankDetail.iban || ""}
                onChange={handleIbanChange}
                placeholder={t("contacts.fields.bankIbanPlaceholder")}
              />
            </Field>
          )}

          {showSwiftCode && (
            <Field
              label={t("contacts.fields.bankSwiftCode")}
              required={isFieldRequired("bankDetails", "swiftCode")}
              error={swiftCodeError}
              id={`cf-${formInstanceId}-bank-swift-${idx}`}
            >
              <LeadingIconInput
                icon={Building2}
                id={`cf-${formInstanceId}-bank-swift-${idx}`}
                name={`cf-${formInstanceId}-bank-swift-${idx}`}
                spellCheck={false}
                enterKeyHint="next"
                aria-invalid={Boolean(swiftCodeError)}
                className={cn("font-mono uppercase tracking-wider", swiftCodeError && FORM_INPUT_ERROR)}
                value={bankDetail.swiftCode || ""}
                onChange={handleSwiftChange}
                placeholder={t("contacts.fields.bankSwiftPlaceholder")}
              />
            </Field>
          )}
        </div>

        {/* Row 4: Branch Name, Branch Code & Routing Number */}
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-3">
          {showBranchName && (
            <Field
              label={t("contacts.fields.bankBranchName")}
              required={isFieldRequired("bankDetails", "branchName")}
              error={branchNameError}
              id={`cf-${formInstanceId}-bank-branch-name-${idx}`}
            >
              <LeadingIconInput
                icon={MapPin}
                id={`cf-${formInstanceId}-bank-branch-name-${idx}`}
                name={`cf-${formInstanceId}-bank-branch-name-${idx}`}
                autoCapitalize="words"
                enterKeyHint="next"
                aria-invalid={Boolean(branchNameError)}
                value={bankDetail.branchName || ""}
                onChange={(e) => updateBankDetail(idx, { branchName: e.target.value })}
                placeholder={t("contacts.fields.bankBranchNamePlaceholder")}
                className={cn(branchNameError && FORM_INPUT_ERROR)}
              />
            </Field>
          )}

          {showBranchCode && (
            <Field
              label={t("contacts.fields.bankBranchCode")}
              required={isFieldRequired("bankDetails", "branchCode")}
              error={branchCodeError}
              id={`cf-${formInstanceId}-bank-branch-code-${idx}`}
            >
              <LeadingIconInput
                icon={Hash}
                id={`cf-${formInstanceId}-bank-branch-code-${idx}`}
                name={`cf-${formInstanceId}-bank-branch-code-${idx}`}
                spellCheck={false}
                enterKeyHint="next"
                aria-invalid={Boolean(branchCodeError)}
                className={cn("font-mono", branchCodeError && FORM_INPUT_ERROR)}
                value={bankDetail.branchCode || ""}
                onChange={(e) => updateBankDetail(idx, { branchCode: e.target.value })}
                placeholder={t("contacts.fields.bankBranchCodePlaceholder")}
              />
            </Field>
          )}

          {showRoutingNumber && (
            <Field
              label={t("contacts.fields.bankRoutingNumber")}
              required={isFieldRequired("bankDetails", "routingNumber")}
              error={routingNumberError}
              id={`cf-${formInstanceId}-bank-routing-${idx}`}
            >
              <LeadingIconInput
                icon={Hash}
                id={`cf-${formInstanceId}-bank-routing-${idx}`}
                name={`cf-${formInstanceId}-bank-routing-${idx}`}
                spellCheck={false}
                enterKeyHint="done"
                aria-invalid={Boolean(routingNumberError)}
                className={cn("font-mono", routingNumberError && FORM_INPUT_ERROR)}
                value={bankDetail.routingNumber || ""}
                onChange={(e) => updateBankDetail(idx, { routingNumber: e.target.value })}
                placeholder={t("contacts.fields.bankRoutingNumberPlaceholder")}
              />
            </Field>
          )}
        </div>
      </div>
    </ListFieldCard>
  );
}
