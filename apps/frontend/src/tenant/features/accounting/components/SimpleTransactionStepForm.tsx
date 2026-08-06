import { createElement, type Dispatch, type SetStateAction } from "react";
import { Upload } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import type { Account } from "@/lib/data/accountingData";
import { getTransactionGroupColorClasses, type QuickActionType, type WizardFormState } from "./simpleTransactionWizardTypes";

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
  const cashAccounts = accounts.filter((account) => ["a1000", "a1010", "a1020"].includes(account.id));
  const cashAccountOptions = cashAccounts.map((account) => ({ value: account.id, label: account.name }));

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
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              placeholder="0.00"
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              className="ps-8 text-lg font-bold"
              aria-invalid={!form.amount}
            />
          </div>
          {!form.amount && <p className="text-xs text-warning mt-1" role="alert">{t("accounting.journal.dashboard.wizard.errorAmount")}</p>}
        </div>

        {isMoneyIn ? (
          <div className="sm:col-span-2">
            <label htmlFor="wizard-acc-in" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.receivedInto")}</label>
            <FormSelect
              id="wizard-acc-in"
              value={form.debitAcc}
              onChange={(accountId) => setForm({ ...form, debitAcc: accountId })}
              options={cashAccountOptions}
            />
          </div>
        ) : isTransfer ? (
          <>
            <div>
              <label htmlFor="wizard-acc-to" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.transferTo")}</label>
              <FormSelect
                id="wizard-acc-to"
                value={form.debitAcc}
                onChange={(accountId) => setForm({ ...form, debitAcc: accountId })}
                options={cashAccountOptions}
              />
            </div>
            <div>
              <label htmlFor="wizard-acc-from" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.transferFrom")}</label>
              <FormSelect
                id="wizard-acc-from"
                value={form.creditAcc}
                onChange={(accountId) => setForm({ ...form, creditAcc: accountId })}
                options={cashAccountOptions}
              />
            </div>
          </>
        ) : (
          <div className="sm:col-span-2">
            <label htmlFor="wizard-acc-out" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.paidFrom")}</label>
            <FormSelect
              id="wizard-acc-out"
              value={form.creditAcc}
              onChange={(accountId) => setForm({ ...form, creditAcc: accountId })}
              options={cashAccountOptions}
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor="wizard-description" className={FORM_LABEL}>{t("accounting.columns.journal.description")}</label>
          <Input
            id="wizard-description"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder={t(type.descriptionKey)}
          />
        </div>

        <div>
          <label htmlFor="wizard-ref" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.refNo")} <span className="normal-case font-normal text-muted-foreground">{t("accounting.journal.dashboard.wizard.optional")}</span></label>
          <Input
            id="wizard-ref"
            value={form.ref}
            onChange={(event) => setForm({ ...form, ref: event.target.value })}
            placeholder={t("accounting.journal.dashboard.wizard.refPlaceholder")}
          />
        </div>

        <div>
          <label className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.receipt")} <span className="normal-case font-normal text-muted-foreground">{t("accounting.journal.dashboard.wizard.optional")}</span></label>
          <label className={`${FORM_INPUT} flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground`}>
            <Upload className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs">{form.receipt ? form.receipt : t("accounting.journal.dashboard.wizard.uploadReceipt")}</span>
            <Input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(event) => setForm({ ...form, receipt: event.target.files?.[0]?.name || "" })}
            />
          </label>
        </div>
      </div>
    </fieldset>
  );
}
