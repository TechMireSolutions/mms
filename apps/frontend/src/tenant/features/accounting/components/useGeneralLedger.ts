import { useState } from "react";
import { computeLedger, type Account, type JournalEntry, type AccountType } from '@/lib/data/accountingData';

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
  const lines = (() => selectedAccount ? computeLedger(selectedAccount, entries, dateFrom || undefined, dateTo || undefined) : [])();

  let totalDebit = 0;
  let totalCredit = 0;
  let running = 0;
  const linesWithRunning: GeneralLedgerLineWithRunning[] = new Array(lines.length);
  for (let i = 0; i < lines.length; i++) {
    const ledgerLine = lines[i];
    totalDebit += ledgerLine.debit;
    totalCredit += ledgerLine.credit;
    running += ledgerLine.debit - ledgerLine.credit;
    linesWithRunning[i] = { ...ledgerLine, running };
  }
  const balance = totalDebit - totalCredit;

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
