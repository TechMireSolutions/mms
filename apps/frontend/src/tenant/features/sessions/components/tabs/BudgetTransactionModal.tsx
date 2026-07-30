import React, { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/data/sessionsData';
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { RequiredMark } from "@/components/ui/FormPrimitives";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { todayISO, type AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";

/** A single income or expense transaction entry. */
export interface TransactionEntry {
  id: string;
  category: string;
  amount: number;
  date: string;
  note: string;
}

interface BudgetTransactionModalProps {
  open: boolean;
  type: "income" | "expense";
  currency: string;
  onClose: () => void;
  onSave: (tx: TransactionEntry) => void | Promise<void>;
  saving: boolean;
}

export function BudgetTransactionModal({ open, type, currency, onClose, onSave, saving }: BudgetTransactionModalProps) {
  const { t } = useTranslation();
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [transactionDraft, setTransactionDraft] = useState({ category: categories[0], amount: "", date: todayISO(), note: "" });
  const updateTransactionDraft = (field: keyof typeof transactionDraft, value: string) => setTransactionDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  React.useEffect(() => {
    if (open) {
      const categoryOptions = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      setTransactionDraft({ category: categoryOptions[0], amount: "", date: todayISO(), note: "" });
    }
  }, [open, type]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={type === "income" ? t("sessions.budget.addIncome") : t("sessions.budget.addExpense")}
      icon={type === "income" ? TrendingUp : TrendingDown}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.add")}
      onSave={() => onSave({ ...transactionDraft, amount: +transactionDraft.amount, id: `tx${Date.now()}` })}
      saveDisabled={!transactionDraft.amount}
      saving={saving}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="tx-category">{t("sessions.budget.form.category")}</label>
          <FormSelect
            id="tx-category"
            value={transactionDraft.category}
            onChange={(value) => updateTransactionDraft("category", value)}
            options={categories.map((category) => ({ value: category, label: t(`sessions.budget.category.${category.replaceAll(" ", "").toLowerCase()}` as AppTranslationKey) }))}
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="tx-amount">{t("sessions.budget.form.amount", { currency })}<RequiredMark /></label>
            <Input id="tx-amount" type="number" value={transactionDraft.amount} onChange={(event) => updateTransactionDraft("amount", event.target.value)} placeholder="0" min={0} required />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="tx-date">{t("sessions.budget.form.date")}</label>
            <DatePicker
              id="tx-date"
              value={transactionDraft.date}
              onChange={(value) => updateTransactionDraft("date", value)}
              required
            />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="tx-note">{t("sessions.budget.form.note")}</label>
          <Input id="tx-note" value={transactionDraft.note} onChange={(event) => updateTransactionDraft("note", event.target.value)} placeholder={t("sessions.budget.form.notePlaceholder")} />
        </div>
      </div>
    </FormModal>
  );
}
