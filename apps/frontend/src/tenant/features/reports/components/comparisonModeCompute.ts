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

import type { ComparisonDataItem, DateRange, DateRangeDataItem } from "./comparisonModeTypes";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isInRange(dateStr: string, start: string, end: string): boolean {
  if (!dateStr) return false;
  return dateStr >= start && dateStr <= end;
}

function getMonthIndex(dateStr: string): number {
  const parsedDate = new Date(dateStr);
  return Number.isNaN(parsedDate.getTime()) ? -1 : parsedDate.getMonth();
}

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

export function computeDynamicDateRangeComparison(
  category: string,
  enrollments: Enrollment[],
  attendanceRecords: AttendanceRecord[],
  financeInvoices: Invoice[],
  hasanatDistributions: Distribution[],
  examResults: ExamResult[],
  exams: Exam[],
  denoms: Denomination[],
  rangeA: DateRange,
  rangeB: DateRange,
): DateRangeDataItem[] {
  const bucketA = new Array<number>(12).fill(0);
  const bucketB = new Array<number>(12).fill(0);
  const countA = new Array<number>(12).fill(0);
  const countB = new Array<number>(12).fill(0);

  const lowerCat = category.toLowerCase();

  if (lowerCat === "financial") {
    financeInvoices.forEach((invoice) => {
      const paid = getCollectedAmountForInvoice(invoice);

      if (isInRange(invoice.dueDate, rangeA.from, rangeA.to)) {
        const monthIndex = getMonthIndex(invoice.dueDate);
        if (monthIndex >= 0) bucketA[monthIndex] += paid;
      }
      if (isInRange(invoice.dueDate, rangeB.from, rangeB.to)) {
        const monthIndex = getMonthIndex(invoice.dueDate);
        if (monthIndex >= 0) bucketB[monthIndex] += paid;
      }
    });
  } else if (lowerCat === "attendance") {
    attendanceRecords.forEach((attendanceRecord) => {
      const isPresent = attendanceRecord.status === "present" || attendanceRecord.status === "late";
      const attendanceValue = isPresent ? 1 : 0;
      if (isInRange(attendanceRecord.date, rangeA.from, rangeA.to)) {
        const monthIndex = getMonthIndex(attendanceRecord.date);
        if (monthIndex >= 0) {
          bucketA[monthIndex] += attendanceValue;
          countA[monthIndex] += 1;
        }
      }
      if (isInRange(attendanceRecord.date, rangeB.from, rangeB.to)) {
        const monthIndex = getMonthIndex(attendanceRecord.date);
        if (monthIndex >= 0) {
          bucketB[monthIndex] += attendanceValue;
          countB[monthIndex] += 1;
        }
      }
    });
  } else if (lowerCat === "hasanat") {
    hasanatDistributions.forEach((distribution) => {
      const points = (distribution.quantity || 1) * getDenominationPoints(distribution.denominationId, distribution.denominationName, denoms);
      if (isInRange(distribution.issuedDate, rangeA.from, rangeA.to)) {
        const monthIndex = getMonthIndex(distribution.issuedDate);
        if (monthIndex >= 0) bucketA[monthIndex] += points;
      }
      if (isInRange(distribution.issuedDate, rangeB.from, rangeB.to)) {
        const monthIndex = getMonthIndex(distribution.issuedDate);
        if (monthIndex >= 0) bucketB[monthIndex] += points;
      }
    });
  } else if (lowerCat === "students" || lowerCat === "enrollments") {
    enrollments.forEach((enrollment) => {
      const date = enrollment.enrolledDate || rangeA.from;
      if (isInRange(date, rangeA.from, rangeA.to)) {
        const monthIndex = getMonthIndex(date);
        if (monthIndex >= 0) bucketA[monthIndex] += 1;
      }
      if (isInRange(date, rangeB.from, rangeB.to)) {
        const monthIndex = getMonthIndex(date);
        if (monthIndex >= 0) bucketB[monthIndex] += 1;
      }
    });
  } else if (lowerCat === "examinations" || lowerCat === "academic") {
    const examMap = new Map<string, Exam>();
    exams.forEach((exam) => examMap.set(exam.id, exam));

    examResults.forEach((examResult) => {
      const exam = examMap.get(examResult.examId);
      if (!exam) return;
      const isPass = examResult.marksObtained >= exam.passingMarks;
      const passValue = isPass ? 1 : 0;
      if (isInRange(exam.date, rangeA.from, rangeA.to)) {
        const monthIndex = getMonthIndex(exam.date);
        if (monthIndex >= 0) {
          bucketA[monthIndex] += passValue;
          countA[monthIndex] += 1;
        }
      }
      if (isInRange(exam.date, rangeB.from, rangeB.to)) {
        const monthIndex = getMonthIndex(exam.date);
        if (monthIndex >= 0) {
          bucketB[monthIndex] += passValue;
          countB[monthIndex] += 1;
        }
      }
    });
  } else {
    return [];
  }

  const dateRangeData: DateRangeDataItem[] = [];
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const hasData = countA[monthIndex] > 0 || countB[monthIndex] > 0 || bucketA[monthIndex] > 0 || bucketB[monthIndex] > 0;
    if (hasData) {
      let valueA = bucketA[monthIndex];
      let valueB = bucketB[monthIndex];

      if (lowerCat === "attendance" || lowerCat === "examinations" || lowerCat === "academic") {
        valueA = countA[monthIndex] > 0 ? Math.round((bucketA[monthIndex] / countA[monthIndex]) * 100) : 0;
        valueB = countB[monthIndex] > 0 ? Math.round((bucketB[monthIndex] / countB[monthIndex]) * 100) : 0;
      }

      dateRangeData.push({
        month: MONTH_NAMES[monthIndex],
        a: valueA,
        b: valueB,
      });
    }
  }

  if (dateRangeData.length === 0) {
    const startMonth = getMonthIndex(rangeA.from);
    const endMonth = getMonthIndex(rangeA.to);
    const startIndex = startMonth >= 0 ? startMonth : 0;
    const endIndex = endMonth >= 0 ? endMonth : 2;
    for (let monthIndex = startIndex; monthIndex <= endIndex; monthIndex++) {
      dateRangeData.push({ month: MONTH_NAMES[monthIndex], a: 0, b: 0 });
    }
  }

  return dateRangeData;
}

export function buildContactsDateRangeComparison(
  monthlyByYear: Array<{ year: number; months: { month: string; count: number }[] }> | undefined,
  rangeA: DateRange,
  rangeB: DateRange,
): DateRangeDataItem[] {
  const yearA = rangeA.from.slice(0, 4);
  const yearB = rangeB.from.slice(0, 4);
  const seriesA = monthlyByYear?.find((monthlySeries) => String(monthlySeries.year) === yearA)?.months ?? [];
  const seriesB = monthlyByYear?.find((monthlySeries) => String(monthlySeries.year) === yearB)?.months ?? [];
  return seriesA.map((monthBucket, index) => ({
    month: monthBucket.month,
    a: monthBucket.count,
    b: seriesB[index]?.count ?? 0,
  }));
}
