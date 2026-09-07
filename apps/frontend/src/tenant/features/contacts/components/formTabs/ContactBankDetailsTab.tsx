import React, { useCallback, useContext } from "react";
import { Landmark } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { ContactSubListShell, resolveSubListAllowAdd } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type ContactBankDetail,
  DEFAULT_BANK_NAMES,
  DEFAULT_BANK_ACCOUNT_TYPES,
} from "@mms/shared";
import { ContactBankDetailCard } from "./ContactBankDetailCard";
import { ContactConfigContext } from "@/lib/contacts/contactConfigContextTypes";

export interface ContactBankDetailsTabProps extends ContactSubListTabBaseProps {
  bankNameOptions?: string[];
  onUpdateBankNameOptions?: (options: string[]) => void;
  accountTypeOptions?: string[];
  onUpdateAccountTypeOptions?: (options: string[]) => void;
}

export function ContactBankDetailsTab({
  contactDraft,
  getLocalId,
  bankNameOptions,
  onUpdateBankNameOptions,
  accountTypeOptions,
  onUpdateAccountTypeOptions,
  formInstanceId,
  getListItemError,
  isFieldEnabled,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactBankDetailsTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const contactConfig = useContext(ContactConfigContext);

  const resolvedBankNameOptions =
    bankNameOptions ??
    (contactConfig?.bankNames && contactConfig.bankNames.length > 0
      ? contactConfig.bankNames
      : DEFAULT_BANK_NAMES);

  const resolvedOnUpdateBankNameOptions =
    onUpdateBankNameOptions ?? contactConfig?.updateBankNames;

  const resolvedAccountTypeOptions =
    accountTypeOptions ??
    (contactConfig?.bankAccountTypes && contactConfig.bankAccountTypes.length > 0
      ? contactConfig.bankAccountTypes
      : DEFAULT_BANK_ACCOUNT_TYPES);

  const resolvedOnUpdateAccountTypeOptions =
    onUpdateAccountTypeOptions ?? contactConfig?.updateBankAccountTypes;

  const showBankName = isFieldEnabled("bankDetails", "bankName");
  const showAccountType = isFieldEnabled("bankDetails", "accountType");
  const showAccountNumber = isFieldEnabled("bankDetails", "accountNumber");

  const allowAdd = resolveSubListAllowAdd([
    showBankName,
    showAccountType,
    showAccountNumber,
  ]);

  const bankDetails = contactDraft.bankDetails || [];

  const emptyBankDetail = useCallback((): ContactBankDetail => ({
    id: `bnk-${crypto.randomUUID()}`,
    bankName: "",
    accountType: "",
    accountNumber: "",
  }), []);

  const addBankDetail = useCallback(() => {
    addSubListItem("bankDetails", emptyBankDetail());
  }, [addSubListItem, emptyBankDetail]);

  const ensureBankDetail = useCallback(() => {
    ensureSubListItem("bankDetails", emptyBankDetail());
  }, [ensureSubListItem, emptyBankDetail]);

  const removeBankDetail = useCallback((idx: number) => {
    removeSubListItem("bankDetails", idx);
  }, [removeSubListItem]);

  const updateBankDetail = useCallback(
    (
      idx: number,
      patch: Partial<ContactBankDetail> & Record<string, unknown>,
    ) => {
      updateSubListItem("bankDetails", idx, patch);
    },
    [updateSubListItem],
  );

  return (
    <ContactSubListShell
      isEmpty={bankDetails.length === 0}
      emptyIcon={Landmark}
      emptyMessage={t("contacts.form.noBankDetailsYet")}
      addLabel={t("contacts.form.addBankDetail")}
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
            bankNameOptions={resolvedBankNameOptions}
            onUpdateBankNameOptions={resolvedOnUpdateBankNameOptions}
            accountTypeOptions={resolvedAccountTypeOptions}
            onUpdateAccountTypeOptions={resolvedOnUpdateAccountTypeOptions}
            showBankName={showBankName}
            showAccountType={showAccountType}
            showAccountNumber={showAccountNumber}
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
