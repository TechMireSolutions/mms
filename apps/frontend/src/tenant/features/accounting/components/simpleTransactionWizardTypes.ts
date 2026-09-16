import type { ElementType } from "react";
import { moneyToCents, type Account, type AppTranslationKey } from "@mms/shared";
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
  tags?: string[];
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

export {
  TRANSACTION_GROUP_COLORS,
  getTransactionGroupColorClasses,
  TRANSACTION_GROUPS,
} from "./simpleTransactionWizardGroups";

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

export function calculateAccountBalanceCents(
  accountId: string,
  entries: readonly { lines: Array<{ account_id: string; debit: number; credit: number }>; status: string }[],
): number {
  let balanceCents = 0;
  for (const entry of entries) {
    if (entry.status !== "posted") continue;
    for (const line of entry.lines) {
      if (line.account_id === accountId) {
        balanceCents += moneyToCents(line.debit) - moneyToCents(line.credit);
      }
    }
  }
  return balanceCents;
}

export function wizardAccountOptions(
  accounts: readonly Account[],
  entries?: readonly { lines: Array<{ account_id: string; debit: number; credit: number }>; status: string }[],
  formatCurrency?: (amount: number) => string,
): WizardAccountOption[] {
  return wizardCashAccounts(accounts).map((account) => {
    let balanceSuffix = "";
    if (entries && formatCurrency) {
      const balanceCents = calculateAccountBalanceCents(account.id, entries);
      balanceSuffix = ` (${formatCurrency(balanceCents / 100)})`;
    }
    return {
      value: account.id,
      label: account.code ? `${account.code} — ${account.name}${balanceSuffix}` : `${account.name}${balanceSuffix}`,
    };
  });
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
  initialValues?: { amount?: string; description?: string },
): WizardFormState {
  return {
    date: defaults.date,
    amount: initialValues?.amount ?? "",
    ...resolveSimpleTransactionAccounts(prefillType, accounts),
    description: initialValues?.description ?? (prefillType ? translate(prefillType.descriptionKey) : ""),
    ref: "",
    receipt: "",
    fiscal_year: defaults.fiscalYearLabel,
    tags: prefillType?.tag ? [prefillType.tag] : [],
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

