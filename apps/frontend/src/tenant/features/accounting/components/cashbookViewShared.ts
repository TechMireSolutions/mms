import type { AppTranslationKey } from "@mms/shared";
import { moneyToCents } from "@mms/shared";
import type { Account, JournalEntry } from "@/lib/data/accountingData";
import { resolveEntryDirection } from "@/tenant/features/accounting/components/journalEntriesQuickActions";

/**
 * Asset accounts that look like cash/bank but explicitly are NOT. Kept in step
 * with the server's cash-flow aggregate
 * (`apps/backend/src/db/repositories/accountingRepositoryReport.ts`), which
 * carves these out so receivables, prepaids and accumulated depreciation cannot
 * be summed as cash.
 */
const NON_CASH_ASSET_RE = /receiv|prepaid|accumulated|contra|deposit|advance/i;

export type EntryType = "in" | "out" | "transfer" | "unclassified";

export interface CashbookRow extends JournalEntry {
  flowType: EntryType;
  flowAmount: number;
  flowLabel: string;
}

/**
 * Is this account a cash/bank account by its own type, code, subtype or name?
 *
 * Mirrors the server heuristic: Asset only, name/subtype must not look like a
 * non-cash asset, then either the conventional `10xx` block or a cash/bank
 * name/subtype. Hard-coded seed ids ("a1000", …) are deliberately gone — an
 * account created in the UI gets an `a<uuid>` id, so every workspace with its
 * own chart classified every movement as a transfer and showed an empty cashbook.
 */
export function isCashAccount(account: Account): boolean {
  if (account.type !== "Asset") return false;
  const haystack = `${account.name} ${account.subtype ?? ""}`.toLowerCase();
  if (NON_CASH_ASSET_RE.test(haystack)) return false;
  return account.code.startsWith("10") || haystack.includes("cash") || haystack.includes("bank");
}

/**
 * Ids of the accounts that can hold cash.
 *
 * A configured cash account (Setup → posting rules) is always included when the
 * caller can supply it, even when its code and name look nothing like cash; it is
 * additive with the heuristic because a workspace may bank in several accounts
 * while the posting rule names only one.
 */
export function resolveCashAccountIds(
  accounts: readonly Account[],
  configuredCashAccountId?: string | null,
): Set<string> {
  const ids = new Set<string>();
  if (configuredCashAccountId) ids.add(configuredCashAccountId);
  for (const account of accounts) {
    if (isCashAccount(account)) ids.add(account.id);
  }
  return ids;
}

interface CashMovementCents {
  debitCents: number;
  creditCents: number;
  /** False when no line of the entry touches an identified cash account. */
  hasCashLine: boolean;
}

/** Cash-side debits/credits of one entry, in integer cents. */
function getCashMovementCents(
  entry: JournalEntry,
  cashAccountIds: ReadonlySet<string>,
): CashMovementCents {
  let debitCents = 0;
  let creditCents = 0;
  let hasCashLine = false;
  for (const journalLine of entry.lines) {
    if (!cashAccountIds.has(journalLine.account_id)) continue;
    hasCashLine = true;
    debitCents += moneyToCents(journalLine.debit);
    creditCents += moneyToCents(journalLine.credit);
  }
  return { debitCents, creditCents, hasCashLine };
}

/**
 * Cash direction of an entry.
 *
 * With a known cash chart the direction is read from **which side of the cash
 * account carries the amount** — the same semantics as the server's cash-flow
 * aggregate — so a receipt settling a receivable or an owner contribution is
 * classified correctly even though it never touches a revenue or expense line.
 * Net movement decides `in`/`out`, and a net-zero movement between two cash
 * accounts is a transfer.
 *
 * Without an identifiable cash account nothing may be claimed: the entry's own
 * transaction type / tags are used as a weaker signal (see
 * {@link resolveEntryDirection}), and an entry carrying no signal at all is
 * reported as `unclassified` rather than silently guessed.
 */
export function classifyEntry(
  entry: JournalEntry & { transaction_type?: string },
  cashAccountIds?: ReadonlySet<string>,
): EntryType {
  if (cashAccountIds && cashAccountIds.size > 0) {
    const { debitCents, creditCents, hasCashLine } = getCashMovementCents(entry, cashAccountIds);
    if (hasCashLine) {
      if (debitCents > creditCents) return "in";
      if (creditCents > debitCents) return "out";
      return "transfer";
    }
    return "unclassified";
  }
  return resolveEntryDirection(entry) ?? "transfer";
}

