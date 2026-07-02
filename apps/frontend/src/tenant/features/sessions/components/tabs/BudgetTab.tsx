import React, { useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Session, BudgetIncome, BudgetExpense } from '@/lib/data/sessionsData';
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";

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
  onClose: () => void;
  onSave: (tx: TransactionEntry) => void;
}

function TransactionModal({ open, type, onClose, onSave }: TransactionModalProps) {
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [transactionDraft, setTransactionDraft] = useState({ category: categories[0], amount: "", date: new Date().toISOString().split("T")[0], note: "" });
  const updateTransactionDraft = (field: keyof typeof transactionDraft, value: string) => setTransactionDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  React.useEffect(() => {
    if (open) {
      const categoryOptions = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      setTransactionDraft({ category: categoryOptions[0], amount: "", date: new Date().toISOString().split("T")[0], note: "" });
    }
  }, [open, type]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={type === "income" ? "Add Income" : "Add Expense"}
      icon={type === "income" ? TrendingUp : TrendingDown}
      cancelLabel="Cancel"
      saveLabel="Add"
      onSave={() => onSave({ ...transactionDraft, amount: +transactionDraft.amount, id: `tx${Date.now()}` })}
      saveDisabled={!transactionDraft.amount}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="tx-category">Category</label>
          <FormSelect
            id="tx-category"
            value={transactionDraft.category}
            onChange={(value) => updateTransactionDraft("category", value)}
            options={categories}
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="tx-amount">Amount (PKR) *</label>
            <Input id="tx-amount" type="number" value={transactionDraft.amount} onChange={(event) => updateTransactionDraft("amount", event.target.value)} placeholder="0" min={0} required />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="tx-date">Date</label>
            <DatePicker
              id="tx-date"
              value={transactionDraft.date}
              onChange={(value) => updateTransactionDraft("date", value)}
              required
            />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="tx-note">Note</label>
          <Input id="tx-note" value={transactionDraft.note} onChange={(event) => updateTransactionDraft("note", event.target.value)} placeholder="Optional note…" />
        </div>
      </div>
    </FormModal>
  );
}

interface BudgetTabProps {
  session: Session;
  onUpdate: (session: Session) => void;
}

/**
 * BudgetTab Component
 * 
 * Manages the income and expenses associated with a session.
 * 
 * @param {BudgetTabProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function BudgetTab({ session, onUpdate }: BudgetTabProps) {
  const [addType, setAddType] = useState<"income" | "expense" | null>(null);
  const budget = session.budget || { totalRevenue: 0, collected: 0, expenses: [], incomes: [] };

  const totalIncome = budget.incomes?.reduce((sum, incomeEntry) => sum + incomeEntry.amount, 0) || 0;
  const totalExpenses = budget.expenses?.reduce((sum, expenseEntry) => sum + expenseEntry.amount, 0) || 0;
  const balance = totalIncome - totalExpenses;

  const handleAdd = (type: "income" | "expense", transaction: TransactionEntry) => {
    const entryKey = type === "income" ? "incomes" : "expenses";
    onUpdate({ ...session, budget: { ...budget, [entryKey]: [...(budget[entryKey] || []), transaction] } });
    setAddType(null);
  };

  const handleDelete = (type: "income" | "expense", id: string) => {
    const entryKey = type === "income" ? "incomes" : "expenses";
    const budgetEntries = (budget[entryKey] ?? []) as (BudgetIncome | BudgetExpense)[];
    onUpdate({ ...session, budget: { ...budget, [entryKey]: budgetEntries.filter((budgetEntry) => budgetEntry.id !== id) } });
  };

  const formatMoney = (amount: number) => `PKR ${amount.toLocaleString()}`;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <section aria-label="Budget Summary" className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Income", value: totalIncome, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
          { label: "Total Expenses", value: totalExpenses, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Net Balance", value: balance, icon: DollarSign, color: balance >= 0 ? "text-success" : "text-destructive", bg: balance >= 0 ? "bg-success/10" : "bg-destructive/10" },
        ].map((stat) => (
          <article key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`} aria-hidden="true">
              <stat.icon className={`w-4 h-4 ${stat.color}`} style={{ color: stat.color.includes("success") ? "hsl(var(--success))" : "hsl(var(--destructive))" }} />
            </div>
            <p className={`text-[16px] font-bold ${stat.color} m-0`}>{formatMoney(stat.value)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 m-0">{stat.label}</p>
          </article>
        ))}
      </section>

      {/* Income section */}
      <section aria-labelledby="income-heading">
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" aria-hidden="true" />
            <h3 id="income-heading" className="text-sm font-bold text-foreground m-0">Income</h3>
          </div>
          <Button
            onClick={() => setAddType("income")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-semibold hover:bg-success/15 border border-success/20 transition-colors h-auto hover:text-success"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Income
          </Button>
        </header>
        <div className="rounded-xl border border-border overflow-hidden">
          {(!budget.incomes || budget.incomes.length === 0) ? (
            <p className="py-6 text-center text-sm text-muted-foreground m-0">No income entries yet</p>
          ) : (
            budget.incomes.map((incomeEntry: BudgetIncome, index: number) => (
              <article key={incomeEntry.id} className={`flex items-center gap-3 px-4 py-3 ${index > 0 ? "border-t border-border/50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground m-0">{incomeEntry.category}</p>
                  {incomeEntry.note && <p className="text-[11px] text-muted-foreground truncate m-0">{incomeEntry.note}</p>}
                </div>
                <p className="text-[12px] text-muted-foreground flex-shrink-0 m-0">{incomeEntry.date}</p>
                <p className="text-[13px] font-bold text-success flex-shrink-0 m-0">{formatMoney(incomeEntry.amount)}</p>
                <Button aria-label={`Delete income ${incomeEntry.category}`} onClick={() => handleDelete("income", incomeEntry.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 w-7 h-7" variant="ghost" size="icon">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Expense section */}
      <section aria-labelledby="expense-heading">
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-destructive" aria-hidden="true" />
            <h3 id="expense-heading" className="text-sm font-bold text-foreground m-0">Expenses</h3>
          </div>
          <Button
            onClick={() => setAddType("expense")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/15 border border-destructive/20 transition-colors h-auto hover:text-destructive"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Expense
          </Button>
        </header>
        <div className="rounded-xl border border-border overflow-hidden">
          {(!budget.expenses || budget.expenses.length === 0) ? (
            <p className="py-6 text-center text-sm text-muted-foreground m-0">No expense entries yet</p>
          ) : (
            budget.expenses.map((expenseEntry: BudgetExpense, index: number) => (
              <article key={expenseEntry.id} className={`flex items-center gap-3 px-4 py-3 ${index > 0 ? "border-t border-border/50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground m-0">{expenseEntry.category}</p>
                  {expenseEntry.note && <p className="text-[11px] text-muted-foreground truncate m-0">{expenseEntry.note}</p>}
                </div>
                <p className="text-[12px] text-muted-foreground flex-shrink-0 m-0">{expenseEntry.date}</p>
                <p className="text-[13px] font-bold text-destructive flex-shrink-0 m-0">{formatMoney(expenseEntry.amount)}</p>
                <Button aria-label={`Delete expense ${expenseEntry.category}`} onClick={() => handleDelete("expense", expenseEntry.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 w-7 h-7" variant="ghost" size="icon">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
              </article>
            ))
          )}
        </div>
      </section>

      <TransactionModal
        open={addType !== null}
        type={addType ?? "income"}
        onClose={() => setAddType(null)}
        onSave={(transaction) => handleAdd(addType!, transaction)}
      />
    </div>
  );
}
