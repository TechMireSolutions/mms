import React from "react";
import { DollarSign, Tag, Info } from "lucide-react";
import { calcFee, CalculatedFee } from '@/lib/data/enrollmentData';
import { Student } from '@/lib/data/studentsData';
import { Session } from '@/lib/data/sessionsData';

interface Step5FeeCalculationProps {
  student: Student | null | undefined;
  session: Session | null | undefined;
  feeResult: CalculatedFee | null | undefined;
  onFeeResult: (fee: CalculatedFee) => void;
}

export function Step5FeeCalculation({ student, session, feeResult, onFeeResult }: Step5FeeCalculationProps): React.ReactElement {
  const baseFee = session?.baseFee || 0;

  const fee = React.useMemo<CalculatedFee>(() => {
    return calcFee(baseFee, student || {}, [], session?.discounts || []);
  }, [baseFee, student, session?.discounts]);

  // Notify parent
  React.useEffect(() => {
    onFeeResult(fee);
  }, [student?.id, session?.id, fee, onFeeResult]);

  const displayFee = feeResult || fee;

  return (
    <section className="space-y-5" aria-labelledby="step5-title">
      <div>
        <h3 id="step5-title" className="text-base font-bold text-foreground">Fee Calculation</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Automatically calculated based on session and student profile.</p>
      </div>

      {/* Fee Breakdown */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" aria-hidden="true" />
          <h4 className="text-sm font-bold text-foreground">Fee Breakdown</h4>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Base Fee ({session?.name || "Session"})</span>
            <span className="text-sm font-semibold text-foreground">PKR {baseFee.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">{displayFee.label}</span>
              {displayFee.pct > 0 && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary" aria-label={`Discount percentage: ${displayFee.pct} percent`}>–{displayFee.pct}%</span>
              )}
            </div>
            <span className={`text-sm font-semibold ${displayFee.discountAmt > 0 ? "text-success" : "text-muted-foreground"}`}>
              {displayFee.discountAmt > 0 ? `– PKR ${displayFee.discountAmt.toLocaleString()}` : "PKR 0"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
            <span className="text-sm font-bold text-foreground">Final Amount Due</span>
            <span className="text-lg font-bold text-primary">PKR {displayFee.finalFee.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Discount reason */}
      {displayFee.pct > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-success/10 border border-success/30" role="status">
          <Info className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold text-success">Discount Applied: {displayFee.label} ({displayFee.pct}%)</p>
            {displayFee.reason && <p className="text-xs text-success mt-0.5">{displayFee.reason}</p>}
          </div>
        </div>
      )}

      {displayFee.pct === 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-muted border border-border" role="status">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">No discount applied. Full fee will be invoiced.</p>
        </div>
      )}

      {/* Available discounts */}
      {session?.discounts && session.discounts.filter((discount) => discount.active).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Available Discounts in this Session</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="list">
            {session.discounts.filter((discount) => discount.active).map((discount) => (
              <div key={discount.id} className={`p-3 rounded-xl border ${discount.name === displayFee.label ? "border-primary bg-primary/5" : "border-border bg-card"}`} role="listitem">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground">{discount.name}</p>
                  <span className="text-xs font-bold text-primary">{discount.value}% off</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{discount.conditions}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
