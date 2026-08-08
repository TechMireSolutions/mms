import type { AttendanceRecord } from "@/lib/data/attendanceData";
import type { Exam, ExamResult } from "@/lib/data/examinationData";
import type { Invoice } from "@/lib/data/financeData";
import type { Denomination, Distribution } from "@/lib/data/hasanatData";
import {
  getCollectedAmountForInvoice,
  getDenominationPoints,
  type EnrollmentsReportComparison,
} from "@mms/shared";

import {
  COMPARISON_MONTH_NAMES,
  getComparisonMonthIndex,
  isInComparisonDateRange,
} from "./comparisonModeDateHelpers";
import type { DateRange, DateRangeDataItem } from "./comparisonModeTypes";

export function computeDynamicDateRangeComparison(
  category: string,
  enrollmentMonthly: EnrollmentsReportComparison["monthly"] | undefined,
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

      if (isInComparisonDateRange(invoice.dueDate, rangeA.from, rangeA.to)) {
        const monthIndex = getComparisonMonthIndex(invoice.dueDate);
        if (monthIndex >= 0) bucketA[monthIndex] += paid;
      }
      if (isInComparisonDateRange(invoice.dueDate, rangeB.from, rangeB.to)) {
        const monthIndex = getComparisonMonthIndex(invoice.dueDate);
        if (monthIndex >= 0) bucketB[monthIndex] += paid;
      }
    });
  } else if (lowerCat === "attendance") {
    attendanceRecords.forEach((attendanceRecord) => {
      const isPresent = attendanceRecord.status === "present" || attendanceRecord.status === "late";
      const attendanceValue = isPresent ? 1 : 0;
      if (isInComparisonDateRange(attendanceRecord.date, rangeA.from, rangeA.to)) {
        const monthIndex = getComparisonMonthIndex(attendanceRecord.date);
        if (monthIndex >= 0) {
          bucketA[monthIndex] += attendanceValue;
          countA[monthIndex] += 1;
        }
      }
      if (isInComparisonDateRange(attendanceRecord.date, rangeB.from, rangeB.to)) {
        const monthIndex = getComparisonMonthIndex(attendanceRecord.date);
        if (monthIndex >= 0) {
          bucketB[monthIndex] += attendanceValue;
          countB[monthIndex] += 1;
        }
      }
    });
  } else if (lowerCat === "hasanat") {
    hasanatDistributions.forEach((distribution) => {
      const points = (distribution.quantity || 1) * getDenominationPoints(distribution.denominationId, distribution.denominationName, denoms);
      if (isInComparisonDateRange(distribution.issuedDate, rangeA.from, rangeA.to)) {
        const monthIndex = getComparisonMonthIndex(distribution.issuedDate);
        if (monthIndex >= 0) bucketA[monthIndex] += points;
      }
      if (isInComparisonDateRange(distribution.issuedDate, rangeB.from, rangeB.to)) {
        const monthIndex = getComparisonMonthIndex(distribution.issuedDate);
        if (monthIndex >= 0) bucketB[monthIndex] += points;
      }
    });
  } else if (lowerCat === "students" || lowerCat === "enrollments") {
    for (const monthBucket of enrollmentMonthly?.a ?? []) {
      const monthIndex = getComparisonMonthIndex(`${monthBucket.monthKey}-01`);
      if (monthIndex >= 0) bucketA[monthIndex] += monthBucket.count;
    }
    for (const monthBucket of enrollmentMonthly?.b ?? []) {
      const monthIndex = getComparisonMonthIndex(`${monthBucket.monthKey}-01`);
      if (monthIndex >= 0) bucketB[monthIndex] += monthBucket.count;
    }
  } else if (lowerCat === "examinations" || lowerCat === "academic") {
    const examMap = new Map<string, Exam>();
    exams.forEach((exam) => examMap.set(exam.id, exam));

    examResults.forEach((examResult) => {
      const exam = examMap.get(examResult.examId);
      if (!exam) return;
      const isPass = examResult.marksObtained >= exam.passingMarks;
      const passValue = isPass ? 1 : 0;
      if (isInComparisonDateRange(exam.date, rangeA.from, rangeA.to)) {
        const monthIndex = getComparisonMonthIndex(exam.date);
        if (monthIndex >= 0) {
          bucketA[monthIndex] += passValue;
          countA[monthIndex] += 1;
        }
      }
      if (isInComparisonDateRange(exam.date, rangeB.from, rangeB.to)) {
        const monthIndex = getComparisonMonthIndex(exam.date);
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
        month: COMPARISON_MONTH_NAMES[monthIndex],
        a: valueA,
        b: valueB,
      });
    }
  }

  if (dateRangeData.length === 0) {
    const startMonth = getComparisonMonthIndex(rangeA.from);
    const endMonth = getComparisonMonthIndex(rangeA.to);
    const startIndex = startMonth >= 0 ? startMonth : 0;
    const endIndex = endMonth >= 0 ? endMonth : 2;
    for (let monthIndex = startIndex; monthIndex <= endIndex; monthIndex++) {
      dateRangeData.push({ month: COMPARISON_MONTH_NAMES[monthIndex], a: 0, b: 0 });
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
