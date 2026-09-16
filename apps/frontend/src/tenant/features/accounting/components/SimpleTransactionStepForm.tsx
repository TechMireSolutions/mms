import { createElement, useId, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import type { Account, FiscalYear, JournalEntry } from "@/lib/data/accountingData";
import {
  getTransactionGroupColorClasses,
  wizardAccountOptions,
  wizardCategoryAccountOptions,
  type QuickActionType,
  type WizardFormState,
} from "./simpleTransactionWizardTypes";
import { parseMoneyInput } from "./simpleTransactionMoney";
import { SimpleTransactionTagSelector } from "./SimpleTransactionTagSelector";

interface StepTransactionFormProps {
  type: QuickActionType;
  form: WizardFormState;
  setForm: Dispatch<SetStateAction<WizardFormState>>;
  accounts: Account[];
  currencySymbol: string;
  fiscalYears?: FiscalYear[];
  entries?: readonly JournalEntry[];
  formatCurrency?: (amount: number | string | null | undefined) => string;
  idPrefix?: string;
  onChangeType?: () => void;
  onProceed?: () => void;
}

export function StepTransactionForm({
  type,
  form,
  setForm,
  accounts,
  currencySymbol,
  fiscalYears,
  entries,
  formatCurrency,
  idPrefix,
  onChangeType,
  onProceed,
}: StepTransactionFormProps) {
  const { t } = useTranslation();
  const reactId = useId();
  const prefix = idPrefix ?? "wizard";
  const [amountTouched, setAmountTouched] = useState(false);
  const isMoneyIn = type.groupKey === "accounting.journal.dashboard.group.moneyIn";
  const isTransfer = type.groupKey === "accounting.journal.dashboard.group.transfers";
  /**
   * Cash/bank options come from the live chart: accounts created in the UI carry
   * generated ids, so filtering by the seed ids ("a1000"…) left every workspace
   * with its own cash/bank accounts unable to record a simple transaction.
   */
  const accountOptions = useMemo(
    () => wizardAccountOptions(accounts, entries, formatCurrency ? (amount) => formatCurrency(amount) : undefined),
    [accounts, entries, formatCurrency],
  );
  const revenueOptions = useMemo(() => wizardCategoryAccountOptions(accounts, "Revenue"), [accounts]);
  const expenseOptions = useMemo(() => wizardCategoryAccountOptions(accounts, "Expense"), [accounts]);
  const fiscalYearOptions = useMemo(
    () => (fiscalYears || []).map((fiscalYear) => ({ value: fiscalYear.label, label: fiscalYear.label })),
    [fiscalYears],
  );
  const selectAccountPlaceholder = t("accounting.journal.form.selectAccount");
  const amountIsEmpty = form.amount.trim() === "";
  const parsedAmount = parseMoneyInput(form.amount);
  const isTypingDecimal = form.amount.endsWith(".") || form.amount.endsWith(",");
  const amountIsInvalid = !amountIsEmpty && !isTypingDecimal && (parsedAmount === null || parsedAmount <= 0);
  const showAmountRequired = amountTouched && amountIsEmpty;
  const isSameAccount = Boolean(form.debitAcc && form.creditAcc && form.debitAcc === form.creditAcc);
  const currencyPaddingClass = currencySymbol.length > 2 ? "ps-14" : currencySymbol.length > 1 ? "ps-11" : "ps-8";

  const leg1 = isMoneyIn
    ? { id: `${prefix}-acc-in`, label: t("accounting.journal.dashboard.wizard.receivedInto"), field: "debitAcc" as const, options: accountOptions }
    : isTransfer
      ? { id: `${prefix}-acc-to`, label: t("accounting.journal.dashboard.wizard.transferTo"), field: "debitAcc" as const, options: accountOptions }
      : { id: `${prefix}-acc-out`, label: t("accounting.journal.dashboard.wizard.paidFrom"), field: "creditAcc" as const, options: accountOptions };

  const leg2 = isMoneyIn
    ? { id: `${prefix}-acc-category-in`, label: t("accounting.journal.dashboard.wizard.incomeCategory"), field: "creditAcc" as const, options: revenueOptions }
    : isTransfer
      ? { id: `${prefix}-acc-from`, label: t("accounting.journal.dashboard.wizard.transferFrom"), field: "creditAcc" as const, options: accountOptions }
      : { id: `${prefix}-acc-category-out`, label: t("accounting.journal.dashboard.wizard.expenseCategory"), field: "debitAcc" as const, options: expenseOptions };

  return (
    <fieldset className="space-y-4 border-0 p-0 m-0">
      <legend className="sr-only">{t("accounting.journal.dashboard.wizard.stepDetails")}</legend>
      <header className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getTransactionGroupColorClasses(type.color).icon}`} aria-hidden="true">
            {createElement(type.icon, { className: "w-5 h-5" })}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate m-0">{t(type.labelKey)}</h3>
            <p className="text-xs text-muted-foreground truncate m-0">{t(type.groupKey)}</p>
          </div>
        </div>
        {onChangeType && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onChangeType}
            className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            {t("accounting.journal.dashboard.wizard.changeType")}
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${prefix}-date`} className={FORM_LABEL}>{t("accounting.columns.journal.date")}</label>
          <DatePicker
            id={`${prefix}-date`}
            name="date"
            value={form.date}
            onChange={(dateValue) => setForm((prev) => ({ ...prev, date: dateValue }))}
          />
        </div>

        <div>
          <label htmlFor={`${prefix}-fiscal-year`} className={FORM_LABEL}>{t("accounting.journal.form.financialYear")}</label>
          <FormSelect
            id={`${prefix}-fiscal-year`}
            name="fiscalYear"
            value={form.fiscal_year || ""}
            onChange={(fiscalYearValue) => {
              const selected = (fiscalYears || []).find(
                (fiscalYear) => fiscalYear.id === fiscalYearValue || fiscalYear.label === fiscalYearValue,
              );
              setForm((prev) => ({
                ...prev,
                fiscal_year: selected?.label ?? fiscalYearValue,
              }));
            }}
            placeholder={t("accounting.journal.form.none")}
            options={fiscalYearOptions}
          />
        </div>

        <div>
          <label htmlFor={`${prefix}-amount`} className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.amount")}</label>
          <div className="relative">
            <span
              className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none select-none"
              aria-hidden="true"
            >
              {currencySymbol}
            </span>
            <Input
              id={`${prefix}-amount`}
              name="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              value={form.amount}
              onFocus={(event) => event.target.select()}
              onBlur={() => setAmountTouched(true)}
              onChange={(event) => {
                setAmountTouched(true);
                const val = event.target.value;
                setForm((prev) => ({ ...prev, amount: val }));
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onProceed?.();
                }
              }}
              style={{ paddingInlineStart: currencySymbol.length > 2 ? "3.5rem" : currencySymbol.length > 1 ? "2.75rem" : "2rem" }}
              className={`${currencyPaddingClass} text-lg font-bold`}
              aria-invalid={showAmountRequired || amountIsInvalid}
              aria-describedby={
                showAmountRequired
                  ? `${prefix}-amount-required-error`
                  : amountIsInvalid
                    ? `${prefix}-amount-invalid-error`
                    : undefined
              }
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {[100, 500, 1000, 5000].map((inc) => (
              <Button
                key={inc}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAmountTouched(true);
                  const current = parseMoneyInput(form.amount) ?? 0;
                  const next = current + inc;
                  setForm((prev) => ({ ...prev, amount: next % 1 === 0 ? String(next) : next.toFixed(2) }));
                }}
                className="h-6 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                +{inc.toLocaleString()}
              </Button>
            ))}
          </div>
          {showAmountRequired && (
            <p id={`${prefix}-amount-required-error`} className="text-xs text-warning mt-1" role="alert">
              {t("accounting.journal.dashboard.wizard.errorAmount")}
            </p>
          )}
          {amountIsInvalid && (
            <p id={`${prefix}-amount-invalid-error`} className="text-xs text-destructive mt-1" role="alert">
              {t("accounting.journal.dashboard.wizard.errorAmountInvalid")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${prefix}-ref`} className={FORM_LABEL}>
            {t("accounting.journal.dashboard.wizard.refNo")}{" "}
            <span className="normal-case font-normal text-muted-foreground">{t("accounting.journal.dashboard.wizard.optional")}</span>
          </label>
          <Input
            id={`${prefix}-ref`}
            name="ref"
            autoComplete="off"
            value={form.ref}
            onChange={(event) => {
              const val = event.target.value;
              setForm((prev) => ({ ...prev, ref: val }));
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onProceed?.();
              }
            }}
            placeholder={t("accounting.journal.dashboard.wizard.refPlaceholder")}
          />
        </div>

        <div>
          <label htmlFor={leg1.id} className={FORM_LABEL}>{leg1.label}</label>
          <FormSelect
            id={leg1.id}
            name={leg1.field}
            value={form[leg1.field]}
            onChange={(accountId) => setForm((prev) => ({ ...prev, [leg1.field]: accountId }))}
            options={leg1.options}
            placeholder={selectAccountPlaceholder}
            aria-invalid={isSameAccount}
            aria-describedby={isSameAccount ? `${prefix}-account-same-error` : undefined}
          />
        </div>
        <div>
          <label htmlFor={leg2.id} className={FORM_LABEL}>{leg2.label}</label>
          <FormSelect
            id={leg2.id}
            name={leg2.field}
            value={form[leg2.field]}
            onChange={(accountId) => setForm((prev) => ({ ...prev, [leg2.field]: accountId }))}
            options={leg2.options}
            placeholder={selectAccountPlaceholder}
            aria-invalid={isSameAccount}
            aria-describedby={isSameAccount ? `${prefix}-account-same-error` : undefined}
          />
        </div>

        {isSameAccount && (
          <div className="sm:col-span-2">
            <p id={`${prefix}-account-same-error`} className="text-xs text-destructive m-0" role="alert">
              {t("accounting.journal.dashboard.wizard.errorSameAccount")}
            </p>
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor={`${prefix}-description`} className={FORM_LABEL}>{t("accounting.columns.journal.description")}</label>
          <Input
            id={`${prefix}-description`}
            name="description"
            value={form.description}
            onChange={(event) => {
              const val = event.target.value;
              setForm((prev) => ({ ...prev, description: val }));
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onProceed?.();
              }
            }}
            placeholder={t(type.descriptionKey)}
          />
        </div>

        <SimpleTransactionTagSelector
          typeTag={type.tag}
          tags={form.tags || []}
          onChangeTags={(tags) => setForm((prev) => ({ ...prev, tags }))}
          idPrefix={prefix}
        />
      </div>
    </fieldset>
  );
}
