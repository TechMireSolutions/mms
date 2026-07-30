import type { AttendanceRecord } from "@/lib/data/attendanceData";
import type { Enrollment } from "@/lib/data/enrollmentData";
import type { Exam, ExamResult } from "@/lib/data/examinationData";
import type { Invoice } from "@/lib/data/financeData";
import type { Denomination, Distribution } from "@/lib/data/hasanatData";
import type { Session } from "@/lib/data/sessionsData";
import {
  getCollectedAmountForInvoice,
  getDenominationPoints,
  type AppTranslationKey,
} from "@mms/shared";

import type { ComparisonDataItem } from "./comparisonModeTypes";

export function computeDynamicSessionComparison(
  sessions: Session[],
  enrollments: Enrollment[],
  attendanceRecords: AttendanceRecord[],
  financeInvoices: Invoice[],
  hasanatDistributions: Distribution[],
  examResults: ExamResult[],
  exams: Exam[],
  denoms: Denomination[],
  targetA: string,
  targetB: string,
  t: (key: AppTranslationKey) => string,
): ComparisonDataItem[] {
  const sessionA = sessions.find((session) => session.id === targetA);
  const sessionB = sessions.find((session) => session.id === targetB);

  const getMetrics = (session: Session | undefined) => {
    if (!session) {
      return { enrollment: 0, attendancePct: 0, feeCollected: 0, passRatePct: 0, hasanat: 0 };
    }

    const sessionId = session.id;
    const sessionName = session.name;

    const sessionEnrollments = enrollments.filter((enrollment) => enrollment.sessionId === sessionId && enrollment.status !== "cancelled");
    const enrollment = sessionEnrollments.length;

    const classIds = new Set(session.classes?.map((sessionClass) => sessionClass.id) || []);
    const sessionAttendance = attendanceRecords.filter((attendanceRecord) => classIds.has(attendanceRecord.classId));
    const presentCount = sessionAttendance.filter((attendanceRecord) => attendanceRecord.status === "present" || attendanceRecord.status === "late").length;
    const attendancePct = sessionAttendance.length > 0
      ? Math.round((presentCount / sessionAttendance.length) * 100)
      : 0;

    const sessionInvoices = financeInvoices.filter((invoice) => invoice.session === sessionId || invoice.session === sessionName);
    let feeCollected = 0;
    sessionInvoices.forEach((invoice) => {
      feeCollected += getCollectedAmountForInvoice(invoice);
    });

    const sessionExams = exams.filter((exam) => exam.classIds && exam.classIds.some((classId: string) => classIds.has(classId)));
    const sessionExamIds = new Set(sessionExams.map((exam) => exam.id));
    const sessionResults = examResults.filter((examResult) => sessionExamIds.has(examResult.examId));
    let passCount = 0;
    sessionResults.forEach((examResult) => {
      const exam = sessionExams.find((examOption) => examOption.id === examResult.examId);
      if (exam && examResult.marksObtained >= exam.passingMarks) {
        passCount++;
      }
    });
    const passRatePct = sessionResults.length > 0
      ? Math.round((passCount / sessionResults.length) * 100)
      : 0;

    const studentIds = new Set(sessionEnrollments.map((enrollment) => enrollment.studentId));
    let hasanat = 0;
    hasanatDistributions.forEach((distribution) => {
      if (distribution.recipientStudentId && studentIds.has(distribution.recipientStudentId)) {
        hasanat += (distribution.quantity || 1) * getDenominationPoints(distribution.denominationId, distribution.denominationName, denoms);
      }
    });

    return { enrollment, attendancePct, feeCollected, passRatePct, hasanat };
  };

  const metricsA = getMetrics(sessionA);
  const metricsB = getMetrics(sessionB);

  return [
    { metric: t("reports.comparison.metricEnrollment"), a: metricsA.enrollment, b: metricsB.enrollment, metricKey: "enrollment" },
    { metric: t("reports.comparison.metricAttendance"), a: metricsA.attendancePct, b: metricsB.attendancePct, metricKey: "attendancePct" },
    { metric: t("reports.comparison.metricFeeCollected"), a: metricsA.feeCollected, b: metricsB.feeCollected, metricKey: "feeCollected" },
    { metric: t("reports.comparison.metricPassRate"), a: metricsA.passRatePct, b: metricsB.passRatePct, metricKey: "passRatePct" },
    { metric: t("reports.comparison.metricHasanat"), a: metricsA.hasanat, b: metricsB.hasanat, metricKey: "hasanat" },
  ];
}
