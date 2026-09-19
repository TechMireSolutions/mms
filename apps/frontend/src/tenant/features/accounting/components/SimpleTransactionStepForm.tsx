import { createElement, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import type { Account, FiscalYear, JournalEntry } from "@/lib/data/accountingData";
import {
  calculateAccountBalanceCents,
  getTransactionGroupColorClasses,
  wizardAccountOptions,
  wizardCategoryAccountOptions,
  type QuickActionType,
  type WizardFormState,
} from "./simpleTransactionWizardTypes";
import { parseMoneyInput } from "./simpleTransactionMoney";
import { SimpleTransactionAmountInput } from "./SimpleTransactionAmountInput";
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
  amountTouched?: boolean;
  onAmountTouched?: () => void;
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
  amountTouched: amountTouchedProp,
  onAmountTouched,
  onChangeType,
  onProceed,
}: StepTransactionFormProps) {
  const { t } = useTranslation();
  const prefix = idPrefix ?? "wizard";
  // D2: amountTouched may be lifted from the wizard (survives step changes) or local fallback
  const [localAmountTouched, setLocalAmountTouched] = useState(false);
  const amountTouched = amountTouchedProp ?? localAmountTouched;
  const markAmountTouched = () => {
    setLocalAmountTouched(true);
    onAmountTouched?.();
  };
  const isMoneyIn = type.groupKey === "accounting.journal.dashboard.group.moneyIn";
  const isTransfer = type.groupKey === "accounting.journal.dashboard.group.transfers";
  const showFiscalYear = (fiscalYears ?? []).length > 1;
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
  const isSameAccount = Boolean(form.debitAcc && form.creditAcc && form.debitAcc === form.creditAcc);
  const currencyPaddingClass = currencySymbol.length > 2 ? "ps-14" : currencySymbol.length > 1 ? "ps-11" : "ps-8";

  // D7: warn when the money-leg account has zero or negative balance
  const moneyLegAccountId = isMoneyIn ? form.debitAcc : form.creditAcc;
  const moneyLegBalanceCents = useMemo(
    () => (moneyLegAccountId && entries ? calculateAccountBalanceCents(moneyLegAccountId, entries) : null),
    [moneyLegAccountId, entries],
  );
  const showLowBalanceWarning = !isMoneyIn && moneyLegBalanceCents !== null && moneyLegBalanceCents <= 0;

  // D4: Transfer legs shown as "From → To" (human reading order)
  const leg1 = isMoneyIn
    ? { id: `${prefix}-acc-in`, label: t("accounting.journal.dashboard.wizard.receivedInto"), field: "debitAcc" as const, options: accountOptions }
    : isTransfer
      ? { id: `${prefix}-acc-from`, label: t("accounting.journal.dashboard.wizard.transferFrom"), field: "creditAcc" as const, options: accountOptions }
      : { id: `${prefix}-acc-out`, label: t("accounting.journal.dashboard.wizard.paidFrom"), field: "creditAcc" as const, options: accountOptions };

  const leg2 = isMoneyIn
    ? { id: `${prefix}-acc-category-in`, label: t("accounting.journal.dashboard.wizard.incomeCategory"), field: "creditAcc" as const, options: revenueOptions }
    : isTransfer
      ? { id: `${prefix}-acc-to`, label: t("accounting.journal.dashboard.wizard.transferTo"), field: "debitAcc" as const, options: accountOptions }
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

        {showFiscalYear && (
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
        )}

        <SimpleTransactionAmountInput
          prefix={prefix}
          amount={form.amount}
          currencySymbol={currencySymbol}
          currencyPaddingClass={currencyPaddingClass}
          showAmountRequired={amountTouched && form.amount.trim() === ""}
          amountIsInvalid={amountIsInvalid}
          onChange={(val) => {
            markAmountTouched();
            setForm((prev) => ({ ...prev, amount: val }));
          }}
          onBlur={markAmountTouched}
          onProceed={onProceed}
        />

        <div>
          <label htmlFor={`${prefix}-ref`} className={FORM_LABEL}>
            {t("accounting.journal.dashboard.wizard.refNo")}
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
          <p className="text-xs text-muted-foreground mt-1">{t("accounting.journal.dashboard.wizard.optional")}</p>
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
          {showLowBalanceWarning && leg1.field === "creditAcc" && (
            <p className="flex items-center gap-1 text-xs text-warning mt-1">
              <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
              {t("accounting.journal.dashboard.wizard.lowBalanceWarning")}
            </p>
          )}
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
