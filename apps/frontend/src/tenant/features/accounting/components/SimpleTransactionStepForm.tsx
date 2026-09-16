import { createElement, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import type { Account, FiscalYear } from "@/lib/data/accountingData";
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
  onProceed?: () => void;
}

export function StepTransactionForm({
  type,
  form,
  setForm,
  accounts,
  currencySymbol,
  fiscalYears,
  onProceed,
}: StepTransactionFormProps) {
  const { t } = useTranslation();
  const [amountTouched, setAmountTouched] = useState(false);
  const isMoneyIn = type.groupKey === "accounting.journal.dashboard.group.moneyIn";
  const isTransfer = type.groupKey === "accounting.journal.dashboard.group.transfers";
  /**
   * Cash/bank options come from the live chart: accounts created in the UI carry
   * generated ids, so filtering by the seed ids ("a1000"…) left every workspace
   * with its own cash/bank accounts unable to record a simple transaction.
   */
  const accountOptions = useMemo(() => wizardAccountOptions(accounts), [accounts]);
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
    ? { id: "wizard-acc-in", label: t("accounting.journal.dashboard.wizard.receivedInto"), field: "debitAcc" as const, options: accountOptions }
    : isTransfer
      ? { id: "wizard-acc-to", label: t("accounting.journal.dashboard.wizard.transferTo"), field: "debitAcc" as const, options: accountOptions }
      : { id: "wizard-acc-out", label: t("accounting.journal.dashboard.wizard.paidFrom"), field: "creditAcc" as const, options: accountOptions };

  const leg2 = isMoneyIn
    ? { id: "wizard-acc-category-in", label: t("accounting.journal.dashboard.wizard.incomeCategory"), field: "creditAcc" as const, options: revenueOptions }
    : isTransfer
      ? { id: "wizard-acc-from", label: t("accounting.journal.dashboard.wizard.transferFrom"), field: "creditAcc" as const, options: accountOptions }
      : { id: "wizard-acc-category-out", label: t("accounting.journal.dashboard.wizard.expenseCategory"), field: "debitAcc" as const, options: expenseOptions };

  return (
    <fieldset className="space-y-4 border-0 p-0 m-0">
      <legend className="sr-only">{t("accounting.journal.dashboard.wizard.stepDetails")}</legend>
      <header className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTransactionGroupColorClasses(type.color).icon}`} aria-hidden="true">
          {createElement(type.icon, { className: "w-5 h-5" })}
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground m-0">{t(type.labelKey)}</h3>
          <p className="text-xs text-muted-foreground m-0">{t(type.groupKey)}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="wizard-date" className={FORM_LABEL}>{t("accounting.columns.journal.date")}</label>
          <DatePicker
            id="wizard-date"
            name="date"
            value={form.date}
            onChange={(dateValue) => setForm((prev) => ({ ...prev, date: dateValue }))}
          />
        </div>

        <div>
          <label htmlFor="wizard-fiscal-year" className={FORM_LABEL}>{t("accounting.journal.form.financialYear")}</label>
          <FormSelect
            id="wizard-fiscal-year"
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
          <label htmlFor="wizard-amount" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.amount")}</label>
          <div className="relative">
            <span
              className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none select-none"
              aria-hidden="true"
            >
              {currencySymbol}
            </span>
            <Input
              id="wizard-amount"
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
                  ? "wizard-amount-required-error"
                  : amountIsInvalid
                    ? "wizard-amount-invalid-error"
                    : undefined
              }
            />
          </div>
          {showAmountRequired && (
            <p id="wizard-amount-required-error" className="text-xs text-warning mt-1" role="alert">
              {t("accounting.journal.dashboard.wizard.errorAmount")}
            </p>
          )}
          {amountIsInvalid && (
            <p id="wizard-amount-invalid-error" className="text-xs text-destructive mt-1" role="alert">
              {t("accounting.journal.dashboard.wizard.errorAmountInvalid")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="wizard-ref" className={FORM_LABEL}>
            {t("accounting.journal.dashboard.wizard.refNo")}{" "}
            <span className="normal-case font-normal text-muted-foreground">{t("accounting.journal.dashboard.wizard.optional")}</span>
          </label>
          <Input
            id="wizard-ref"
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
            aria-describedby={isSameAccount ? "wizard-account-same-error" : undefined}
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
            aria-describedby={isSameAccount ? "wizard-account-same-error" : undefined}
          />
        </div>

        {isSameAccount && (
          <div className="sm:col-span-2">
            <p id="wizard-account-same-error" className="text-xs text-destructive m-0" role="alert">
              {t("accounting.journal.dashboard.wizard.errorSameAccount")}
            </p>
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor="wizard-description" className={FORM_LABEL}>{t("accounting.columns.journal.description")}</label>
          <Input
            id="wizard-description"
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
        />
      </div>
    </fieldset>
  );
}
