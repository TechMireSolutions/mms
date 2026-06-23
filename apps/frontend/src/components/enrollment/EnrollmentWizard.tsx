import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, BookOpen, CheckCircle2, Layers, DollarSign, ClipboardCheck,
  ArrowRight, ArrowLeft, X,
} from "lucide-react";
import StepIndicator, { Step } from "./wizard/StepIndicator";
import Step1SelectStudent from "./wizard/Step1SelectStudent";
import Step2SelectSession from "./wizard/Step2SelectSession";
import Step3Eligibility from "./wizard/Step3Eligibility";
import Step4ClassAssignment from "./wizard/Step4ClassAssignment";
import Step5FeeCalculation from "./wizard/Step5FeeCalculation";
import Step6Confirmation from "./wizard/Step6Confirmation";
import { suggestClass, runFullEligibility, Enrollment, CalculatedFee } from '@/lib/data/enrollmentData';
import { Student } from '@/lib/data/studentsData';
import { Session, Class } from '@/lib/data/sessionsData';
import { useSessionsCollection } from "@/hooks/useSessions";
import { useEnrollmentConfig } from "@/hooks/useEnrollmentConfig";

const STEPS: Step[] = [
  { id: "student",     label: "Student",     icon: User },
  { id: "session",     label: "Session",     icon: BookOpen },
  { id: "eligibility", label: "Eligibility", icon: CheckCircle2 },
  { id: "class",       label: "Class",       icon: Layers },
  { id: "fee",         label: "Fee",         icon: DollarSign },
  { id: "confirm",     label: "Confirm",     icon: ClipboardCheck },
];

interface EnrollmentWizardProps {
  onComplete: (enrollment: Enrollment) => void;
  onCancel: () => void;
}

/**
 * Wizard component for walking through a new student enrollment process.
 *
 * @param props - Component props.
 * @param props.onComplete - Callback when the enrollment is confirmed.
 * @param props.onCancel - Callback when the wizard is cancelled.
 * @returns The EnrollmentWizard component.
 */
export default function EnrollmentWizard({ onComplete, onCancel }: EnrollmentWizardProps): React.ReactElement {
  const sessions = useSessionsCollection();
  const [step, setStep] = useState<number>(0);
  const [student, setStudent]       = useState<Student | null>(null);
  const [session, setSession]       = useState<Session | null>(null);
  const [classInfo, setClassInfo]   = useState<Class | null>(null);
  const [feeResult, setFeeResult]   = useState<CalculatedFee | null>(null);
  const [notes, setNotes]           = useState<string>("");
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [done, setDone]             = useState<boolean>(false);
  const [direction, setDirection]   = useState<number>(1);

  const { settings, fields, customFields } = useEnrollmentConfig();

  const suggested = student && session ? suggestClass(student, session) : null;

  const canNext = (): boolean => {
    if (step === 0) return !!student;
    if (step === 1) return !!session;
    if (step === 2) {
      const checks = student && session ? runFullEligibility(student, session, suggested, []) : [];
      return checks.filter((c) => c.status === "fail").length === 0;
    }
    if (step === 3) return !!classInfo;
    if (step === 4) return !!feeResult;
    return true;
  };

  const canConfirm = (): boolean => {
    if (fields.notes?.required && !notes) return false;
    for (const cf of customFields) {
      if (cf.required && !customFieldValues[cf.id]) return false;
    }
    return true;
  };

  const go = (dir: number) => {
    setDirection(dir);
    setStep((s) => s + dir);
  };

  const handleNext = () => {
    if (step === 1 && suggested) {
      setClassInfo(suggested);
    }
    go(1);
  };

  const handleSubmit = () => {
    if (!student || !session || !feeResult) return;

    const enrollment: Enrollment = {
      id: `enr${Date.now()}`,
      studentId: student.id,
      sessionId: session.id,
      sessionName: session.name,
      classId: classInfo?.id || "",
      className: classInfo?.name || "",
      enrolledDate: new Date().toISOString().slice(0, 10),
      baseFee: session.baseFee,
      discountType: feeResult.id,
      discountLabel: feeResult.label,
      discountPct: feeResult.pct,
      discountAmt: feeResult.discountAmt,
      finalFee: feeResult.finalFee,
      status: "pending",
      invoiceId: `inv${Date.now()}`,
      paymentStatus: "pending",
      notes,
      customFields: customFieldValues,
      timeline: [
        { ts: new Date().toISOString(), event: "Enrollment created", by: "Admin" },
        { ts: new Date().toISOString(), event: `Invoice generated (PKR ${feeResult.finalFee.toLocaleString()})`, by: "System" },
      ],
    } as unknown as Enrollment;
    setDone(true);
    setTimeout(() => onComplete(enrollment), 400);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center px-6"
        role="status"
        aria-live="polite"
      >
        <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-success" aria-hidden="true" />
        </div>
        <p className="text-lg font-bold text-foreground">Enrollment Submitted!</p>
        <p className="text-sm text-muted-foreground mt-1">{student?.name} enrolled in {session?.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Invoice generated · Notification sent</p>
      </motion.div>
    );
  }

  return (
    <article className="space-y-6" aria-label="Enrollment Wizard Form">
      {/* Step indicator */}
      <div className="overflow-x-auto pb-1">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -24 }}
          transition={{ duration: 0.22 }}
        >
          {step === 0 && <Step1SelectStudent value={student} onChange={setStudent} sessions={sessions} />}
          {step === 1 && <Step2SelectSession value={session} onChange={(s) => { setSession(s); setClassInfo(null); }} sessions={sessions} />}
          {step === 2 && student && session && (
            <Step3Eligibility student={student} session={session} suggestedClass={suggested} />
          )}
          {step === 3 && session && (
            <Step4ClassAssignment
              session={session} student={student}
              suggestedClass={suggested} value={classInfo} onChange={setClassInfo}
            />
          )}
          {step === 4 && student && session && (
            <Step5FeeCalculation student={student} session={session} feeResult={feeResult} onFeeResult={setFeeResult} />
          )}
          {step === 5 && (
            <Step6Confirmation
              student={student} session={session} classInfo={classInfo}
              feeResult={feeResult} notes={notes} onNotesChange={setNotes}
              customFieldValues={customFieldValues}
              onCustomFieldChange={(id, val) => setCustomFieldValues((prev) => ({ ...prev, [id]: val }))}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div>
          {step === 0 ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" /> Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go(-1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground" aria-live="polite">Step {step + 1} of {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canNext()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canConfirm()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Confirm Enrollment
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
