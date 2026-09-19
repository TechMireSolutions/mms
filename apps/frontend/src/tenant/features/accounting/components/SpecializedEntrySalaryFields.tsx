import React, { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { Account, SalaryEntryInput } from "@mms/shared";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { TranslatedFormMessage } from "@/lib/forms/TranslatedFormMessage";
import { useTranslation } from "@/hooks/useTranslation";
import { SpecializedEntryStaffPicker } from "@/tenant/features/accounting/components/SpecializedEntryStaffPicker";

export function SpecializedEntrySalaryFields({
  form,
  accounts,
}: {
  form: UseFormReturn<SalaryEntryInput>;
  accounts: Account[];
}): React.JSX.Element {
  const { t } = useTranslation();

  const activeAccounts = useMemo(() => accounts.filter((account) => account.isActive), [accounts]);
  const expenseAccounts = useMemo(
    () => activeAccounts.filter((account) => account.type === "Expense"),
    [activeAccounts],
  );
  const paymentAccounts = useMemo(
    () => activeAccounts.filter((account) => account.type === "Asset"),
    [activeAccounts],
  );

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="staffId"
        render={({ field }) => (
          <FormItem>
            <SpecializedEntryStaffPicker staffId={field.value || ""} onPick={(id) => field.onChange(id)} />
            <TranslatedFormMessage messageKey={form.formState.errors.staffId?.message} />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="payPeriod"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="specialized-entry-pay-period">
              {t("accounting.journal.specializedEntry.salary.period")}
            </FormLabel>
            <FormControl>
              <Input
                id="specialized-entry-pay-period"
                name="payPeriod"
                className={FORM_INPUT}
                placeholder="YYYY-MM"
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
              />
            </FormControl>
            <TranslatedFormMessage messageKey={form.formState.errors.payPeriod?.message} />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="specialized-entry-salary-amount">
                {t("accounting.journal.specializedEntry.amount")}
              </FormLabel>
              <FormControl>
                <Input
                  id="specialized-entry-salary-amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  className={FORM_INPUT}
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </FormControl>
              <TranslatedFormMessage messageKey={form.formState.errors.amount?.message} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="specialized-entry-salary-date">
                {t("accounting.journal.specializedEntry.date")}
              </FormLabel>
              <FormControl>
                <DatePicker
                  id="specialized-entry-salary-date"
                  name="date"
                  value={field.value}
                  onChange={field.onChange}
                  required
                />
              </FormControl>
              <TranslatedFormMessage messageKey={form.formState.errors.date?.message} />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="expenseAccountId"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="specialized-entry-expense-account">
              {t("accounting.journal.specializedEntry.salary.expenseAccount")}
            </FormLabel>
            <FormControl>
              <FormSelect
                id="specialized-entry-expense-account"
                name="expenseAccountId"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: "", label: t("common.none") },
                  ...expenseAccounts.map((account) => ({
                    value: account.id,
                    label: `${account.code} — ${account.name}`,
                  })),
                ]}
              />
            </FormControl>
            <TranslatedFormMessage messageKey={form.formState.errors.expenseAccountId?.message} />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="paymentAccountId"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="specialized-entry-payment-account">
              {t("accounting.journal.specializedEntry.salary.paymentAccount")}
            </FormLabel>
            <FormControl>
              <FormSelect
                id="specialized-entry-payment-account"
                name="paymentAccountId"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: "", label: t("common.none") },
                  ...paymentAccounts.map((account) => ({
                    value: account.id,
                    label: `${account.code} — ${account.name}`,
                  })),
                ]}
              />
            </FormControl>
            <TranslatedFormMessage messageKey={form.formState.errors.paymentAccountId?.message} />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="specialized-entry-salary-note">
              {t("accounting.journal.specializedEntry.note")}
            </FormLabel>
            <FormControl>
              <Textarea
                id="specialized-entry-salary-note"
                name="note"
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
