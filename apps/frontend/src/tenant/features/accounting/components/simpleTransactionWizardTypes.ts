import type { ElementType } from "react";
import { BookOpen, Building2, DollarSign, Heart, Home, Package, Plus, RefreshCw, TrendingDown, UserCheck, Zap } from "lucide-react";
import type { Account, AppTranslationKey } from "@mms/shared";
import { parseMoneyInput } from "./simpleTransactionMoney";

export type TransactionGroupColor = "emerald" | "red" | "blue";

export interface QuickActionType {
  id: string;
  labelKey: AppTranslationKey;
  icon: ElementType;
  debitAcc: string;
  creditAcc: string;
  tag: string;
  descriptionKey: AppTranslationKey;
  groupKey: AppTranslationKey;
  color: string;
}

export interface TransactionGroup {
  groupKey: AppTranslationKey;
  color: TransactionGroupColor;
  icon: ElementType;
  items: QuickActionType[];
}

export interface WizardFormState {
  date: string;
  amount: string;
  debitAcc: string;
  creditAcc: string;
  description: string;
  ref: string;
  /**
   * Kept for state compatibility only: nothing uploads this file, so the wizard
   * no longer offers a receipt control it would silently drop.
   */
  receipt: string;
  fiscal_year: string;
}

export interface WizardAccountOption {
  value: string;
  label: string;
}

export interface WizardPrefillSelection {
  debitAcc: string;
  creditAcc: string;
}

export type WizardValidationResult =
  | { ok: true; amount: number; debitAccount: Account; creditAccount: Account }
  | { ok: false; errorKey: AppTranslationKey };

export const TRANSACTION_GROUP_COLORS: Record<TransactionGroupColor, Record<string, string>> = {
  emerald: {
    card: "border-success/30 bg-success/10 hover:bg-success/10",
    header: "bg-success/15 text-success border-success/30",
    badge: "bg-success/15 text-success",
    item: "border-success/30 hover:border-success hover:bg-success/10",
    selected: "border-success bg-success/10 ring-2 ring-success/30",
    icon: "text-success bg-success/15",
  },
  red: {
    card: "border-destructive/30 bg-destructive/10 hover:bg-destructive/10",
    header: "bg-destructive/15 text-destructive border-destructive/30",
    badge: "bg-destructive/15 text-destructive",
    item: "border-destructive/30 hover:border-destructive hover:bg-destructive/10",
    selected: "border-destructive bg-destructive/10 ring-2 ring-destructive/20",
    icon: "text-destructive bg-destructive/15",
  },
  blue: {
    card: "border-info/30 bg-info/10 hover:bg-info/10",
    header: "bg-info/15 text-info border-info/30",
    badge: "bg-info/15 text-info",
    item: "border-info/30 hover:border-info hover:bg-info/10",
    selected: "border-info bg-info/10 ring-2 ring-info/30",
    icon: "text-info bg-info/15",
  },
};

export function getTransactionGroupColorClasses(color: string | null | undefined) {
  if (color === "emerald" || color === "red" || color === "blue") {
    return TRANSACTION_GROUP_COLORS[color];
  }
  return TRANSACTION_GROUP_COLORS.blue;
}

