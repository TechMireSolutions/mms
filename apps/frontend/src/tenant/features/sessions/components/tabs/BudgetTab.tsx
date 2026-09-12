import React, { useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { type Session, type SessionClassBudget } from '@/lib/data/sessionsData';
import { formatMoney } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WORK_SURFACE_INNER, FORM_LABEL } from "@/components/ui/formStyles";
import { FormModal } from "@/components/ui/FormModal";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";

interface BudgetTabProps {
  session: Session;
  onUpdate: (session: Session) => void | Promise<void>;
  canMutate?: boolean;
  canWrite?: boolean;
}

export function BudgetTab({ session, onUpdate, canWrite = true, canMutate }: BudgetTabProps) {
  const { t } = useTranslation();
  const { activeCurrency } = useFinanceCurrency();
  const currencyLabel = activeCurrency?.symbol || session.currency || '';
  const isWritable = canMutate ?? canWrite;
  const [modalOpen, setModalOpen] = useState(false);
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [budgetType, setBudgetType] = useState<'income' | 'expense'>('income');
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [deleteTarget, setDeleteTarget] = useState<{ classId: string; budgetId: string; detail: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const classes = session.classes || [];

  // Aggregate all budgets across classes
  const allBudgetItems = classes.flatMap((c) =>
    (c.budgets || []).map((b) => ({ ...b, className: c.name, classId: c.id })),
  );

  const incomes = allBudgetItems.filter((b) => b.budgetType === 'income');
  const expenses = allBudgetItems.filter((b) => b.budgetType === 'expense');

  const totalIncome = incomes.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, b) => sum + (b.amount || 0), 0);
  const balance = totalIncome - totalExpenses;

  const handleOpenAdd = (type: 'income' | 'expense') => {
    setBudgetType(type);
    setTargetClassId(classes[0]?.id || '');
    setDetail('');
    setAmount(0);
    setModalOpen(true);
  };

  const handleSaveItem = async () => {
    if (!targetClassId || !detail.trim()) return;
    setSaving(true);
    try {
      const updatedClasses = classes.map((c) => {
        if (c.id === targetClassId) {
          const newBudget: SessionClassBudget = {
            id: crypto.randomUUID(),
            classId: c.id,
            budgetType,
            detail: detail.trim(),
            amount: Number(amount) || 0,
          };
          return {
            ...c,
            budgets: [...(c.budgets || []), newBudget],
          };
        }
        return c;
      });

      await onUpdate({ ...session, classes: updatedClasses });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const updatedClasses = classes.map((c) => {
        if (c.id === deleteTarget.classId) {
          return {
            ...c,
            budgets: (c.budgets || []).filter((b) => b.id !== deleteTarget.budgetId),
          };
        }
        return c;
      });
      await onUpdate({ ...session, classes: updatedClasses });
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <section aria-label="Budget summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Total Budgeted Income", value: totalIncome, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
          { label: "Total Budgeted Expenses", value: totalExpenses, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Net Margin / Balance", value: balance, icon: Wallet, color: balance >= 0 ? "text-success" : "text-destructive", bg: balance >= 0 ? "bg-success/10" : "bg-destructive/10" },
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

      {/* Incomes Section */}
      <section aria-labelledby="income-heading">
        <SectionHeader
          headingLevel={3}
          headingId="income-heading"
          icon={<TrendingUp className="w-4 h-4 text-success" aria-hidden="true" />}
          iconClassName="bg-success/10"
          title="Class Incomes"
          actions={
            isWritable && classes.length > 0 && (
              <Button
                onClick={() => handleOpenAdd("income")}
                className="flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success/15 hover:text-success sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Income
              </Button>
            )
          }
        />
        <div className="rounded-xl border border-border overflow-hidden">
          {incomes.length === 0 ? (
            <EmptyState title="No budgeted income logged yet" compact icon={null} />
          ) : (
            incomes.map((item, index) => (
              <article key={item.id} className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 ${index > 0 ? "border-t border-border/50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm font-medium text-foreground">{item.detail}</p>
                  <p className="m-0 truncate text-xs text-muted-foreground">Class: {item.className}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:contents">
                  <p className="m-0 shrink-0 text-sm font-bold text-success">{formatMoney(item.amount, session.currency)}</p>
                  {isWritable && (
                    <Button
                      aria-label={`Delete ${item.detail}`}
                      onClick={() => setDeleteTarget({ classId: item.classId, budgetId: item.id, detail: item.detail })}
                      className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                      variant="ghost"
                      size="icon"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Expenses Section */}
      <section aria-labelledby="expense-heading">
        <SectionHeader
          headingLevel={3}
          headingId="expense-heading"
          icon={<TrendingDown className="w-4 h-4 text-destructive" aria-hidden="true" />}
          iconClassName="bg-destructive/10"
          title="Class Expenses"
          actions={
            isWritable && classes.length > 0 && (
              <Button
                onClick={() => handleOpenAdd("expense")}
                className="flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15 hover:text-destructive sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Expense
              </Button>
            )
          }
        />
        <div className="rounded-xl border border-border overflow-hidden">
          {expenses.length === 0 ? (
            <EmptyState title="No budgeted expenses logged yet" compact icon={null} />
          ) : (
            expenses.map((item, index) => (
              <article key={item.id} className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 ${index > 0 ? "border-t border-border/50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm font-medium text-foreground">{item.detail}</p>
                  <p className="m-0 truncate text-xs text-muted-foreground">Class: {item.className}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:contents">
                  <p className="m-0 shrink-0 text-sm font-bold text-destructive">{formatMoney(item.amount, session.currency)}</p>
                  {isWritable && (
                    <Button
                      aria-label={`Delete ${item.detail}`}
                      onClick={() => setDeleteTarget({ classId: item.classId, budgetId: item.id, detail: item.detail })}
                      className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                      variant="ghost"
                      size="icon"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Add Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={budgetType === 'income' ? 'Add Budgeted Income' : 'Add Budgeted Expense'}
        icon={Wallet}
        cancelLabel="Cancel"
        saveLabel="Save"
        onSave={handleSaveItem}
        saving={saving}
      >
        <div className="space-y-4">
          <div>
            <label className={FORM_LABEL} htmlFor="target-class">Target Class</label>
            <FormSelect
              id="target-class"
              name="targetClassId"
              value={targetClassId}
              onChange={(val) => setTargetClassId(val)}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
              className="w-full"
            />
          </div>

          <div>
            <label className={FORM_LABEL} htmlFor="budget-detail">Detail / Description</label>
            <Input
              id="budget-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="e.g. Books sale, Classroom renovation, Stationary"
            />
          </div>

          <div>
            <label className={FORM_LABEL} htmlFor="budget-amount">Amount{currencyLabel ? ` (${currencyLabel})` : ''}</label>
            <Input
              id="budget-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </FormModal>

      <ConfirmAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Confirm Delete"
        description={`Are you sure you want to delete "${deleteTarget?.detail}"?`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { void handleDeleteItem(); }}
      />
    </div>
  );
}
