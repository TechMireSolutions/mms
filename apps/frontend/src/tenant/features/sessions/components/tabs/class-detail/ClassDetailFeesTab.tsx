import React from 'react';
import { Wallet, Tag, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
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
  return (
    <div className="space-y-6">
      {/* Fee Schedule */}
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Class Fee Schedule</h4>
          </div>
          <Button size="sm" variant="outline" onClick={onAddFee} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Fee Item
          </Button>
        </div>

        {fees.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2 text-center">
            No individual fees specified. Click "Add Fee Item" to define Tuition, Admission, Exam fees, etc.
          </p>
        ) : (
          <div className="space-y-2">
            {fees.map((fee) => (
              <div key={fee.id} className="flex items-center gap-2">
                <Input
                  placeholder="Fee Type (e.g. Admission, Tuition)"
                  value={fee.feeType}
                  onChange={(e) => onUpdateFee(fee.id, { feeType: e.target.value })}
                  className="flex-1 text-xs"
                />
                <div className="relative w-36">
                  {currencySymbol && (
                    <span className="absolute start-2.5 top-2 text-xs text-muted-foreground">{currencySymbol}</span>
                  )}
                  <Input
                    type="number"
                    min={0}
                    placeholder="Amount"
                    value={fee.amount ?? 0}
                    onChange={(e) => onUpdateFee(fee.id, { amount: parseFloat(e.target.value) || 0 })}
                    className={cn('text-xs', currencySymbol && 'ps-6')}
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
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
            <Tag className="h-4 w-4 text-emerald-600" />
            <h4 className="text-sm font-semibold text-foreground">Class Discounts & Waivers</h4>
          </div>
          <Button size="sm" variant="outline" onClick={onAddDiscount} className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Discount
          </Button>
        </div>

        {discounts.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2 text-center">
            No discounts defined for this class.
          </p>
        ) : (
          <div className="space-y-2">
            {discounts.map((discount) => (
              <div key={discount.id} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <Input
                  placeholder="Discount Name (e.g. Sibling 15%)"
                  value={discount.discountType}
                  onChange={(e) => onUpdateDiscount(discount.id, { discountType: e.target.value })}
                  className="flex-1 text-xs"
                />
                <div className="relative w-24">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={discount.percentage ?? 0}
                    onChange={(e) => onUpdateDiscount(discount.id, { percentage: parseFloat(e.target.value) || 0 })}
                    className="text-xs pe-6"
                  />
                  <span className="absolute end-2.5 top-2 text-xs text-muted-foreground">%</span>
                </div>
                <div className="w-28">
                  <FormSelect
                    id={`disc-status-${discount.id}`}
                    name="status"
                    value={discount.status || 'active'}
                    onChange={(val) =>
                      onUpdateDiscount(discount.id, {
                        status: val as 'active' | 'expired' | 'inactive',
                      })
                    }
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'expired', label: 'Expired' },
                      { value: 'inactive', label: 'Inactive' },
                    ]}
                    className="text-xs"
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
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
