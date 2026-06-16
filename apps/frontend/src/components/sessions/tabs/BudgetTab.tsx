import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, X, Save } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Session, BudgetIncome, BudgetExpense } from '@/lib/data/sessionsData';
import { DatePicker } from "../../ui/DatePicker";

const INPUT = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

/** A single income or expense transaction entry. */
interface TransactionEntry {
  id: string;
  category: string;
  amount: number;
  date: string;
  note: string;
}

interface TransactionModalProps {
  type: "income" | "expense";
  onClose: () => void;
  onSave: (tx: TransactionEntry) => void;
}

function TransactionModal({ type, onClose, onSave }: TransactionModalProps) {
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [data, setData] = useState({ category: categories[0], amount: "", date: new Date().toISOString().split("T")[0], note: "" });
  const upd = (f: keyof typeof data, v: string) => setData((d) => ({ ...d, [f]: v }));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="tx-modal-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.form 
        onSubmit={(e) => { e.preventDefault(); onSave({ ...data, amount: +data.amount, id: `tx${Date.now()}` }); }}
        initial={{ opacity: 0, scale: 0.96 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm z-10"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 id="tx-modal-title" className="text-sm font-bold text-foreground m-0">Add {type === "income" ? "Income" : "Expense"}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </header>
        <fieldset className="px-5 py-4 space-y-4 border-none m-0">
          <div>
            <label className={LABEL} htmlFor="tx-category">Category</label>
            <select id="tx-category" className={INPUT + " cursor-pointer"} value={data.category} onChange={(e) => upd("category", e.target.value)}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} htmlFor="tx-amount">Amount (PKR) *</label>
              <input id="tx-amount" type="number" className={INPUT} value={data.amount} onChange={(e) => upd("amount", e.target.value)} placeholder="0" min={0} required />
            </div>
            <div>
              <label className={LABEL} htmlFor="tx-date">Date</label>
              <DatePicker
                id="tx-date"
                value={data.date}
                onChange={(val) => upd("date", val)}
                required
              />
            </div>
          </div>
          <div>
            <label className={LABEL} htmlFor="tx-note">Note</label>
            <input id="tx-note" className={INPUT} value={data.note} onChange={(e) => upd("note", e.target.value)} placeholder="Optional note…" />
          </div>
        </fieldset>
        <footer className="px-5 py-4 border-t border-border flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button
            type="submit"
            disabled={!data.amount}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" /> Add
          </button>
        </footer>
      </motion.form>
    </div>
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
export default function BudgetTab({ session, onUpdate }: BudgetTabProps) {
  const [addType, setAddType] = useState<"income" | "expense" | null>(null);
  const budget = session.budget || { totalRevenue: 0, collected: 0, expenses: [], incomes: [] };

  const totalIncome = budget.incomes?.reduce((s, i) => s + i.amount, 0) || 0;
  const totalExpenses = budget.expenses?.reduce((s, e) => s + e.amount, 0) || 0;
  const balance = totalIncome - totalExpenses;

  const handleAdd = (type: "income" | "expense", tx: TransactionEntry) => {
    const key = type === "income" ? "incomes" : "expenses";
    onUpdate({ ...session, budget: { ...budget, [key]: [...(budget[key] || []), tx] } });
    setAddType(null);
  };

  const handleDelete = (type: "income" | "expense", id: string) => {
    const key = type === "income" ? "incomes" : "expenses";
    const entries = (budget[key] ?? []) as (BudgetIncome | BudgetExpense)[];
    onUpdate({ ...session, budget: { ...budget, [key]: entries.filter((x) => x.id !== id) } });
  };

  const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <section aria-label="Budget Summary" className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Income", value: totalIncome, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Expenses", value: totalExpenses, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
          { label: "Net Balance", value: balance, icon: DollarSign, color: balance >= 0 ? "text-emerald-600" : "text-red-600", bg: balance >= 0 ? "bg-emerald-50" : "bg-red-50" },
        ].map((stat) => (
          <article key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`} aria-hidden="true">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-[16px] font-bold ${stat.color} m-0`}>{fmt(stat.value)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 m-0">{stat.label}</p>
          </article>
        ))}
      </section>

      {/* Income section */}
      <section aria-labelledby="income-heading">
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <h3 id="income-heading" className="text-sm font-bold text-foreground m-0">Income</h3>
          </div>
          <button
            onClick={() => setAddType("income")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 border border-emerald-100 transition-colors"
          >
            <Plus className="w-3 h-3" aria-hidden="true" /> Add Income
          </button>
        </header>
        <div className="rounded-xl border border-border overflow-hidden">
          {(!budget.incomes || budget.incomes.length === 0) ? (
            <p className="py-6 text-center text-sm text-muted-foreground m-0">No income entries yet</p>
          ) : (
            budget.incomes.map((inc: BudgetIncome, i: number) => (
              <article key={inc.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border/50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground m-0">{inc.category}</p>
                  {inc.note && <p className="text-[11px] text-muted-foreground truncate m-0">{inc.note}</p>}
                </div>
                <p className="text-[12px] text-muted-foreground flex-shrink-0 m-0">{inc.date}</p>
                <p className="text-[13px] font-bold text-emerald-600 flex-shrink-0 m-0">{fmt(inc.amount)}</p>
                <button aria-label={`Delete income ${inc.category}`} onClick={() => handleDelete("income", inc.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Expense section */}
      <section aria-labelledby="expense-heading">
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-600" aria-hidden="true" />
            <h3 id="expense-heading" className="text-sm font-bold text-foreground m-0">Expenses</h3>
          </div>
          <button
            onClick={() => setAddType("expense")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 border border-red-100 transition-colors"
          >
            <Plus className="w-3 h-3" aria-hidden="true" /> Add Expense
          </button>
        </header>
        <div className="rounded-xl border border-border overflow-hidden">
          {(!budget.expenses || budget.expenses.length === 0) ? (
            <p className="py-6 text-center text-sm text-muted-foreground m-0">No expense entries yet</p>
          ) : (
            budget.expenses.map((exp: BudgetExpense, i: number) => (
              <article key={exp.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border/50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground m-0">{exp.category}</p>
                  {exp.note && <p className="text-[11px] text-muted-foreground truncate m-0">{exp.note}</p>}
                </div>
                <p className="text-[12px] text-muted-foreground flex-shrink-0 m-0">{exp.date}</p>
                <p className="text-[13px] font-bold text-red-600 flex-shrink-0 m-0">{fmt(exp.amount)}</p>
                <button aria-label={`Delete expense ${exp.category}`} onClick={() => handleDelete("expense", exp.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      <AnimatePresence>
        {addType && <TransactionModal type={addType} onClose={() => setAddType(null)} onSave={(tx) => handleAdd(addType, tx)} />}
      </AnimatePresence>
    </div>
  );
}