/**
 * Cash amount carried by one row, in money (cents-exact).
 *
 * For a classified row this is the **net** movement on the cash account, which
 * is the figure that actually moved; gross debits/credits of the same entry
 * would double count a mixed entry.
 */
export function getEntryAmount(
  entry: JournalEntry,
  type: EntryType,
  cashAccountIds?: ReadonlySet<string>,
): number {
  if (cashAccountIds && cashAccountIds.size > 0) {
    const { debitCents, creditCents, hasCashLine } = getCashMovementCents(entry, cashAccountIds);
    if (hasCashLine) {
      if (type === "in") return Math.max(debitCents - creditCents, 0) / 100;
      if (type === "out") return Math.max(creditCents - debitCents, 0) / 100;
      // A transfer nets to zero on the cash side; report its gross size.
      return Math.max(debitCents, creditCents) / 100;
    }
  }
  if (type === "in") {
    return moneyToCents(entry.lines.reduce((sum, journalLine) => sum + journalLine.credit, 0)) / 100;
  }
  if (type === "out") {
    return moneyToCents(entry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0)) / 100;
  }
  return moneyToCents(
    entry.lines.reduce((largestDebit, journalLine) => Math.max(largestDebit, journalLine.debit), 0),
  ) / 100;
}

export function getEntryLabel(
  entry: JournalEntry & { transaction_type?: string },
  t: (key: AppTranslationKey) => string,
): string {
  if (entry.transaction_type) {
    const translationKey = `accounting.transaction.type.${entry.transaction_type}` as AppTranslationKey;
    const translatedValue = t(translationKey);
    return translatedValue && translatedValue !== translationKey ? translatedValue : entry.transaction_type;
  }
  const tags = entry.tags || [];
  if (tags.length > 0) return tags[0];
  return t("accounting.transaction.type.transaction");
}

export interface BuildCashbookRowsOptions {
  /** Ids of accounts that can hold cash (see {@link resolveCashAccountIds}). */
  cashAccountIds?: ReadonlySet<string>;
}

export function buildCashbookRows(
  entries: JournalEntry[],
  search: string,
  filterType: EntryType | "all",
  t: (key: AppTranslationKey) => string,
  options: BuildCashbookRowsOptions = {},
): CashbookRow[] {
  const { cashAccountIds } = options;
  return entries
    .filter((journalEntry) => journalEntry.status === "posted")
    .map((journalEntry) => {
      const flowType = classifyEntry(journalEntry, cashAccountIds);
      return {
        ...journalEntry,
        flowType,
        flowAmount: getEntryAmount(journalEntry, flowType, cashAccountIds),
        // An unclassifiable row says so instead of masquerading as a transfer
        // with "—" in both money columns and no explanation.
        flowLabel:
          flowType === "unclassified"
            ? t("accounting.cashbook.unclassified")
            : getEntryLabel(journalEntry, t),
      };
    })
    .filter((cashbookRow) => filterType === "all" || cashbookRow.flowType === filterType)
    .filter((cashbookRow) => !search || cashbookRow.description.toLowerCase().includes(search.toLowerCase()) || cashbookRow.ref.toLowerCase().includes(search.toLowerCase()))
    .sort((firstRow, secondRow) => secondRow.date.localeCompare(firstRow.date));
}

/** Number of rows in each flow bucket — used to surface unclassified rows. */
export function countCashbookRowsByType(rows: readonly CashbookRow[]): Record<EntryType, number> {
  const counts: Record<EntryType, number> = { in: 0, out: 0, transfer: 0, unclassified: 0 };
  for (const cashbookRow of rows) counts[cashbookRow.flowType] += 1;
  return counts;
}

export interface CashbookTotalsCents {
  totalInCents: number;
  totalOutCents: number;
  balanceCents: number;
}

/**
 * Money-in / money-out / balance over the rows shown, in **integer cents**.
 *
 * Callers convert once for display. Summing the displayed floats contradicted
 * the exact-money invariant the server enforces: a page holding 0.10 + 0.20
 * receipts reduced to 0.30000000000000004.
 */
export function sumCashbookTotals(rows: readonly CashbookRow[]): CashbookTotalsCents {
  let totalInCents = 0;
  let totalOutCents = 0;
  for (const cashbookRow of rows) {
    if (cashbookRow.flowType === "in") totalInCents += moneyToCents(cashbookRow.flowAmount);
    else if (cashbookRow.flowType === "out") totalOutCents += moneyToCents(cashbookRow.flowAmount);
  }
  return { totalInCents, totalOutCents, balanceCents: totalInCents - totalOutCents };
}
