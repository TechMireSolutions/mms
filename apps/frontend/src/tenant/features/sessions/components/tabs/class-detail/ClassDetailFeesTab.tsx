import React from 'react';
import { Wallet, Tag, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import type { SessionClassFee, SessionClassDiscount } from '@/lib/data/sessionsData';

interface ClassDetailFeesTabProps {
  fees: SessionClassFee[];
  discounts: SessionClassDiscount[];
  currencySymbol: string;
  onAddFee: () => void;
  onRemoveFee: (id: string) => void;
  onUpdateFee: (id: string, patch: Partial<SessionClassFee>) => void;
  onAddDiscount: () => void;
  onRemoveDiscount: (id: string) => void;
  onUpdateDiscount: (id: string, patch: Partial<SessionClassDiscount>) => void;
}

export function ClassDetailFeesTab({
  fees,
  discounts,
  currencySymbol,
  onAddFee,
  onRemoveFee,
  onUpdateFee,
  onAddDiscount,
  onRemoveDiscount,
  onUpdateDiscount,
}: ClassDetailFeesTabProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Fee Schedule */}
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">{t('sessions.classes.detail.fees.title')}</h4>
          </div>
          <Button size="sm" variant="outline" onClick={onAddFee} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> {t('sessions.classes.detail.fees.add')}
          </Button>
        </div>

        {fees.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2 text-center">
            {t('sessions.classes.detail.fees.empty')}
          </p>
        ) : (
          <div className="space-y-2">
            {fees.map((fee) => (
              <div key={fee.id} className="flex items-center gap-2">
                <Input
                  id={`fee-type-${fee.id}`}
                  name={`fee-type-${fee.id}`}
                  placeholder={t('sessions.classes.detail.fees.typePlaceholder')}
                  aria-label={t('sessions.classes.detail.fees.typePlaceholder')}
                  value={fee.feeType}
                  onChange={(e) => onUpdateFee(fee.id, { feeType: e.target.value })}
                  className="flex-1 text-xs"
                />
                <div className="relative w-36">
                  {currencySymbol && (
                    <span className="absolute start-2.5 top-2 text-xs text-muted-foreground">{currencySymbol}</span>
                  )}
                  <Input
                    id={`fee-amount-${fee.id}`}
                    name={`fee-amount-${fee.id}`}
                    type="text"
                    inputMode="decimal"
                    placeholder={t('sessions.classes.detail.amount')}
                    aria-label={t('sessions.classes.detail.amount')}
                    value={fee.amount === 0 ? '' : String(fee.amount)}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*(\.\d{0,2})?$/.test(val)) {
                        onUpdateFee(fee.id, { amount: parseFloat(val) || 0 });
                      }
                    }}
                    className={cn('text-xs', currencySymbol && 'ps-6')}
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t('sessions.classes.detail.removeItem')}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveFee(fee.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discounts */}
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-success" />
            <h4 className="text-sm font-semibold text-foreground">{t('sessions.classes.detail.discounts.title')}</h4>
          </div>
          <Button size="sm" variant="outline" onClick={onAddDiscount} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> {t('sessions.discounts.add')}
          </Button>
        </div>

        {discounts.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2 text-center">
            {t('sessions.classes.detail.discounts.empty')}
          </p>
        ) : (
          <div className="space-y-2">
            {discounts.map((discount) => (
              <div key={discount.id} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <Input
                  id={`discount-name-${discount.id}`}
                  name={`discount-name-${discount.id}`}
                  placeholder={t('sessions.classes.detail.discounts.namePlaceholder')}
                  aria-label={t('sessions.classes.detail.discounts.namePlaceholder')}
                  value={discount.discountType}
                  onChange={(e) => onUpdateDiscount(discount.id, { discountType: e.target.value })}
                  className="flex-1 text-xs"
                />
                <div className="relative w-24">
                  <Input
                    id={`discount-pct-${discount.id}`}
                    name={`discount-pct-${discount.id}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    aria-label={t('sessions.discounts.type.percentage')}
                    value={discount.percentage === 0 ? '' : String(discount.percentage)}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*(\.\d{0,2})?$/.test(val)) {
                        const num = parseFloat(val) || 0;
                        if (num <= 100) {
                          onUpdateDiscount(discount.id, { percentage: num });
                        }
                      }
                    }}
                    className="text-xs pe-6"
                  />
                  <span className="absolute end-2.5 top-2 text-xs text-muted-foreground">%</span>
                </div>
                <div className="w-28">
                  <FormSelect
                    id={`disc-status-${discount.id}`}
                    name="status"
                    aria-label={t('common.status')}
                    value={discount.status || 'active'}
                    onChange={(val) =>
                      onUpdateDiscount(discount.id, {
                        status: val as 'active' | 'expired' | 'inactive',
                      })
                    }
                    options={[
                      { value: 'active', label: t('sessions.discounts.active') },
                      { value: 'expired', label: t('sessions.classes.detail.discounts.expired') },
                      { value: 'inactive', label: t('sessions.discounts.inactive') },
                    ]}
                    className="text-xs"
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t('sessions.classes.detail.removeItem')}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveDiscount(discount.id)}
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
