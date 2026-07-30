import React from "react";
import type { AppTranslationKey } from "@mms/shared";
import { ACCOUNT_TYPES, AccountType, Account } from '@/lib/data/accountingData';
import { DatePicker } from "@/components/ui/DatePicker";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";

interface GeneralLedgerFiltersProps {
  typeFilter: AccountType | "all";
  selectedAccount: string;
  dateFrom: string;
  dateTo: string;
  filteredAccounts: Account[];
  onTypeFilterChange: (value: AccountType | "all") => void;
  onSelectedAccountChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export function GeneralLedgerFilters({
  typeFilter,
  selectedAccount,
  dateFrom,
  dateTo,
  filteredAccounts,
  onTypeFilterChange,
  onSelectedAccountChange,
  onDateFromChange,
  onDateToChange,
}: GeneralLedgerFiltersProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <nav aria-label={t("accounting.ledger.filtersAria")} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <FormSelect
        aria-label={t("accounting.coa.filterTypeAria")}
        value={typeFilter}
        onChange={(accountTypeValue) => {
          onTypeFilterChange(accountTypeValue as AccountType | "all");
          onSelectedAccountChange("");
        }}
        options={[
          { value: "all", label: t("accounting.ledger.allTypes") },
          ...ACCOUNT_TYPES.map((type) => ({ value: type, label: t(`accounting.type.${type}` as AppTranslationKey) })),
        ]}
      />
      <FormSelect
        aria-label={t("accounting.ledger.selectAccountAria")}
        value={selectedAccount}
        onChange={onSelectedAccountChange}
        placeholder={t("accounting.ledger.selectAccount")}
        options={filteredAccounts.map((account) => ({ value: account.id, label: `${account.code} – ${account.name}` }))}
        className="col-span-2 sm:col-span-1"
      />
      <DatePicker
        id="ledger-date-from"
        value={dateFrom}
        onChange={onDateFromChange}
        placeholder={t("accounting.ledger.from")}
      />
      <DatePicker
        id="ledger-date-to"
        value={dateTo}
        onChange={onDateToChange}
        placeholder={t("accounting.ledger.to")}
      />
    </nav>
  );
}
