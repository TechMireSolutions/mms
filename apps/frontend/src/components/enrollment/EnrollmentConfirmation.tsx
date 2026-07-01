import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Tag, Loader2, BookOpen, User, Clock, MapPin } from "lucide-react";
import { Student, StudentSession } from '@/lib/data/studentsData';
import { useStudentConfig } from "@/hooks/useStudentConfig";
import { Button } from "@/components/ui/button";

interface FeeRowProps {
  label: string;
  amount: number;
  currency: string;
  isSub?: boolean;
  isTotal?: boolean;
  isDiscount?: boolean;
}

/**
 * Row helper for fee breakdown.
 *
 * @returns Component layout.
 */
function FeeRow({ label, amount, currency, isSub = false, isTotal = false, isDiscount = false }: FeeRowProps): React.ReactElement {
  return (
    <div className={`flex items-center justify-between py-2 ${isTotal ? "border-t border-border mt-1 pt-3" : ""}`}>
      <span className={`text-sm ${isTotal ? "font-bold text-foreground" : isSub ? "text-muted-foreground text-xs pl-3" : "text-foreground"}`}>{label}</span>
      <span className={`text-sm font-semibold ${isTotal ? "text-lg font-bold text-foreground" : isDiscount ? "text-success" : "text-foreground"}`}>
        {isDiscount && amount > 0 ? "−" : ""}{currency} {Math.abs(amount).toLocaleString()}
      </span>
    </div>
  );
}

interface ConfirmData {
  student: Partial<Student>;
  session: StudentSession;
  discountType: string;
  netFee: number;
  total: number;
}

interface EnrollmentConfirmationProps {
  student: Partial<Student>;
  session: StudentSession;
  onConfirm: (confirmationData: ConfirmData) => void;
  onBack: () => void;
}

/**
 * Confirmation step in enrollment wizard.
 *
 * @param props - Component props.
 * @param props.student - Student details.
 * @param props.session - Target session details.
 * @param props.onConfirm - Callback upon completion.
 * @param props.onBack - Callback to return to previous step.
 * @returns The EnrollmentConfirmation component.
 */
export function EnrollmentConfirmation({ student, session, onConfirm, onBack }: EnrollmentConfirmationProps): React.ReactElement {
  const { discountTypes } = useStudentConfig();
  const [discountType, setDiscountType] = useState<string>(student.discountType || "none");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);

  const discount = discountTypes.find((discountOption) => discountOption.id === discountType) ?? discountTypes[0] ?? {
    id: "none",
    label: "No Discount",
    pct: 0,
  };
  const discountAmount = Math.round(session.baseFee * (discount.pct / 100));
  const netFee = session.baseFee - discountAmount;
  const registrationFee = 500;
  const total = netFee + registrationFee;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setConfirmed(true);
      setSubmitting(false);
      setTimeout(() => onConfirm({ student, session, discountType, netFee, total }), 1600);
    } catch (error) {
      console.error("Failed to confirm enrollment:", error);
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-10 text-center space-y-4"
        role="status"
        aria-live="polite"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center"
        >
          <CheckCircle2 className="w-9 h-9 text-success" aria-hidden="true" />
        </motion.div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Enrollment Confirmed!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {student.name || "Student"} has been successfully enrolled in <strong>{session.name}</strong>.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Student */}
        <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-1" aria-label="Student details summary">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Student</span>
          </div>
          <p className="text-[14px] font-bold text-foreground">{student.name || "—"}</p>
          <p className="text-[11px] text-muted-foreground">{student.gender || "—"} · {student.dob ? new Date(student.dob).toLocaleDateString("en-GB") : "—"}</p>
          {student.fatherName && <p className="text-[11px] text-muted-foreground">Father: {student.fatherName}</p>}
        </section>

        {/* Session */}
        <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-1" aria-label="Session details summary">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Session</span>
          </div>
          <p className="text-[14px] font-bold text-foreground">{session.name}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" />{session.time}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" aria-hidden="true" />{session.room} · {session.teacher}</p>
        </section>
      </div>

      {/* Discount selector */}
      <section className="rounded-xl border border-border bg-card p-4" aria-label="Select Discount / Concession">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <h3 className="text-[12px] font-bold text-foreground uppercase tracking-wide">Discount / Concession</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Select discount option">
          {discountTypes.map((discountOption) => {
            const isSelected = discountType === discountOption.id;
            return (
              <Button
                key={discountOption.id}
                variant="outline"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setDiscountType(discountOption.id)}
                className={`rounded-lg border-2 px-3 py-2.5 text-left transition-all h-auto block hover:bg-transparent ${
                  isSelected
                    ? "border-primary bg-primary/[0.04] hover:bg-primary/[0.04] text-primary hover:text-primary"
                    : "border-border hover:border-primary/30 text-foreground hover:text-foreground"
                }`}
              >
                <p className={`text-[12px] font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>{discountOption.label}</p>
                <p className="text-[11px] text-muted-foreground">{discountOption.pct === 0 ? "No discount" : `${discountOption.pct}% off`}</p>
              </Button>
            );
          })}
        </div>
      </section>

      {/* Fee breakdown */}
      <section className="rounded-xl border border-border bg-card p-4" aria-label="Fee Breakdown">
        <h3 className="text-[12px] font-bold text-foreground uppercase tracking-wide mb-3">Fee Breakdown</h3>
        <FeeRow label="Base Monthly Fee" amount={session.baseFee} currency={session.currency} />
        {discount.pct > 0 && (
          <>
            <FeeRow label={`${discount.label} (${discount.pct}%)`} amount={discountAmount} currency={session.currency} isDiscount />
            <FeeRow label="Net Monthly Fee" amount={netFee} currency={session.currency} isSub />
          </>
        )}
        <FeeRow label="Registration Fee (one-time)" amount={registrationFee} currency={session.currency} />
        <FeeRow label="Total First Payment" amount={total} currency={session.currency} isTotal />

        {discount.pct === 100 && (
          <div className="mt-3 p-2.5 rounded-lg bg-success/10 border border-success/20" role="status">
            <p className="text-xs font-medium text-success">🎉 Full scholarship — monthly tuition is waived. Registration fee still applies.</p>
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="ghost"
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors h-auto"
        >
          ← Back
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-70 transition-all h-auto"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
          {submitting ? "Processing…" : "Confirm Enrollment"}
        </Button>
      </div>
    </div>
  );
}
