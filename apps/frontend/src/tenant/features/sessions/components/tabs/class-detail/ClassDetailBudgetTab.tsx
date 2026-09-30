import React from 'react';
import { Wallet, Coffee, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { useTranslation } from '@/hooks/useTranslation';
import type {
  SessionClassBudget,
  SessionClassRefreshment,
} from '@/lib/data/sessionsData';
import { ClassDetailRefreshmentItem } from './ClassDetailRefreshmentItem';

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
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Class Budget Items */}
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-success" />
            <h4 className="text-sm font-semibold text-foreground">{t('sessions.classes.detail.budget.title')}</h4>
          </div>
          <Button size="sm" variant="outline" onClick={onAddBudget} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> {t('sessions.classes.detail.budget.add')}
          </Button>
        </div>

        {budgets.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2 text-center">
            {t('sessions.classes.detail.budget.empty')}
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
                    { value: 'income', label: t('sessions.classes.detail.budget.income') },
                    { value: 'expense', label: t('sessions.classes.detail.budget.expense') },
                  ]}
                  className="w-28 text-xs"
                />
                <Input
                  id={`budget-detail-${b.id}`}
                  name={`budget-detail-${b.id}`}
                  placeholder={t('sessions.classes.detail.budget.detailPlaceholder')}
                  value={b.detail}
                  onChange={(e) => onUpdateBudget(b.id, { detail: e.target.value })}
                  className="flex-1 text-xs"
                />
                <div className="relative w-32">
                  <Input
                    id={`budget-amount-${b.id}`}
                    name={`budget-amount-${b.id}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={b.amount === 0 ? '' : String(b.amount)}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*(\.\d{0,2})?$/.test(val)) {
                        onUpdateBudget(b.id, { amount: parseFloat(val) || 0 });
                      }
                    }}
                    className="text-xs"
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t('sessions.classes.detail.removeItem')}
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
            <Coffee className="h-4 w-4 text-warning" />
            <h4 className="text-sm font-semibold text-foreground">{t('sessions.classes.detail.refreshments.title')}</h4>
          </div>
          <Button size="sm" variant="outline" onClick={onAddRefreshment} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> {t('sessions.classes.detail.refreshments.add')}
          </Button>
        </div>

        {refreshments.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2 text-center">
            {t('sessions.classes.detail.refreshments.empty')}
          </p>
        ) : (
          <div className="space-y-2">
            {refreshments.map((r) => (
              <ClassDetailRefreshmentItem
                key={r.id}
                refreshment={r}
                onUpdate={onUpdateRefreshment}
                onRemove={onRemoveRefreshment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

