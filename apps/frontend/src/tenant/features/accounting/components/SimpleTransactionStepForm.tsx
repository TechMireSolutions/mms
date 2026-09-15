import { createElement, type Dispatch, type SetStateAction } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import type { Account } from "@/lib/data/accountingData";
import { getTransactionGroupColorClasses, wizardAccountOptions, type QuickActionType, type WizardFormState } from "./simpleTransactionWizardTypes";
import { parseMoneyInput } from "./simpleTransactionMoney";

interface StepTransactionFormProps {
  type: QuickActionType;
  form: WizardFormState;
  setForm: Dispatch<SetStateAction<WizardFormState>>;
  accounts: Account[];
  currencySymbol: string;
}

export function StepTransactionForm({ type, form, setForm, accounts, currencySymbol }: StepTransactionFormProps) {
  const { t } = useTranslation();
  const isMoneyIn = type.groupKey === "accounting.journal.dashboard.group.moneyIn";
  const isTransfer = type.groupKey === "accounting.journal.dashboard.group.transfers";
  /**
   * Cash/bank options come from the live chart: accounts created in the UI carry
   * generated ids, so filtering by the seed ids ("a1000"…) left every workspace
   * with its own cash/bank accounts unable to record a simple transaction.
   */
  const accountOptions = wizardAccountOptions(accounts);
  const selectAccountPlaceholder = t("accounting.journal.form.selectAccount");
  const amountIsEmpty = form.amount.trim() === "";
  const parsedAmount = parseMoneyInput(form.amount);
  const amountIsInvalid = !amountIsEmpty && (parsedAmount === null || parsedAmount <= 0);

  return (
    <fieldset className="space-y-4 border-0 p-0 m-0">
      <legend className="sr-only">{t("accounting.journal.dashboard.wizard.reviewTitle")}</legend>
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
            onChange={(dateValue) => setForm({ ...form, date: dateValue })}
          />
        </div>

        <div>
          <label htmlFor="wizard-amount" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.amount")}</label>
          <div className="relative">
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground" aria-hidden="true">{currencySymbol}</span>
            <Input
              id="wizard-amount"
              name="amount"
              type="text"
              inputMode="decimal"
              value={form.amount}
              placeholder="0.00"
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              className="ps-8 text-lg font-bold"
              aria-invalid={amountIsEmpty || amountIsInvalid}
            />
          </div>
          {amountIsEmpty && <p className="text-xs text-warning mt-1" role="alert">{t("accounting.journal.dashboard.wizard.errorAmount")}</p>}
          {amountIsInvalid && <p className="text-xs text-destructive mt-1" role="alert">{t("accounting.journal.dashboard.wizard.errorAmountInvalid")}</p>}
        </div>

        {isMoneyIn ? (
          <div className="sm:col-span-2">
            <label htmlFor="wizard-acc-in" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.receivedInto")}</label>
            <FormSelect
              id="wizard-acc-in"
              name="debitAcc"
              value={form.debitAcc}
              onChange={(accountId) => setForm({ ...form, debitAcc: accountId })}
              options={accountOptions}
              placeholder={selectAccountPlaceholder}
            />
          </div>
        ) : isTransfer ? (
          <>
            <div>
              <label htmlFor="wizard-acc-to" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.transferTo")}</label>
              <FormSelect
                id="wizard-acc-to"
                name="debitAcc"
                value={form.debitAcc}
                onChange={(accountId) => setForm({ ...form, debitAcc: accountId })}
                options={accountOptions}
                placeholder={selectAccountPlaceholder}
              />
            </div>
            <div>
              <label htmlFor="wizard-acc-from" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.transferFrom")}</label>
              <FormSelect
                id="wizard-acc-from"
                name="creditAcc"
                value={form.creditAcc}
                onChange={(accountId) => setForm({ ...form, creditAcc: accountId })}
                options={accountOptions}
                placeholder={selectAccountPlaceholder}
              />
            </div>
          </>
        ) : (
          <div className="sm:col-span-2">
            <label htmlFor="wizard-acc-out" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.paidFrom")}</label>
            <FormSelect
              id="wizard-acc-out"
              name="creditAcc"
              value={form.creditAcc}
              onChange={(accountId) => setForm({ ...form, creditAcc: accountId })}
              options={accountOptions}
              placeholder={selectAccountPlaceholder}
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor="wizard-description" className={FORM_LABEL}>{t("accounting.columns.journal.description")}</label>
          <Input
            id="wizard-description"
            name="description"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder={t(type.descriptionKey)}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="wizard-ref" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.refNo")} <span className="normal-case font-normal text-muted-foreground">{t("accounting.journal.dashboard.wizard.optional")}</span></label>
          <Input
            id="wizard-ref"
            name="ref"
            value={form.ref}
            onChange={(event) => setForm({ ...form, ref: event.target.value })}
            placeholder={t("accounting.journal.dashboard.wizard.refPlaceholder")}
          />
        </div>
      </div>
    </fieldset>
  );
}
