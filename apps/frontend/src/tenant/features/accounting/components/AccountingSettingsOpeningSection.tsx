import React from "react";
import type { Account, FiscalYear } from "@mms/shared";
import { Scale, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { Field, FieldErrorMessage } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import type { MoneySeparator } from "@/tenant/features/accounting/hooks/useAccountingLedgerOps";
import { useAccountingOpeningBalancesState } from "@/tenant/features/accounting/hooks/useAccountingOpeningBalancesState";

interface AccountingSettingsOpeningSectionProps {
  accounts: Account[];
  fiscalYears: FiscalYear[];
  /** `decimalSeparator` preference — money inputs must be parsed with it. */
  decimalSeparator: MoneySeparator;
}

export function AccountingSettingsOpeningSection({
  accounts,
  fiscalYears,
  decimalSeparator,
}: AccountingSettingsOpeningSectionProps): React.JSX.Element {
  const {
    t,
    openYears,
    fiscalYearId,
    setFiscalYearId,
    accountId,
    setAccountId,
    debit,
    setDebit,
    credit,
    setCredit,
    formError,
    balances,
    rowsReady,
    accountLabel,
    totals,
    postBlockedReason,
    handleAdd,
    handleRemove,
    handlePost,
    savePending,
    postPending,
    isError,
  } = useAccountingOpeningBalancesState({ accounts, fiscalYears, decimalSeparator });

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
          aria-label={t("accounting.settings.opening.account")}
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
        <Button
          type="button"
          className="min-h-11"
          onClick={async () => { await handleAdd(); }}
          disabled={!fiscalYearId || !accountId || !rowsReady || savePending}
        >
          {t("accounting.settings.opening.add")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={async () => { await handlePost(); }}
          disabled={!fiscalYearId || !rowsReady || !totals.postable || postPending}
        >
          {t("accounting.settings.opening.post")}
        </Button>
      </div>

      {isError && (
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
                  disabled={!rowsReady || savePending}
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
