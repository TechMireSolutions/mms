import React, { useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Session, BudgetIncome, BudgetExpense } from '@/lib/data/sessionsData';
import { formatMoney, formatDate } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { BudgetTransactionModal, type TransactionEntry } from "./BudgetTransactionModal";

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
          <article key={stat.label} className={`${WORK_SURFACE_INNER} p-4`}>
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`} aria-hidden="true">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-base font-bold ${stat.color} m-0`}>{formatMoney(stat.value, session.currency)}</p>
            <p className="text-xs text-muted-foreground mt-0.5 m-0">{stat.label}</p>
          </article>
        ))}
      </section>

      <section aria-labelledby="income-heading">
        <SectionHeader
          headingLevel={3}
          headingId="income-heading"
          icon={<TrendingUp className="w-4 h-4 text-success" aria-hidden="true" />}
          iconClassName="bg-success/10"
          title={t("sessions.budget.income")}
          actions={
            canWrite && (
              <Button
                onClick={() => setAddType("income")}
                className="flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success/15 hover:text-success sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("sessions.budget.addIncome")}
              </Button>
            )
          }
        />
        <div className="rounded-xl border border-border overflow-hidden">
          {(!budget.incomes || budget.incomes.length === 0) ? (
            <EmptyState title={t("sessions.budget.emptyIncome")} compact icon={null} />
          ) : (
            budget.incomes.map((incomeEntry: BudgetIncome, index: number) => (
              <article key={incomeEntry.id} className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 ${index > 0 ? "border-t border-border/50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm font-medium text-foreground">{incomeEntry.category}</p>
                  {incomeEntry.note && <p className="m-0 truncate text-xs text-muted-foreground">{incomeEntry.note}</p>}
                </div>
                 <div className="flex items-center justify-between gap-3 sm:contents">
                   <p className="m-0 shrink-0 text-sm text-muted-foreground">{formatDate(incomeEntry.date)}</p>
                   <p className="m-0 shrink-0 text-sm font-bold text-success">{formatMoney(incomeEntry.amount, session.currency)}</p>
                   {canWrite && <Button aria-label={t("sessions.budget.deleteIncomeNamed", { name: incomeEntry.category })} onClick={() => setDeleteTarget({ type: "income", entry: incomeEntry })} className="shrink-0 text-muted-foreground transition-colors hover:text-destructive" variant="ghost" size="icon">
                     <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                   </Button>}
                 </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section aria-labelledby="expense-heading">
        <SectionHeader
          headingLevel={3}
          headingId="expense-heading"
          icon={<TrendingDown className="w-4 h-4 text-destructive" aria-hidden="true" />}
          iconClassName="bg-destructive/10"
          title={t("sessions.budget.expenses")}
          actions={
            canWrite && (
              <Button
                onClick={() => setAddType("expense")}
                className="flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15 hover:text-destructive sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("sessions.budget.addExpense")}
              </Button>
            )
          }
        />
        <div className="rounded-xl border border-border overflow-hidden">
          {(!budget.expenses || budget.expenses.length === 0) ? (
            <EmptyState title={t("sessions.budget.emptyExpenses")} compact icon={null} />
          ) : (
            budget.expenses.map((expenseEntry: BudgetExpense, index: number) => (
              <article key={expenseEntry.id} className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 ${index > 0 ? "border-t border-border/50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm font-medium text-foreground">{expenseEntry.category}</p>
                  {expenseEntry.note && <p className="m-0 truncate text-xs text-muted-foreground">{expenseEntry.note}</p>}
                </div>
                 <div className="flex items-center justify-between gap-3 sm:contents">
                   <p className="m-0 shrink-0 text-sm text-muted-foreground">{formatDate(expenseEntry.date)}</p>
                   <p className="m-0 shrink-0 text-sm font-bold text-destructive">{formatMoney(expenseEntry.amount, session.currency)}</p>
                   {canWrite && <Button aria-label={t("sessions.budget.deleteExpenseNamed", { name: expenseEntry.category })} onClick={() => setDeleteTarget({ type: "expense", entry: expenseEntry })} className="shrink-0 text-muted-foreground transition-colors hover:text-destructive" variant="ghost" size="icon">
                     <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                   </Button>}
                 </div>
              </article>
            ))
          )}
        </div>
      </section>

      <BudgetTransactionModal
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
