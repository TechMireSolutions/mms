import React, { useEffect, useMemo, useState } from "react";
import { type Account, type FiscalYear, moneyToCents } from "@mms/shared";
import { Scale, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { Field, FieldErrorMessage } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import {
  hasAtMostTwoDecimals,
  parseMoneyInput,
  useOpeningBalances,
  usePostOpeningBalances,
  useSaveOpeningBalances,
  type MoneySeparator,
} from "@/tenant/features/accounting/hooks/useAccountingLedgerOps";
import { accountingErrorMessage } from "@/tenant/features/accounting/hooks/useAccountingSetupSaveActions";

interface AccountingSettingsOpeningSectionProps {
  accounts: Account[];
  fiscalYears: FiscalYear[];
  /** `decimalSeparator` preference — money inputs must be parsed with it. */
  decimalSeparator: MoneySeparator;
}

/** Non-negative money with at most two decimals, mirroring `moneyAmountSchema`. */
function isPostableMoneyAmount(value: number | null): value is number {
  return value !== null && value >= 0 && hasAtMostTwoDecimals(value);
}

export function AccountingSettingsOpeningSection({
  accounts,
  fiscalYears,
  decimalSeparator,
}: AccountingSettingsOpeningSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  // The server rejects posting into a closed year, so closed years are not offered here.
  const openYears = useMemo(
    () =>
      fiscalYears
        .filter((year) => year.status !== "closed")
        .sort((left, right) => right.startDate.localeCompare(left.startDate)),
    [fiscalYears],
  );
  const [fiscalYearId, setFiscalYearId] = useState(openYears[0]?.id ?? "");
  const [accountId, setAccountId] = useState("");
  const [debit, setDebit] = useState("0");
  const [credit, setCredit] = useState("0");
  const [formError, setFormError] = useState<string | null>(null);
  const openingQuery = useOpeningBalances(fiscalYearId || undefined);
  const save = useSaveOpeningBalances();
  const post = usePostOpeningBalances();

  useEffect(() => {
    if (!openYears.some((year) => year.id === fiscalYearId)) {
      setFiscalYearId(openYears[0]?.id ?? "");
      setFormError(null);
    }
  }, [fiscalYearId, openYears]);

  const balances = useMemo(() => openingQuery.data ?? [], [openingQuery.data]);

  /**
   * Add and Remove PUT a **full replacement** of the year's rows (the server
   * deletes every row for the year, then inserts what it was sent). They are
   * therefore only allowed once the *current* year's rows are known: with a
   * bare `keepPreviousData` placeholder the list can still belong to the
   * previous year, and writing `[...balances, newRow]` would delete every stored
   * balance for the selected year while reporting success.
   */
  const rowsReady = openingQuery.isSuccess && !openingQuery.isPlaceholderData;

  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const accountLabel = (rowAccountId: string): string => {
    const account = accountById.get(rowAccountId);
    return account ? `${account.code} – ${account.name}` : rowAccountId;
  };

  /** Integer-cents totals — the ledger compares cents, so the UI must too. */
  const totals = useMemo(() => {
    const debitCents = balances.reduce((sum, row) => sum + moneyToCents(row.debit), 0);
    const creditCents = balances.reduce((sum, row) => sum + moneyToCents(row.credit), 0);
    const singleSided = balances.every((row) => !(row.debit > 0 && row.credit > 0));
    return {
      debitCents,
      creditCents,
      singleSided,
      balanced: debitCents === creditCents,
      postable: balances.length > 0 && singleSided && debitCents === creditCents,
    };
  }, [balances]);

  const postBlockedReason = !rowsReady
    ? null
    : balances.length === 0
      ? t("accounting.settings.opening.postBlockedEmpty")
      : !totals.singleSided
        ? t("accounting.settings.opening.postBlockedSingleSided")
        : !totals.balanced
          ? t("accounting.settings.opening.postBlockedUnbalanced")
          : null;

  const payloadRows = () =>
    balances.map((row) => ({
      id: row.id,
      fiscalYearId,
      accountId: row.accountId,
      debit: row.debit,
      credit: row.credit,
    }));

  const handleAdd = async (): Promise<void> => {
    if (!fiscalYearId || !accountId || !rowsReady) return;
    const debitValue = parseMoneyInput(debit, decimalSeparator);
    const creditValue = parseMoneyInput(credit, decimalSeparator);
    if (!isPostableMoneyAmount(debitValue) || !isPostableMoneyAmount(creditValue)) {
      setFormError(t("accounting.settings.opening.invalidAmount"));
      return;
    }
    // The shared `openingBalanceInsertSchema` rejects a row with both sides
    // positive; catching it here explains the rule instead of surfacing a
    // "must form a balanced journal" error from the posting guard.
    if (debitValue > 0 && creditValue > 0) {
      setFormError(t("accounting.settings.opening.singleSidedError"));
      return;
    }
    setFormError(null);
    try {
      await save.mutateAsync({
        fiscalYearId,
        balances: [
          ...payloadRows(),
          {
            id: `ob-${crypto.randomUUID()}`,
            fiscalYearId,
            accountId,
            debit: debitValue,
            credit: creditValue,
          },
        ],
      });
      setDebit("0");
      setCredit("0");
      notify.success(t("accounting.settings.opening.saved"));
    } catch (error) {
      notify.error(t("accounting.settings.opening.saveFailed"), {
        description: accountingErrorMessage(error),
      });
    }
  };

  const handleRemove = async (balanceId: string): Promise<void> => {
    if (!fiscalYearId || !rowsReady) return;
    try {
      await save.mutateAsync({
        fiscalYearId,
        balances: payloadRows().filter((row) => row.id !== balanceId),
      });
      notify.success(t("accounting.settings.opening.saved"));
    } catch (error) {
      notify.error(t("accounting.settings.opening.saveFailed"), {
        description: accountingErrorMessage(error),
      });
    }
  };

  const handlePost = async (): Promise<void> => {
    if (!fiscalYearId || !rowsReady || !totals.postable) return;
    try {
      const result = await post.mutateAsync(fiscalYearId);
      if (result.posted) {
        notify.success(t("accounting.settings.opening.posted"));
      } else {
        // `posted: false` means the stored balances were already posted
        // unchanged — an idempotent replay, not a new posting.
        notify.info(t("accounting.settings.opening.alreadyPosted"));
      }
    } catch (error) {
      notify.error(t("accounting.settings.opening.postFailed"), {
        description: accountingErrorMessage(error),
      });
    }
  };

  return (
    <SectionCard title={t("accounting.settings.secOpening")} icon={Scale} className={SETUP_SECTION_CARD_CLASS}>
      <p className="m-0 mb-3 text-xs text-muted-foreground">{t("accounting.settings.opening.hint")}</p>
      <Field id="opening-fy" label={t("accounting.settings.fy.label")}>
        <FormSelect
          id="opening-fy"
          name="fiscalYearId"
          value={fiscalYearId}
          onChange={setFiscalYearId}
          options={openYears.map((year) => ({ value: year.id, label: year.label }))}
        />
      </Field>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormSelect
          id="opening-account"
          name="accountId"
          value={accountId}
          onChange={setAccountId}
          placeholder={t("accounting.settings.opening.account")}
          options={accounts
            .filter((account) => account.isActive !== false)
            .map((account) => ({ value: account.id, label: `${account.code} – ${account.name}` }))}
        />
        <Input
          id="opening-debit"
          name="debit"
          className={FORM_INPUT}
          inputMode="decimal"
          value={debit}
          onChange={(event) => setDebit(event.target.value)}
          aria-label={t("accounting.settings.opening.debit")}
        />
        <Input
          id="opening-credit"
          name="credit"
          className={FORM_INPUT}
          inputMode="decimal"
          value={credit}
          onChange={(event) => setCredit(event.target.value)}
          aria-label={t("accounting.settings.opening.credit")}
        />
      </div>
      <FieldErrorMessage message={formError ?? undefined} className="mt-2" />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" className="min-h-11" onClick={async () => { await handleAdd(); }} disabled={!fiscalYearId || !accountId || !rowsReady || save.isPending}>
          {t("accounting.settings.opening.add")}
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={async () => { await handlePost(); }} disabled={!fiscalYearId || !rowsReady || !totals.postable || post.isPending}>
          {t("accounting.settings.opening.post")}
        </Button>
      </div>

      {openingQuery.isError && (
        <p role="alert" className="m-0 mt-3 text-xs text-destructive">
          {t("accounting.settings.opening.loadFailed")}
        </p>
      )}

      {balances.length > 0 && (
        <ul className="m-0 mt-3 list-none space-y-1 p-0">
          {balances.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1.5"
            >
              <span className="min-w-0 truncate text-xs text-foreground">{accountLabel(row.accountId)}</span>
              <span className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-muted-foreground">
                <span>{t("accounting.settings.opening.debit")} {row.debit.toFixed(2)}</span>
                <span>{t("accounting.settings.opening.credit")} {row.credit.toFixed(2)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => { await handleRemove(row.id); }}
                  disabled={!rowsReady || save.isPending}
                  className="min-h-11 min-w-11 text-destructive hover:text-destructive/80"
                  aria-label={`${t("accounting.settings.opening.remove")} ${accountLabel(row.accountId)}`}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="m-0 mt-3 text-xs text-muted-foreground">
        {t("accounting.settings.opening.count", { count: String(balances.length) })}
      </p>
      {rowsReady && (
        <p className="m-0 mt-1 text-xs text-muted-foreground">
          {t("accounting.settings.opening.totals", {
            debit: (totals.debitCents / 100).toFixed(2),
            credit: (totals.creditCents / 100).toFixed(2),
          })}
        </p>
      )}
      {postBlockedReason && (
        <p className="m-0 mt-1 text-xs text-muted-foreground">{postBlockedReason}</p>
      )}
      {rowsReady && !postBlockedReason && (
        <p className="m-0 mt-1 text-xs text-muted-foreground">
          {t("accounting.settings.opening.balanced")}
        </p>
      )}
    </SectionCard>
  );
}
