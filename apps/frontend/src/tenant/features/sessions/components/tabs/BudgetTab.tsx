import React, { useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Session, BudgetIncome, BudgetExpense } from '@/lib/data/sessionsData';
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { formatMoney, formatDate, todayISO, type AppTranslationKey } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";

/** A single income or expense transaction entry. */
interface TransactionEntry {
  id: string;
  category: string;
  amount: number;
  date: string;
  note: string;
}

interface TransactionModalProps {
  open: boolean;
  type: "income" | "expense";
  currency: string;
  onClose: () => void;
  onSave: (tx: TransactionEntry) => void | Promise<void>;
  saving: boolean;
}

function TransactionModal({ open, type, currency, onClose, onSave, saving }: TransactionModalProps) {
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
            <label className={FORM_LABEL} htmlFor="tx-amount">{t("sessions.budget.form.amount", { currency })} *</label>
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

interface BudgetTabProps {
  session: Session;
  onUpdate: (session: Session) => void | Promise<void>;
  canWrite: boolean;
}

/**
 * BudgetTab Component
 * 
 * Manages the income and expenses associated with a session.
 * 
 * @param {BudgetTabProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function BudgetTab({ session, onUpdate, canWrite }: BudgetTabProps) {
  const { t } = useTranslation();
  const { activeCurrency } = useFinanceCurrency();
  const [addType, setAddType] = useState<"income" | "expense" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "income" | "expense"; entry: BudgetIncome | BudgetExpense } | null>(null);
  const [saving, setSaving] = useState(false);
  const deletePendingRef = React.useRef(false);
  const budget = session.budget || { totalRevenue: 0, collected: 0, expenses: [], incomes: [] };

  const totalIncome = budget.incomes?.reduce((sum, incomeEntry) => sum + incomeEntry.amount, 0) || 0;
  const totalExpenses = budget.expenses?.reduce((sum, expenseEntry) => sum + expenseEntry.amount, 0) || 0;
  const balance = totalIncome - totalExpenses;

  const handleAdd = async (type: "income" | "expense", transaction: TransactionEntry) => {
    const entryKey = type === "income" ? "incomes" : "expenses";
    setSaving(true);
    try {
      await onUpdate({ ...session, budget: { ...budget, [entryKey]: [...(budget[entryKey] || []), transaction] } });
      setAddType(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    deletePendingRef.current = true;
    try {
      const entryKey = deleteTarget.type === "income" ? "incomes" : "expenses";
      const budgetEntries = (budget[entryKey] ?? []) as (BudgetIncome | BudgetExpense)[];
      await onUpdate({ ...session, budget: { ...budget, [entryKey]: budgetEntries.filter((budgetEntry) => budgetEntry.id !== deleteTarget.entry.id) } });
      setDeleteTarget(null);
    } finally {
      deletePendingRef.current = false;
    }
  };


  return (
    <div className="space-y-5">
      <section aria-label={t("sessions.budget.summaryAriaLabel")} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: t("sessions.budget.totalIncome"), value: totalIncome, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
          { label: t("sessions.budget.totalExpenses"), value: totalExpenses, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
          { label: t("sessions.budget.netBalance"), value: balance, icon: DollarSign, color: balance >= 0 ? "text-success" : "text-destructive", bg: balance >= 0 ? "bg-success/10" : "bg-destructive/10" },
        ].map((stat) => (
          <article key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`} aria-hidden="true">
              <stat.icon className={`w-4 h-4 ${stat.color}`} style={{ color: stat.color.includes("success") ? "hsl(var(--success))" : "hsl(var(--destructive))" }} />
            </div>
            <p className={`text-base font-bold ${stat.color} m-0`}>{formatMoney(stat.value, session.currency)}</p>
            <p className="text-xs text-muted-foreground mt-0.5 m-0">{stat.label}</p>
          </article>
        ))}
      </section>

      <section aria-labelledby="income-heading">
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" aria-hidden="true" />
            <h3 id="income-heading" className="text-sm font-bold text-foreground m-0">{t("sessions.budget.income")}</h3>
          </div>
          {canWrite && <Button
            onClick={() => setAddType("income")}
            className="flex items-center gap-1 min-h-11 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-semibold hover:bg-success/15 border border-success/20 transition-colors hover:text-success"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("sessions.budget.addIncome")}
          </Button>}
        </header>
        <div className="rounded-xl border border-border overflow-hidden">
          {(!budget.incomes || budget.incomes.length === 0) ? (
            <p className="py-6 text-center text-sm text-muted-foreground m-0">{t("sessions.budget.emptyIncome")}</p>
          ) : (
            budget.incomes.map((incomeEntry: BudgetIncome, index: number) => (
              <article key={incomeEntry.id} className={`flex items-center gap-3 px-4 py-3 ${index > 0 ? "border-t border-border/50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground m-0">{incomeEntry.category}</p>
                  {incomeEntry.note && <p className="text-xs text-muted-foreground truncate m-0">{incomeEntry.note}</p>}
                </div>
                 <p className="text-sm text-muted-foreground flex-shrink-0 m-0">{formatDate(incomeEntry.date)}</p>
                 <p className="text-sm font-bold text-success flex-shrink-0 m-0">{formatMoney(incomeEntry.amount, session.currency)}</p>
                {canWrite && <Button aria-label={t("sessions.budget.deleteIncomeNamed", { name: incomeEntry.category })} onClick={() => setDeleteTarget({ type: "income", entry: incomeEntry })} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0" variant="ghost" size="icon">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>}
              </article>
            ))
          )}
        </div>
      </section>

      <section aria-labelledby="expense-heading">
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-destructive" aria-hidden="true" />
            <h3 id="expense-heading" className="text-sm font-bold text-foreground m-0">{t("sessions.budget.expenses")}</h3>
          </div>
          {canWrite && <Button
            onClick={() => setAddType("expense")}
            className="flex items-center gap-1 min-h-11 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/15 border border-destructive/20 transition-colors hover:text-destructive"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("sessions.budget.addExpense")}
          </Button>}
        </header>
        <div className="rounded-xl border border-border overflow-hidden">
          {(!budget.expenses || budget.expenses.length === 0) ? (
            <p className="py-6 text-center text-sm text-muted-foreground m-0">{t("sessions.budget.emptyExpenses")}</p>
          ) : (
            budget.expenses.map((expenseEntry: BudgetExpense, index: number) => (
              <article key={expenseEntry.id} className={`flex items-center gap-3 px-4 py-3 ${index > 0 ? "border-t border-border/50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground m-0">{expenseEntry.category}</p>
                  {expenseEntry.note && <p className="text-xs text-muted-foreground truncate m-0">{expenseEntry.note}</p>}
                </div>
                 <p className="text-sm text-muted-foreground flex-shrink-0 m-0">{formatDate(expenseEntry.date)}</p>
                 <p className="text-sm font-bold text-destructive flex-shrink-0 m-0">{formatMoney(expenseEntry.amount, session.currency)}</p>
                {canWrite && <Button aria-label={t("sessions.budget.deleteExpenseNamed", { name: expenseEntry.category })} onClick={() => setDeleteTarget({ type: "expense", entry: expenseEntry })} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0" variant="ghost" size="icon">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>}
              </article>
            ))
          )}
        </div>
      </section>

      <TransactionModal
        open={addType !== null}
        type={addType ?? "income"}
        currency={session.currency || activeCurrency.code}
        onClose={() => { if (!saving) setAddType(null); }}
        onSave={(transaction) => handleAdd(addType!, transaction)}
        saving={saving}
      />
      <ConfirmAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open && !deletePendingRef.current) setDeleteTarget(null); }}
        title={t("sessions.budget.confirmDeleteTitle")}
        description={t("sessions.budget.confirmDeleteDescription", { name: deleteTarget?.entry.category ?? "" })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => { void handleDelete(); }}
      />
    </div>
  );
}
