import { moneyToCents } from "@mms/shared";
import type { Account, JournalEntry } from "@/lib/data/accountingData";
import { resolveEntryDirection } from "@/tenant/features/accounting/components/journalEntriesQuickActions";

export interface SalaryVoucherRef {
  staffId: string;
  payPeriod: string;
}

export interface PaymentVoucherLine {
  account: string;
  amount: number;
}

export interface PaymentVoucherModel {
  amount: number;
  /** Expense / payable accounts debited — what the money was spent on. */
  particulars: PaymentVoucherLine[];
  /** Cash / bank accounts credited — where the money was paid from. */
  paidFrom: string[];
  salary: SalaryVoucherRef | null;
}

/** `processSalaryEntry` writes `Salary payment — staff <id> (<YYYY-MM>)` on every line, even when a note overrides the narration. */
const SALARY_LINE_PATTERN = /staff (.+) \((\d{4}-\d{2})\)$/;
/** Fallback: the original `SAL-<YYYY-MM>-<staffId>` reference. */
const SALARY_REF_PATTERN = /^SAL-(\d{4}-\d{2})-(.+)$/;

export function parseSalaryVoucherRef(entry: Pick<JournalEntry, "transaction_type" | "lines" | "ref">): SalaryVoucherRef | null {
  if (entry.transaction_type !== "salary") return null;
  for (const line of entry.lines) {
    const match = SALARY_LINE_PATTERN.exec(line.description);
    if (match?.[1] && match[2]) return { staffId: match[1], payPeriod: match[2] };
  }
  const refMatch = SALARY_REF_PATTERN.exec(entry.ref);
  return refMatch?.[1] && refMatch[2] ? { staffId: refMatch[2], payPeriod: refMatch[1] } : null;
}

function accountLabel(accountsById: Map<string, Account>, accountId: string): string {
  const account = accountsById.get(accountId);
  return account ? `${account.code} — ${account.name}` : accountId;
}

/** Posted, live money-out entries (salary, expenses, any debit to an Expense account) can print a payment voucher. */
export function isPaymentVoucherEligible(entry: JournalEntry, accounts: readonly Account[]): boolean {
  if (entry.status !== "posted" || entry.deletedAt) return false;
  if (resolveEntryDirection(entry) === "out") return true;
  const expenseIds = new Set(accounts.filter((account) => account.type === "Expense").map((account) => account.id));
  return entry.lines.some((line) => line.debit > 0 && expenseIds.has(line.account_id));
}

export function buildPaymentVoucherModel(entry: JournalEntry, accounts: readonly Account[]): PaymentVoucherModel {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const debitLines = entry.lines.filter((line) => line.debit > 0);
  const creditLines = entry.lines.filter((line) => line.credit > 0);
  const amountCents = debitLines.reduce((sum, line) => sum + moneyToCents(line.debit), 0);
  return {
    amount: amountCents / 100,
    particulars: debitLines.map((line) => ({
      account: accountLabel(accountsById, line.account_id),
      amount: line.debit,
    })),
    paidFrom: [...new Set(creditLines.map((line) => accountLabel(accountsById, line.account_id)))],
    salary: parseSalaryVoucherRef(entry),
  };
}
