import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, BookOpen, CheckCircle2, Layers, DollarSign, ClipboardCheck,
  ArrowRight, ArrowLeft, X,
} from "lucide-react";
import { StepIndicator, Step } from "@/tenant/features/enrollments/components/wizard/StepIndicator";
import { Step1SelectStudent } from "@/tenant/features/enrollments/components/wizard/Step1SelectStudent";
import { Step2SelectSession } from "@/tenant/features/enrollments/components/wizard/Step2SelectSession";
import { Step3Eligibility } from "@/tenant/features/enrollments/components/wizard/Step3Eligibility";
import { Step4ClassAssignment } from "@/tenant/features/enrollments/components/wizard/Step4ClassAssignment";
import { Step5FeeCalculation } from "@/tenant/features/enrollments/components/wizard/Step5FeeCalculation";
import { Step6Confirmation } from "@/tenant/features/enrollments/components/wizard/Step6Confirmation";
import { suggestClass, runFullEligibility, Enrollment, CalculatedFee } from '@/lib/data/enrollmentData';
import { formatMoney, todayISO } from "@mms/shared";
import { Student } from '@/lib/data/studentsData';
import { Session, Class } from '@/lib/data/sessionsData';
import { useSessionsCollection } from "@/tenant/features/sessions/hooks/useSessions";
import { useEnrollmentConfig } from "@/hooks/useStandardModuleConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

interface EnrollmentWizardProps {
  onComplete: (enrollment: Enrollment) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Wizard component for walking through a new student enrollment process.
 */
export function EnrollmentWizard({ onComplete, onCancel }: EnrollmentWizardProps): React.ReactElement {
  const { t } = useTranslation();
  const sessions = useSessionsCollection();
  const [step, setStep] = useState<number>(0);
  const [student, setStudent]       = useState<Student | null>(null);
  const [session, setSession]       = useState<Session | null>(null);
  const [classInfo, setClassInfo]   = useState<Class | null>(null);
  const [feeResult, setFeeResult]   = useState<CalculatedFee | null>(null);
  const [notes, setNotes]           = useState<string>("");
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({});
  const [done, setDone]             = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [direction, setDirection]   = useState<number>(1);

  const { fields, customFields } = useEnrollmentConfig();

  const steps: Step[] = useMemo(() => [
    { id: "student",     label: t("enrollments.columns.student"), icon: User },
    { id: "session",     label: t("enrollments.columns.session"), icon: BookOpen },
    { id: "eligibility", label: t("enrollments.eligibility"), icon: CheckCircle2 },
    { id: "class",       label: t("enrollments.columns.class"), icon: Layers },
    { id: "fee",         label: t("enrollments.columns.finalFee"), icon: DollarSign },
    { id: "confirm",     label: t("enrollments.new"), icon: ClipboardCheck },
  ], [t]);

  const suggested = student && session ? suggestClass(student, session) : null;

  const canNext = (): boolean => {
    if (step === 0) return !!student;
    if (step === 1) return !!session;
    if (step === 2) {
      const checks = student && session ? runFullEligibility(student, session, suggested, []) : [];
      return checks.every((check) => check.status !== "fail");
    }
    if (step === 3) return !!classInfo;
    if (step === 4) return !!feeResult;
    return true;
  };

  const canConfirm = (): boolean => {
    if (fields.notes?.required && !notes.trim()) return false;
    return customFields.every(
      (customField) => !customField.required || Boolean(customFieldValues[customField.id])
    );
  };

  const go = (directionDelta: number) => {
    setDirection(directionDelta);
    setStep((currentStep) => currentStep + directionDelta);
  };

  const handleNext = () => {
    if (step === 1 && suggested) {
      setClassInfo(suggested);
    }
    go(1);
  };

  const handleSubmit = async () => {
    if (!student || !session || !feeResult || submitting) return;

    const nowISO = new Date().toISOString();
    const enrollment = {
      studentId: student.id,
      studentName: student.name || "",
      sessionId: session.id,
      sessionName: session.name,
      classId: classInfo?.id || "",
      className: classInfo?.name || "",
      enrolledDate: todayISO(),
      baseFee: session.baseFee,
      discountType: feeResult.id,
      discountLabel: feeResult.label,
      discountPct: feeResult.pct,
      discountAmt: feeResult.discountAmt,
      finalFee: feeResult.finalFee,
      status: "pending" as const,
      invoiceId: null,
      paymentStatus: "pending" as const,
      notes,
      customFields: customFieldValues,
      timeline: [
        { ts: nowISO, event: t("enrollments.wizard.timelineCreated"), by: "Admin" },
        {
          ts: nowISO,
          event: t("enrollments.wizard.timelineInvoice", { amount: formatMoney(feeResult.finalFee) }),
          by: "System",
        },
      ],
    } as unknown as Enrollment;

    setSubmitting(true);
    try {
      await onComplete(enrollment);
      setDone(true);
      window.setTimeout(() => onCancel(), 900);
    } catch {
      // Parent surfaces the error toast; keep wizard open for retry.
    } finally {
      setSubmitting(false);
    }
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
        <p className="text-lg font-bold text-foreground">{t("enrollments.wizard.submittedTitle")}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("enrollments.wizard.submittedSubtitle", {
            student: student?.name || "",
            session: session?.name || "",
          })}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{t("enrollments.wizard.submittedHint")}</p>
      </motion.div>
    );
  }

  return (
    <article className="space-y-6" aria-label="Enrollment Wizard Form">
      {/* Step indicator */}
      <div className="overflow-x-auto pb-1">
        <StepIndicator steps={steps} current={step} />
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
          {step === 1 && <Step2SelectSession value={session} onChange={(selectedSession) => { setSession(selectedSession); setClassInfo(null); }} sessions={sessions} />}
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
              onCustomFieldChange={(id, value) => setCustomFieldValues((previousValues) => ({ ...previousValues, [id]: value }))}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div>
          {step === 0 ? (
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors h-auto"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.cancel')}
            </Button>
          ) : (
            <Button
              onClick={() => go(-1)}
              variant="outline"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors h-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.previous')}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {t("enrollments.wizard.stepOf", { step: step + 1, total: steps.length })}
          </span>
          {step < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canNext()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors h-auto"
            >
              {t('common.next')} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              onClick={() => { void handleSubmit(); }}
              disabled={!canConfirm() || submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors h-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('enrollments.new')}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
