import { useMemo, useState } from "react";
import { computeLedger, Account, JournalEntry, AccountType } from '@/lib/data/accountingData';

export interface GeneralLedgerLineWithRunning {
  date: string;
  ref: string;
  description: string;
  lineDesc?: string;
  debit: number;
  credit: number;
  running: number;
}

export function useGeneralLedger(accounts: Account[], entries: JournalEntry[]) {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [typeFilter, setTypeFilter] = useState<AccountType | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredAccounts = accounts
    .filter((account) => account.isActive !== false)
    .filter((account) => typeFilter === "all" || account.type === typeFilter)
    .sort((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code));

  const activeAccount = accounts.find((account) => account.id === selectedAccount);
  const lines = useMemo(
    () => selectedAccount ? computeLedger(selectedAccount, entries, dateFrom || undefined, dateTo || undefined) : [],
    [selectedAccount, entries, dateFrom, dateTo]
  );

  const totalDebit = lines.reduce((sum, ledgerLine) => sum + ledgerLine.debit, 0);
  const totalCredit = lines.reduce((sum, ledgerLine) => sum + ledgerLine.credit, 0);
  const balance = totalDebit - totalCredit;

  let running = 0;
  const linesWithRunning: GeneralLedgerLineWithRunning[] = lines.map((ledgerLine) => {
    running += ledgerLine.debit - ledgerLine.credit;
    return { ...ledgerLine, running };
  });

  return {
    selectedAccount,
    setSelectedAccount,
    typeFilter,
    setTypeFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filteredAccounts,
    activeAccount,
    lines,
    linesWithRunning,
    totalDebit,
    totalCredit,
    balance,
  };
}