export const TRANSACTION_GROUPS: TransactionGroup[] = [
  {
    groupKey: "accounting.journal.dashboard.group.moneyIn",
    color: "emerald",
    icon: DollarSign,
    items: [
      { id: "fee_collection", labelKey: "accounting.journal.dashboard.label.feeCollection", icon: BookOpen, debitAcc: "a1000", creditAcc: "a4000", tag: "Fees", descriptionKey: "accounting.journal.dashboard.desc.feeCollection", groupKey: "accounting.journal.dashboard.group.moneyIn", color: "emerald" },
      { id: "donation", labelKey: "accounting.journal.dashboard.label.donationReceived", icon: Heart, debitAcc: "a1000", creditAcc: "a4100", tag: "Donation", descriptionKey: "accounting.journal.dashboard.desc.donationReceived", groupKey: "accounting.journal.dashboard.group.moneyIn", color: "emerald" },
      { id: "rent_income", labelKey: "accounting.journal.dashboard.label.rentIncome", icon: Home, debitAcc: "a1000", creditAcc: "a4300", tag: "Capital", descriptionKey: "accounting.journal.dashboard.desc.rentIncome", groupKey: "accounting.journal.dashboard.group.moneyIn", color: "emerald" },
      { id: "other_income", labelKey: "accounting.journal.dashboard.label.otherIncome", icon: Plus, debitAcc: "a1000", creditAcc: "a4400", tag: "Capital", descriptionKey: "accounting.journal.dashboard.desc.otherIncome", groupKey: "accounting.journal.dashboard.group.moneyIn", color: "emerald" },
    ],
  },
  {
    groupKey: "accounting.journal.dashboard.group.moneyOut",
    color: "red",
    icon: TrendingDown,
    items: [
      { id: "salary", labelKey: "accounting.journal.dashboard.label.salaryPayment", icon: UserCheck, debitAcc: "a5000", creditAcc: "a1010", tag: "Payroll", descriptionKey: "accounting.journal.dashboard.desc.salaryPayment", groupKey: "accounting.journal.dashboard.group.moneyOut", color: "red" },
      { id: "utilities", labelKey: "accounting.journal.dashboard.label.utilities", icon: Zap, debitAcc: "a5200", creditAcc: "a1000", tag: "Utilities", descriptionKey: "accounting.journal.dashboard.desc.utilities", groupKey: "accounting.journal.dashboard.group.moneyOut", color: "red" },
      { id: "supplies", labelKey: "accounting.journal.dashboard.label.supplies", icon: Package, debitAcc: "a5300", creditAcc: "a1000", tag: "Capital", descriptionKey: "accounting.journal.dashboard.desc.supplies", groupKey: "accounting.journal.dashboard.group.moneyOut", color: "red" },
      { id: "rent_payment", labelKey: "accounting.journal.dashboard.label.rentPayment", icon: Building2, debitAcc: "a5100", creditAcc: "a1010", tag: "Rent", descriptionKey: "accounting.journal.dashboard.desc.rentPayment", groupKey: "accounting.journal.dashboard.group.moneyOut", color: "red" },
      { id: "other_expense", labelKey: "accounting.journal.dashboard.label.otherExpense", icon: TrendingDown, debitAcc: "a5700", creditAcc: "a1000", tag: "Capital", descriptionKey: "accounting.journal.dashboard.desc.otherExpense", groupKey: "accounting.journal.dashboard.group.moneyOut", color: "red" },
    ],
  },
  {
    groupKey: "accounting.journal.dashboard.group.transfers",
    color: "blue",
    icon: RefreshCw,
    items: [
      { id: "transfer", labelKey: "accounting.journal.dashboard.label.transfer", icon: RefreshCw, debitAcc: "a1020", creditAcc: "a1010", tag: "Adjustment", descriptionKey: "accounting.journal.dashboard.desc.transfer", groupKey: "accounting.journal.dashboard.group.transfers", color: "blue" },
      // No preset counter-account: an adjustment must be posted against a
      // second account the user picks, never against the same account twice.
      { id: "adjustment", labelKey: "accounting.journal.dashboard.label.adjustment", icon: Plus, debitAcc: "a1000", creditAcc: "", tag: "Adjustment", descriptionKey: "accounting.journal.dashboard.desc.adjustment", groupKey: "accounting.journal.dashboard.group.transfers", color: "blue" },
    ],
  },
];

/** An account a simple transaction may be posted to. */
function isUsableWizardAccount(account: Account): boolean {
  return account.isActive !== false && !account.deletedAt;
}

const NON_CASH_ASSET_RE = /receiv|prepaid|accumulated|contra|deposit|advance|equipment|building|furniture|vehicle|land/i;

