import React from 'react';
import { Wallet, Coffee, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { cn } from '@/lib/utils';
import type {
  SessionClassBudget,
  SessionClassRefreshment,
} from '@/lib/data/sessionsData';

interface ClassDetailBudgetTabProps {
  budgets: SessionClassBudget[];
  refreshments: SessionClassRefreshment[];
  currencySymbol: string;
  onAddBudget: () => void;
  onRemoveBudget: (id: string) => void;
  onUpdateBudget: (id: string, patch: Partial<SessionClassBudget>) => void;
  onAddRefreshment: () => void;
  onRemoveRefreshment: (id: string) => void;
  onUpdateRefreshment: (id: string, patch: Partial<SessionClassRefreshment>) => void;
}

export function ClassDetailBudgetTab({
  budgets,
  refreshments,
  currencySymbol,
  onAddBudget,
  onRemoveBudget,
  onUpdateBudget,
  onAddRefreshment,
  onRemoveRefreshment,
  onUpdateRefreshment,
}: ClassDetailBudgetTabProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Class Budget Items */}
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-600" />
            <h4 className="text-sm font-semibold text-foreground">Class Income & Expense Budget</h4>
          </div>
          <Button size="sm" variant="outline" onClick={onAddBudget} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Budget Item
          </Button>
        </div>

        {budgets.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2 text-center">
            No budget items logged. Track income or expenses directly allocated to this class.
          </p>
        ) : (
          <div className="space-y-2">
            {budgets.map((b) => (
              <div key={b.id} className="flex items-center gap-2">
                <FormSelect
                  id={`budget-type-${b.id}`}
                  name="budgetType"
                  value={b.budgetType}
                  onChange={(val) => onUpdateBudget(b.id, { budgetType: val as 'income' | 'expense' })}
                  options={[
                    { value: 'income', label: '+ Income' },
                    { value: 'expense', label: '- Expense' },
                  ]}
                  className="w-28 text-xs"
                />
                <Input
                  placeholder="Detail / Purpose"
                  value={b.detail}
                  onChange={(e) => onUpdateBudget(b.id, { detail: e.target.value })}
                  className="flex-1 text-xs"
                />
                <div className="relative w-32">
                  {currencySymbol && (
                    <span className="absolute start-2.5 top-2 text-xs text-muted-foreground">{currencySymbol}</span>
                  )}
                  <Input
                    type="number"
                    min={0}
                    value={b.amount ?? 0}
                    onChange={(e) => onUpdateBudget(b.id, { amount: parseFloat(e.target.value) || 0 })}
                    className={cn('text-xs', currencySymbol && 'ps-6')}
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveBudget(b.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refreshments */}
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-amber-600" />
            <h4 className="text-sm font-semibold text-foreground">Class Refreshments & Tabarruk</h4>
          </div>
          <Button size="sm" variant="outline" onClick={onAddRefreshment} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Refreshment
          </Button>
        </div>

        {refreshments.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2 text-center">
            No refreshment logs for this class.
          </p>
        ) : (
          <div className="space-y-2">
            {refreshments.map((r) => (
              <div key={r.id} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <Input
                  type="date"
                  value={r.date.slice(0, 10)}
                  onChange={(e) => onUpdateRefreshment(r.id, { date: e.target.value })}
                  className="w-32 text-xs"
                />
                <Input
                  placeholder="Item (e.g. Juice, Biscuits)"
                  value={r.item}
                  onChange={(e) => onUpdateRefreshment(r.id, { item: e.target.value })}
                  className="flex-1 text-xs"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  min={0}
                  value={r.quantity ?? 0}
                  onChange={(e) => onUpdateRefreshment(r.id, { quantity: parseInt(e.target.value, 10) || 0 })}
                  className="w-16 text-xs"
                />
                <div className="relative w-24">
                  {currencySymbol && (
                    <span className="absolute start-2.5 top-2 text-xs text-muted-foreground">{currencySymbol}</span>
                  )}
                  <Input
                    type="number"
                    placeholder="Price"
                    min={0}
                    value={r.pricePerUnit ?? 0}
                    onChange={(e) => onUpdateRefreshment(r.id, { pricePerUnit: parseFloat(e.target.value) || 0 })}
                    className={cn('text-xs', currencySymbol && 'ps-6')}
                  />
                </div>
                <div className="relative w-24">
                  {currencySymbol && (
                    <span className="absolute start-2.5 top-2 text-xs text-muted-foreground">{currencySymbol}</span>
                  )}
                  <Input
                    type="number"
                    placeholder="Paid"
                    min={0}
                    value={r.paidAmount ?? 0}
                    onChange={(e) => onUpdateRefreshment(r.id, { paidAmount: parseFloat(e.target.value) || 0 })}
                    className={cn('text-xs', currencySymbol && 'ps-6')}
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveRefreshment(r.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
