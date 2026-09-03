import type React from "react";
import { Building2, CreditCard, Globe, MapPin, User, Star, Landmark, Hash } from "lucide-react";
import { EditableSelect, Field } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard } from "./ContactSubListCards";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type ContactBankDetail,
  DEFAULT_BANK_LABELS,
  DEFAULT_BANK_CURRENCIES,
} from "@mms/shared";
import { SUB_LIST_CARD_ACCENTS } from "@/lib/semanticTone";

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
      key={getLocalId("bankDetails", idx)}
      id={getLocalId("bankDetails", idx)}
      index={idx}
      accentClass={SUB_LIST_CARD_ACCENTS.bankDetails.accent}
      label={`${t("contacts.fields.bankDetailsLabel") || "Account Type"}:`}
      typeSelect={
        <EditableSelect
          options={labelOptions}
          value={bankDetail.label || labelOptions[0] || "Primary"}
          onChange={(val) => updateBankDetail(idx, { label: val })}
          onUpdateOptions={onUpdateLabelOptions}
          className="w-36 @sm:w-44 min-w-0"
          id={`cf-${formInstanceId}-bank-label-${idx}`}
          name={`cf-${formInstanceId}-bank-label-${idx}`}
          placeholder={t("contacts.fields.bankLabel") || "Account Label"}
        />
      }
      headerExtras={
        showIsPrimary ? (
          <button
            type="button"
            onClick={() => updateBankDetail(idx, { isPrimary: !bankDetail.isPrimary })}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors min-h-[36px] touch-manipulation ${
              bankDetail.isPrimary
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
            }`}
            title={t("contacts.fields.bankIsPrimary") || "Primary Account"}
          >
            <Star className={`w-3.5 h-3.5 ${bankDetail.isPrimary ? "fill-emerald-500 text-emerald-500" : ""}`} />
            <span>{bankDetail.isPrimary ? t("contacts.form.primary") : t("contacts.form.setPrimary")}</span>
          </button>
        ) : undefined
      }
      onRemove={() => removeBankDetail(idx)}
      removeLabel={t("contacts.form.removeBankDetail", { index: idx + 1 }) || `Remove bank account ${idx + 1}`}
    >
      <div className="space-y-3">
        {/* Row 1: Bank Name & Account Title */}
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
          {showBankName && (
            <Field
              label={t("contacts.fields.bankName") || "Bank Name"}
              required={isFieldRequired("bankDetails", "bankName")}
              error={bankNameError}
              id={`cf-${formInstanceId}-bank-name-${idx}`}
            >
              <LeadingIconInput
                icon={Landmark}
                id={`cf-${formInstanceId}-bank-name-${idx}`}
                name={`cf-${formInstanceId}-bank-name-${idx}`}
                value={bankDetail.bankName || ""}
                onChange={(e) => updateBankDetail(idx, { bankName: e.target.value })}
                placeholder={t("contacts.fields.bankNamePlaceholder") || "e.g. Meezan Bank, HBL"}
              />
            </Field>
          )}

          {showAccountTitle && (
            <Field
              label={t("contacts.fields.bankAccountTitle") || "Account Title"}
              required={isFieldRequired("bankDetails", "accountTitle")}
              error={accountTitleError}
              id={`cf-${formInstanceId}-bank-title-${idx}`}
            >
              <LeadingIconInput
                icon={User}
                id={`cf-${formInstanceId}-bank-title-${idx}`}
                name={`cf-${formInstanceId}-bank-title-${idx}`}
                value={bankDetail.accountTitle || ""}
                onChange={(e) => updateBankDetail(idx, { accountTitle: e.target.value })}
                placeholder={t("contacts.fields.bankAccountTitlePlaceholder") || "Beneficiary name"}
              />
            </Field>
          )}
        </div>

        {/* Row 2: Account Number & Currency */}
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-3">
          {showAccountNumber && (
            <div className="@sm:col-span-2">
              <Field
                label={t("contacts.fields.bankAccountNumber") || "Account Number"}
                required={isFieldRequired("bankDetails", "accountNumber")}
                error={accountNumberError}
                id={`cf-${formInstanceId}-bank-acc-no-${idx}`}
              >
                <LeadingIconInput
                  icon={CreditCard}
                  id={`cf-${formInstanceId}-bank-acc-no-${idx}`}
                  name={`cf-${formInstanceId}-bank-acc-no-${idx}`}
                  inputMode="numeric"
                  className="font-mono"
                  value={bankDetail.accountNumber || ""}
                  onChange={(e) => updateBankDetail(idx, { accountNumber: e.target.value })}
                  placeholder={t("contacts.fields.bankAccountNumberPlaceholder") || "01234567890123"}
                />
              </Field>
            </div>
          )}

          {showCurrency && (
            <Field
              label={t("contacts.fields.bankCurrency") || "Currency"}
              id={`cf-${formInstanceId}-bank-currency-${idx}`}
            >
              <select
                id={`cf-${formInstanceId}-bank-currency-${idx}`}
                name={`cf-${formInstanceId}-bank-currency-${idx}`}
                value={bankDetail.currency || "PKR"}
                onChange={(e) => updateBankDetail(idx, { currency: e.target.value })}
                aria-label={t("contacts.fields.bankCurrency") || "Currency"}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[44px]"
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          )}
        </div>

        {/* Row 3: IBAN & SWIFT / BIC */}
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
          {showIban && (
            <Field
              label={t("contacts.fields.bankIban") || "IBAN"}
              required={isFieldRequired("bankDetails", "iban")}
              error={ibanError}
              id={`cf-${formInstanceId}-bank-iban-${idx}`}
            >
              <LeadingIconInput
                icon={Globe}
                id={`cf-${formInstanceId}-bank-iban-${idx}`}
                name={`cf-${formInstanceId}-bank-iban-${idx}`}
                className="font-mono uppercase tracking-wider"
                value={bankDetail.iban || ""}
                onChange={handleIbanChange}
                placeholder={t("contacts.fields.bankIbanPlaceholder") || "PK36MEZN00012345678901"}
              />
            </Field>
          )}

          {showSwiftCode && (
            <Field
              label={t("contacts.fields.bankSwiftCode") || "SWIFT / BIC Code"}
              required={isFieldRequired("bankDetails", "swiftCode")}
              error={swiftCodeError}
              id={`cf-${formInstanceId}-bank-swift-${idx}`}
            >
              <LeadingIconInput
                icon={Building2}
                id={`cf-${formInstanceId}-bank-swift-${idx}`}
                name={`cf-${formInstanceId}-bank-swift-${idx}`}
                className="font-mono uppercase tracking-wider"
                value={bankDetail.swiftCode || ""}
                onChange={handleSwiftChange}
                placeholder={t("contacts.fields.bankSwiftPlaceholder") || "MEZNPKKA"}
              />
            </Field>
          )}
        </div>

        {/* Row 4: Branch Name, Branch Code & Routing Number */}
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-3">
          {showBranchName && (
            <Field
              label={t("contacts.fields.bankBranchName") || "Branch Name"}
              required={isFieldRequired("bankDetails", "branchName")}
              error={branchNameError}
              id={`cf-${formInstanceId}-bank-branch-name-${idx}`}
            >
              <LeadingIconInput
                icon={MapPin}
                id={`cf-${formInstanceId}-bank-branch-name-${idx}`}
                name={`cf-${formInstanceId}-bank-branch-name-${idx}`}
                value={bankDetail.branchName || ""}
                onChange={(e) => updateBankDetail(idx, { branchName: e.target.value })}
                placeholder={t("contacts.fields.bankBranchNamePlaceholder") || "Main Branch"}
              />
            </Field>
          )}

          {showBranchCode && (
            <Field
              label={t("contacts.fields.bankBranchCode") || "Branch Code"}
              required={isFieldRequired("bankDetails", "branchCode")}
              error={branchCodeError}
              id={`cf-${formInstanceId}-bank-branch-code-${idx}`}
            >
              <LeadingIconInput
                icon={Hash}
                id={`cf-${formInstanceId}-bank-branch-code-${idx}`}
                name={`cf-${formInstanceId}-bank-branch-code-${idx}`}
                className="font-mono"
                value={bankDetail.branchCode || ""}
                onChange={(e) => updateBankDetail(idx, { branchCode: e.target.value })}
                placeholder="0123"
              />
            </Field>
          )}

          {showRoutingNumber && (
            <Field
              label={t("contacts.fields.bankRoutingNumber") || "Routing Number"}
              required={isFieldRequired("bankDetails", "routingNumber")}
              error={routingNumberError}
              id={`cf-${formInstanceId}-bank-routing-${idx}`}
            >
              <LeadingIconInput
                icon={Hash}
                id={`cf-${formInstanceId}-bank-routing-${idx}`}
                name={`cf-${formInstanceId}-bank-routing-${idx}`}
                className="font-mono"
                value={bankDetail.routingNumber || ""}
                onChange={(e) => updateBankDetail(idx, { routingNumber: e.target.value })}
                placeholder="123456789"
              />
            </Field>
          )}
        </div>
      </div>
    </ListFieldCard>
  );
}