function isLiquidAsset(account: Account): boolean {
  if (account.type !== "Asset") return false;
  const subtype = account.subtype?.toLowerCase() || "";
  if (subtype === "cash" || subtype === "bank") return true;
  const haystack = `${account.name} ${subtype}`.toLowerCase();
  if (NON_CASH_ASSET_RE.test(haystack)) return false;
  return account.code.startsWith("10") || haystack.includes("cash") || haystack.includes("bank");
}

/**
 * The cash/bank accounts offered for the money legs of a simple transaction.
 *
 * Derived from the live chart instead of the seed ids ("a1000", "a1010",
 * "a1020") the form used to hardcode: accounts created in the UI get
 * `a${crypto.randomUUID()}` ids, so a workspace with its own cash/bank accounts
 * could not record a simple transaction at all. Liquid asset accounts (cash and
 * bank) are preferred, carved out from fixed assets and receivables; a chart
 * with none falls back to any asset, and then to every usable account rather
 * than showing an empty select.
 */
export function wizardCashAccounts(accounts: readonly Account[]): Account[] {
  const usableAccounts = accounts.filter(isUsableWizardAccount);
  const liquidAssets = usableAccounts.filter(isLiquidAsset);
  const assetAccounts = usableAccounts.filter((account) => account.type === "Asset");
  const candidateAccounts =
    liquidAssets.length > 0 ? liquidAssets : assetAccounts.length > 0 ? assetAccounts : usableAccounts;
  return [...candidateAccounts].sort((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code));
}

export function wizardAccountOptions(accounts: readonly Account[]): WizardAccountOption[] {
  return wizardCashAccounts(accounts).map((account) => ({
    value: account.id,
    label: account.code ? `${account.code} — ${account.name}` : account.name,
  }));
}

/**
 * The category accounts (Revenue or Expense) offered for the counter-leg of a
 * simple transaction.
 */
export function wizardCategoryAccountOptions(
  accounts: readonly Account[],
  categoryType: "Revenue" | "Expense",
): WizardAccountOption[] {
  const usableAccounts = accounts.filter(isUsableWizardAccount);
  const targetAccounts = usableAccounts.filter((account) => account.type === categoryType);
  const candidateAccounts = targetAccounts.length > 0 ? targetAccounts : usableAccounts;
  return [...candidateAccounts]
    .sort((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code))
    .map((account) => ({
      value: account.id,
      label: account.code ? `${account.code} — ${account.name}` : account.name,
    }));
}

function firstAccountIdOfType(
  usableAccounts: readonly Account[],
  preferredTypes: readonly Account["type"][],
  excludedAccountIds: readonly string[],
): string {
  for (const preferredType of preferredTypes) {
    const match = usableAccounts.find((account) => account.type === preferredType && !excludedAccountIds.includes(account.id));
    if (match) return match.id;
  }
  return usableAccounts.find((account) => !excludedAccountIds.includes(account.id))?.id ?? "";
}

/**
 * Resolve a quick action's preset legs against the live chart.
 *
 * Quick actions carry seed-chart ids; when such an id is absent (or archived)
 * the leg is reset to a real option, because the server rejects unknown and
 * archived accounts and the native select would only render blank. A preset leg
 * that is deliberately empty (the Adjustment action's counter-account) stays
 * empty: the user has to choose it.
 */
