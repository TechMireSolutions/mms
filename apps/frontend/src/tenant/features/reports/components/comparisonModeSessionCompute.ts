import type { Exam, ExamResult } from "@/lib/data/examinationData";
import type { Session } from "@/lib/data/sessionsData";
import type {
  AppTranslationKey,
  AttendanceReportComparisonSession,
  EnrollmentsReportComparisonSession,
  FinanceReportComparisonSession,
  HasanatReportComparisonSession,
} from "@mms/shared";

import type { ComparisonDataItem } from "./comparisonModeTypes";

export function computeDynamicSessionComparison(
  sessions: Session[],
  enrollmentSessions: EnrollmentsReportComparisonSession[],
  attendanceSessions: AttendanceReportComparisonSession[],
  financeSessions: FinanceReportComparisonSession[],
  hasanatSessions: HasanatReportComparisonSession[],
  examResults: ExamResult[],
  exams: Exam[],
  targetA: string,
  targetB: string,
  t: (key: AppTranslationKey) => string,
): ComparisonDataItem[] {
  const sessionA = sessions.find((session) => session.id === targetA);
  const sessionB = sessions.find((session) => session.id === targetB);
  const enrollmentBySessionId = new Map(
    enrollmentSessions.map((row) => [row.sessionId, row] as const),
  );
  const attendanceBySessionId = new Map(
    attendanceSessions.map((row) => [row.sessionId, row] as const),
  );
  const financeBySessionId = new Map(
    financeSessions.map((row) => [row.sessionId, row] as const),
  );
  const hasanatBySessionId = new Map(
    hasanatSessions.map((row) => [row.sessionId, row] as const),
  );

  const getMetrics = (session: Session | undefined) => {
    if (!session) {
      return { enrollment: 0, attendancePct: 0, feeCollected: 0, passRatePct: 0, hasanat: 0 };
    }

    const sessionId = session.id;
    const enrollmentRow = enrollmentBySessionId.get(sessionId);
    const enrollment = enrollmentRow?.enrollmentCount ?? 0;

    const classIds = new Set(session.classes?.map((sessionClass) => sessionClass.id) || []);
    const attendancePct = attendanceBySessionId.get(sessionId)?.attendancePct ?? 0;

    const feeCollected = financeBySessionId.get(sessionId)?.feeCollected ?? 0;

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

    const hasanat = hasanatBySessionId.get(sessionId)?.hasanat ?? 0;

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
