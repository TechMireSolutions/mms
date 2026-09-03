import type React from "react";
import { Landmark } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { ContactSubListShell, resolveSubListAllowAdd } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type ContactBankDetail,
  DEFAULT_BANK_LABELS,
  DEFAULT_BANK_CURRENCIES,
} from "@mms/shared";
import { ContactBankDetailCard } from "./ContactBankDetailCard";

export interface ContactBankDetailsTabProps extends ContactSubListTabBaseProps {
  labelOptions?: string[];
  onUpdateLabelOptions?: (options: string[]) => void;
  currencyOptions?: string[];
}

export function ContactBankDetailsTab({
  contactDraft,
  getLocalId,
  labelOptions = DEFAULT_BANK_LABELS,
  onUpdateLabelOptions,
  currencyOptions = DEFAULT_BANK_CURRENCIES,
  formInstanceId,
  getListItemError,
  isFieldEnabled,
  isFieldRequired,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactBankDetailsTabProps): React.JSX.Element {
  const { t } = useTranslation();

  const showBankName = isFieldEnabled("bankDetails", "bankName");
  const showAccountTitle = isFieldEnabled("bankDetails", "accountTitle");
  const showAccountNumber = isFieldEnabled("bankDetails", "accountNumber");
  const showIban = isFieldEnabled("bankDetails", "iban");
  const showSwiftCode = isFieldEnabled("bankDetails", "swiftCode");
  const showBranchName = isFieldEnabled("bankDetails", "branchName");
  const showBranchCode = isFieldEnabled("bankDetails", "branchCode");
  const showRoutingNumber = isFieldEnabled("bankDetails", "routingNumber");
  const showCurrency = isFieldEnabled("bankDetails", "currency");
  const showIsPrimary = isFieldEnabled("bankDetails", "isPrimary");

  const allowAdd = resolveSubListAllowAdd([
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
  ]);

  const bankDetails = contactDraft.bankDetails || [];

  const emptyBankDetail = (): ContactBankDetail => ({
    id: `bnk-${Date.now()}`,
    bankName: "",
    accountTitle: (contactDraft.name || `${contactDraft.firstName || ""} ${contactDraft.lastName || ""}`).trim(),
    accountNumber: "",
    currency: "PKR",
    isPrimary: bankDetails.length === 0,
    label: labelOptions[0] || "Primary",
  });

  const addBankDetail = () => {
    addSubListItem("bankDetails", emptyBankDetail());
  };

  const ensureBankDetail = () => {
    ensureSubListItem("bankDetails", emptyBankDetail());
  };

  const removeBankDetail = (idx: number) => removeSubListItem("bankDetails", idx);
  const updateBankDetail = (
    idx: number,
    patch: Partial<ContactBankDetail> & Record<string, unknown>,
  ) => updateSubListItem("bankDetails", idx, patch);

  return (
    <ContactSubListShell
      isEmpty={bankDetails.length === 0}
      emptyIcon={Landmark}
      emptyMessage={t("contacts.form.noBankDetailsYet") || "No bank accounts added yet"}
      addLabel={t("contacts.form.addBankDetail") || "Add Bank Account"}
      onAdd={addBankDetail}
      onEnsureRow={ensureBankDetail}
      allowAdd={allowAdd}
    >
      <AnimatePresence initial={false}>
        {bankDetails.map((bankDetail, idx) => (
          <ContactBankDetailCard
            key={getLocalId("bankDetails", idx)}
            bankDetail={bankDetail}
            idx={idx}
            formInstanceId={formInstanceId}
            labelOptions={labelOptions}
            onUpdateLabelOptions={onUpdateLabelOptions}
            currencyOptions={currencyOptions}
            showBankName={showBankName}
            showAccountTitle={showAccountTitle}
            showAccountNumber={showAccountNumber}
            showIban={showIban}
            showSwiftCode={showSwiftCode}
            showBranchName={showBranchName}
            showBranchCode={showBranchCode}
            showRoutingNumber={showRoutingNumber}
            showCurrency={showCurrency}
            showIsPrimary={showIsPrimary}
            isFieldRequired={isFieldRequired}
            getListItemError={getListItemError}
            getLocalId={getLocalId}
            updateBankDetail={updateBankDetail}
            removeBankDetail={removeBankDetail}
          />
        ))}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