export function resolveSimpleTransactionAccounts(
  prefillType: QuickActionType | null,
  accounts: readonly Account[],
): WizardPrefillSelection {
  const usableAccounts = accounts.filter(isUsableWizardAccount);
  const cashAccounts = wizardCashAccounts(accounts);
  const fallbackDebitAcc = cashAccounts[0]?.id ?? "";
  const fallbackCreditAcc = cashAccounts.find((account) => account.id !== fallbackDebitAcc)?.id ?? "";

  if (!prefillType) return { debitAcc: fallbackDebitAcc, creditAcc: fallbackCreditAcc };

  const cashAccountIds = new Set(cashAccounts.map((account) => account.id));
  const usableAccountIds = new Set(usableAccounts.map((account) => account.id));
  const resolveCashAccountId = (prefilledAccountId: string, fallbackAccountId: string) =>
    cashAccountIds.has(prefilledAccountId) ? prefilledAccountId : fallbackAccountId;
  const resolveAnyAccountId = (prefilledAccountId: string, fallbackAccountId: string) =>
    usableAccountIds.has(prefilledAccountId) ? prefilledAccountId : fallbackAccountId;

  if (prefillType.groupKey === "accounting.journal.dashboard.group.transfers") {
    const debitAcc = resolveCashAccountId(prefillType.debitAcc, fallbackDebitAcc);
    const resolvedCreditAcc =
      prefillType.creditAcc === "" ? "" : resolveCashAccountId(prefillType.creditAcc, fallbackCreditAcc);
    const creditAcc = resolvedCreditAcc === debitAcc
      ? cashAccounts.find((account) => account.id !== debitAcc)?.id ?? ""
      : resolvedCreditAcc;
    return { debitAcc, creditAcc };
  }

  if (prefillType.groupKey === "accounting.journal.dashboard.group.moneyIn") {
    const debitAcc = resolveCashAccountId(prefillType.debitAcc, fallbackDebitAcc);
    return {
      debitAcc,
      creditAcc: resolveAnyAccountId(prefillType.creditAcc, firstAccountIdOfType(usableAccounts, ["Revenue"], [debitAcc])),
    };
  }

  const creditAcc = resolveCashAccountId(prefillType.creditAcc, fallbackCreditAcc);
  return {
    debitAcc: resolveAnyAccountId(prefillType.debitAcc, firstAccountIdOfType(usableAccounts, ["Expense"], [creditAcc])),
    creditAcc,
  };
}

export interface WizardFormDefaults {
  date: string;
  fiscalYearLabel: string;
}

/**
 * A fresh form for one wizard opening. Called on every open so a posted
 * transaction can never leak into the next quick action.
 */
export function buildWizardFormState(
  prefillType: QuickActionType | null,
  accounts: readonly Account[],
  defaults: WizardFormDefaults,
  translate: (key: AppTranslationKey) => string,
): WizardFormState {
  return {
    date: defaults.date,
    amount: "",
    ...resolveSimpleTransactionAccounts(prefillType, accounts),
    description: prefillType ? translate(prefillType.descriptionKey) : "",
    ref: "",
    receipt: "",
    fiscal_year: defaults.fiscalYearLabel,
  };
}

/**
 * Validate a simple transaction before it is turned into journal lines.
 *
 * Enforces the server's own rules on the client: the amount must be a parseable,
 * positive money value (never a truncated `parseFloat` reading) and both legs
 * must be two different, existing, active accounts — the server cannot catch
 * `debitAcc === creditAcc`, because such an entry is still "balanced" and posts
 * as a permanent no-op that inflates one account's debit *and* credit turnover.
 */
export function validateWizardForm(form: WizardFormState, accounts: readonly Account[]): WizardValidationResult {
  if (form.amount.trim() === "") return { ok: false, errorKey: "accounting.journal.dashboard.wizard.errorAmount" };
  const amount = parseMoneyInput(form.amount);
  if (amount === null || amount <= 0) return { ok: false, errorKey: "accounting.journal.dashboard.wizard.errorAmountInvalid" };
  if (!form.debitAcc || !form.creditAcc) return { ok: false, errorKey: "accounting.journal.dashboard.wizard.errorSource" };

  const debitAccount = accounts.find((account) => account.id === form.debitAcc && isUsableWizardAccount(account));
  const creditAccount = accounts.find((account) => account.id === form.creditAcc && isUsableWizardAccount(account));
  if (!debitAccount || !creditAccount) return { ok: false, errorKey: "accounting.journal.dashboard.wizard.errorSource" };
  if (debitAccount.id === creditAccount.id) return { ok: false, errorKey: "accounting.journal.dashboard.wizard.errorSameAccount" };
  if (!form.date) return { ok: false, errorKey: "accounting.journal.dashboard.wizard.errorDate" };

  return { ok: true, amount, debitAccount, creditAccount };
}

