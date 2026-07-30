import { formatMoney, todayISO } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { Enrollment, CalculatedFee } from '@/lib/data/enrollmentData';
import { Student } from '@/lib/data/studentsData';
import { Session, Class } from '@/lib/data/sessionsData';

export function buildEnrollmentPayload(params: {
  student: Student;
  session: Session;
  classInfo: Class | null;
  feeResult: CalculatedFee;
  notes: string;
  customFieldValues: Record<string, unknown>;
  t: TranslationFunction;
}): Enrollment {
  const { student, session, classInfo, feeResult, notes, customFieldValues, t } = params;
  const nowISO = new Date().toISOString();

  return {
    id: `enr-${Date.now()}`,
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
}
