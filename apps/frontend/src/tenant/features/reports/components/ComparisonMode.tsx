import React, { useState, useMemo, useEffect } from "react";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { GitCompare, X } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { useTranslation } from "@/hooks/useTranslation";
import { formatNumber } from "@/lib/utils";
import { useSessionsCollection } from '@/tenant/features/sessions/hooks/useSessions';

import { useContactsReportAnalytics } from '@/tenant/features/contacts/hooks/useContacts';

import { useEnrollmentsCollection } from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";
import { useAttendanceRecordsCollection } from "@/tenant/features/attendance/hooks/useAttendance";
import { useFinanceInvoicesCollection } from "@/tenant/features/finance/hooks/useFinanceApi";
import { useHasanatDistributionsCollection, useHasanatDenomsCollection } from "@/tenant/features/hasanat/hooks/useHasanatApi";
import { useExaminationsExamsCollection, useExaminationsResultsCollection } from "@/tenant/features/examinations/hooks/useExaminationsApi";
import type { Session } from "@/lib/data/sessionsData";
import type { Enrollment } from "@/lib/data/enrollmentData";
import type { AttendanceRecord } from "@/lib/data/attendanceData";
import type { Invoice } from "@/lib/data/financeData";
import type { Distribution, Denomination } from "@/lib/data/hasanatData";
import type { Exam, ExamResult } from "@/lib/data/examinationData";
import { getDenominationPoints, type AppTranslationKey } from "@mms/shared";
import { formatDate } from "@/lib/db";
import { useFinanceCurrency } from "@/hooks/useCurrency";

interface ComparisonDataItem {
  metric: string;
  a: number;
  b: number;
  metricKey?: string;
}

interface DateRangeDataItem {
  month: string;
  a: number;
  b: number;
}

interface DateRange {
  from: string;
  to: string;
}



function computeDynamicSessionComparison(
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
      if (invoice.status === "paid") {
        feeCollected += invoice.finalAmt;
      } else if (invoice.status === "partial") {
        feeCollected += invoice.paidAmt !== undefined ? invoice.paidAmt : Math.round(invoice.finalAmt / 2);
      }
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
    { metric: t("reports.comparison.metricEnrollment"),   a: metricsA.enrollment,     b: metricsB.enrollment, metricKey: "enrollment" },
    { metric: t("reports.comparison.metricAttendance"),  a: metricsA.attendancePct,  b: metricsB.attendancePct, metricKey: "attendancePct" },
    { metric: t("reports.comparison.metricFeeCollected"),a: metricsA.feeCollected,   b: metricsB.feeCollected, metricKey: "feeCollected" },
    { metric: t("reports.comparison.metricPassRate"),   a: metricsA.passRatePct,    b: metricsB.passRatePct, metricKey: "passRatePct" },
    { metric: t("reports.comparison.metricHasanat"),      a: metricsA.hasanat,        b: metricsB.hasanat, metricKey: "hasanat" },
  ];
}

function computeDynamicDateRangeComparison(
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
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const inRange = (dateStr: string, start: string, end: string) => {
    if (!dateStr) return false;
    return dateStr >= start && dateStr <= end;
  };

  const getMonthIndex = (dateStr: string) => {
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? -1 : parsedDate.getMonth();
  };

  const bucketA = new Array(12).fill(0);
  const bucketB = new Array(12).fill(0);
  const countA = new Array(12).fill(0);
  const countB = new Array(12).fill(0);

  const lowerCat = category.toLowerCase();

  if (lowerCat === "financial") {
    financeInvoices.forEach((invoice) => {
      let paid = 0;
      if (invoice.status === "paid") {
        paid = invoice.finalAmt;
      } else if (invoice.status === "partial") {
        paid = invoice.paidAmt !== undefined ? invoice.paidAmt : Math.round(invoice.finalAmt / 2);
      }

      if (inRange(invoice.dueDate, rangeA.from, rangeA.to)) {
        const monthIndex = getMonthIndex(invoice.dueDate);
        if (monthIndex >= 0) bucketA[monthIndex] += paid;
      }
      if (inRange(invoice.dueDate, rangeB.from, rangeB.to)) {
        const monthIndex = getMonthIndex(invoice.dueDate);
        if (monthIndex >= 0) bucketB[monthIndex] += paid;
      }
    });
  } else if (lowerCat === "attendance") {
    attendanceRecords.forEach((attendanceRecord) => {
      const isPresent = attendanceRecord.status === "present" || attendanceRecord.status === "late";
      const attendanceValue = isPresent ? 1 : 0;
      if (inRange(attendanceRecord.date, rangeA.from, rangeA.to)) {
        const monthIndex = getMonthIndex(attendanceRecord.date);
        if (monthIndex >= 0) {
          bucketA[monthIndex] += attendanceValue;
          countA[monthIndex] += 1;
        }
      }
      if (inRange(attendanceRecord.date, rangeB.from, rangeB.to)) {
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
      if (inRange(distribution.issuedDate, rangeA.from, rangeA.to)) {
        const monthIndex = getMonthIndex(distribution.issuedDate);
        if (monthIndex >= 0) bucketA[monthIndex] += points;
      }
      if (inRange(distribution.issuedDate, rangeB.from, rangeB.to)) {
        const monthIndex = getMonthIndex(distribution.issuedDate);
        if (monthIndex >= 0) bucketB[monthIndex] += points;
      }
    });
  } else if (lowerCat === "students" || lowerCat === "enrollments") {
    enrollments.forEach((enrollment) => {
      const date = enrollment.enrolledDate || rangeA.from;
      if (inRange(date, rangeA.from, rangeA.to)) {
        const monthIndex = getMonthIndex(date);
        if (monthIndex >= 0) bucketA[monthIndex] += 1;
      }
      if (inRange(date, rangeB.from, rangeB.to)) {
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
      if (inRange(exam.date, rangeA.from, rangeA.to)) {
        const monthIndex = getMonthIndex(exam.date);
        if (monthIndex >= 0) {
          bucketA[monthIndex] += passValue;
          countA[monthIndex] += 1;
        }
      }
      if (inRange(exam.date, rangeB.from, rangeB.to)) {
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
        month: monthNames[monthIndex],
        a: valueA,
        b: valueB
      });
    }
  }

  if (dateRangeData.length === 0) {
    const startMonth = getMonthIndex(rangeA.from);
    const endMonth = getMonthIndex(rangeA.to);
    const startIndex = startMonth >= 0 ? startMonth : 0;
    const endIndex = endMonth >= 0 ? endMonth : 2;
    for (let monthIndex = startIndex; monthIndex <= endIndex; monthIndex++) {
      dateRangeData.push({ month: monthNames[monthIndex], a: 0, b: 0 });
    }
  }

  return dateRangeData;
}

function buildContactsDateRangeComparison(
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



interface ComparisonModeProps {
  category: string;
  onClose: () => void;
}

/**
 * ComparisonMode component that displays side-by-side session or date range comparisons.
 *
 * @param props - Component props.
 * @returns React.JSX.Element
 */
export default function ComparisonMode({ category, onClose }: ComparisonModeProps): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const { primary, secondary } = useBrandPalette();

  const isContacts = category.toLowerCase() === "contacts";
  const [mode, setMode] = useState<"sessions" | "daterange">("sessions");
  const [valA, setValA] = useState<string>(isContacts ? "Lead" : "s1");
  const [valB, setValB] = useState<string>(isContacts ? "Active Student" : "s2");
  const [rangeA, setRangeA] = useState<DateRange>({ from: "2025-01-01", to: "2025-03-31" });
  const [rangeB, setRangeB] = useState<DateRange>({ from: "2026-01-01", to: "2026-03-31" });

  const compareYears = useMemo(() => {
    if (!isContacts || mode !== "daterange") return undefined;
    const yearA = Number.parseInt(rangeA.from.slice(0, 4), 10);
    const yearB = Number.parseInt(rangeB.from.slice(0, 4), 10);
    return [yearA, yearB].filter((year) => Number.isFinite(year));
  }, [isContacts, mode, rangeA.from, rangeB.from]);


  const { data: reportData } = useContactsReportAnalytics({
    enabled: isContacts,
    compareYears,
  });
  const sessions = useSessionsCollection();
  const SESSIONS_OPTIONS = useMemo<{id: string, name: string}[]>(
    () => sessions.filter((session) => session.id !== "all").map((session) => ({ id: session.id, name: session.name })),
    [sessions],
  );

  const enrollments = useEnrollmentsCollection();
  const attendanceRecords = useAttendanceRecordsCollection();
  const financeInvoices = useFinanceInvoicesCollection();
  const hasanatDistributions = useHasanatDistributionsCollection();
  const examResults = useExaminationsResultsCollection();
  const exams = useExaminationsExamsCollection();
  const denoms = useHasanatDenomsCollection();



  // Sync targets when category changes
  useEffect(() => {
    if (isContacts) {
      setMode("daterange");
    } else {
      setMode("sessions");
      setValA("s1");
      setValB("s2");
    }
  }, [category, isContacts]);

  const options = SESSIONS_OPTIONS;
  const labelA = mode === "sessions" ? options.find((option) => option.id === valA)?.name : `${formatDate(rangeA.from)} → ${formatDate(rangeA.to)}`;
  const labelB = mode === "sessions" ? options.find((option) => option.id === valB)?.name : `${formatDate(rangeB.from)} → ${formatDate(rangeB.to)}`;

  const comparisonData = useMemo(() => {
    if (mode === "sessions") {
      if (isContacts) {
        return [];
      }
      return computeDynamicSessionComparison(
        sessions,
        enrollments,
        attendanceRecords,
        financeInvoices,
        hasanatDistributions,
        examResults,
        exams,
        denoms,
        valA,
        valB,
        t,
      );
    }
    if (isContacts) {
      return buildContactsDateRangeComparison(reportData?.monthlyByYear, rangeA, rangeB);
    }
    return computeDynamicDateRangeComparison(
      category,
      enrollments,
      attendanceRecords,
      financeInvoices,
      hasanatDistributions,
      examResults,
      exams,
      denoms,
      rangeA,
      rangeB,
    );
  }, [
    mode,
    isContacts,
    reportData,
    valA,
    valB,
    rangeA,
    rangeB,
    sessions,
    enrollments,
    attendanceRecords,
    financeInvoices,
    hasanatDistributions,
    examResults,
    exams,
    denoms,
    category,
    t,
  ]);

  const translatedData = useMemo(() => {
    const translateMetricName = (name: string): string => {
      switch (name) {
        case "Total Volume": return t("reports.comparison.metricTotalVolume");
        case "Conversion%": return t("reports.comparison.metricConversionPct");
        case "Engagement": return t("reports.comparison.metricEngagement");
        case "Active Status": return t("reports.comparison.metricActiveStatus");
        case "Enrollment": return t("reports.comparison.metricEnrollment");
        case "Attendance%": return t("reports.comparison.metricAttendance");
        case "Fee Collected": return t("reports.comparison.metricFeeCollected");
        case "Pass Rate%": return t("reports.comparison.metricPassRate");
        case "Hasanat": return t("reports.comparison.metricHasanat");
        default: return name;
      }
    };

    if (mode !== "sessions") return comparisonData;
    return (comparisonData as ComparisonDataItem[]).map((row) => ({
      ...row,
      metric: translateMetricName(row.metric),
    }));
  }, [comparisonData, mode, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-border/50 text-left">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">{t("reports.comparison.title")}</span>
        </div>
        <div className="flex items-center gap-3">
          {!isContacts && (
            <div className="flex rounded-lg border border-border/50 overflow-hidden text-xs font-semibold">
              <Button
                onClick={() => setMode("sessions")}
                variant={mode === "sessions" ? "default" : "ghost"}
                className={`px-3 py-1.5 h-auto text-xs font-semibold rounded-none ${mode === "sessions" ? "bg-primary text-primary-foreground hover:bg-primary/95" : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                type="button"
              >
                {t("reports.comparison.sessions")}
              </Button>
              <Button
                onClick={() => setMode("daterange")}
                variant={mode === "daterange" ? "default" : "ghost"}
                className={`px-3 py-1.5 h-auto text-xs font-semibold rounded-none ${mode === "daterange" ? "bg-primary text-primary-foreground hover:bg-primary/95" : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                type="button"
              >
                {t("reports.comparison.dateRanges")}
              </Button>
            </div>
          )}
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 rounded-lg hover:bg-muted transition-colors"
            type="button"
            aria-label={t("reports.comparison.closeLabel")}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Selectors */}
        {mode === "sessions" ? (
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { label: "A", value: valA, setValue: setValA, color: "text-primary" },
              { label: "B", value: valB, setValue: setValB, color: "text-warning" }
            ].map(({ label, value, setValue, color }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className={`text-[11px] font-bold uppercase tracking-wide ${color}`}>{isContacts ? t("reports.comparison.stage") : t("reports.comparison.session")} {label}</label>
                <FormSelect
                  value={value}
                  onChange={(newValue) => setValue(newValue)}
                  options={options.map((option) => ({ value: option.id, label: option.name }))}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              { label: t("reports.comparison.rangeA"), range: rangeA, setRange: setRangeA, color: "text-primary" },
              { label: t("reports.comparison.rangeB"), range: rangeB, setRange: setRangeB, color: "text-warning" }
            ].map(({ label, range, setRange, color }) => (
              <div key={label} className="space-y-2">
                <p className={`text-[11px] font-bold uppercase tracking-wide ${color}`}>{label}</p>
                <div className="flex gap-2 items-center">
                  <DatePicker
                    value={range.from}
                    onChange={(value) => setRange((currentRange) => ({ ...currentRange, from: value }))}
                    className="flex-1 text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-1.5"
                  />
                  <DatePicker
                    value={range.to}
                    onChange={(value) => setRange((currentRange) => ({ ...currentRange, to: value }))}
                    className="flex-1 text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-1.5"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm text-left">
          <p className="text-xs text-muted-foreground mb-3">
            {t("reports.comparison.comparing")} <span className="font-semibold text-primary">{labelA}</span> {t("reports.comparison.vs")} <span className="font-semibold text-warning">{labelB}</span>
          </p>
          <div className="h-[220px] w-full">
            <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <BarChart data={translatedData as Array<ComparisonDataItem | DateRangeDataItem>} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey={mode === "sessions" ? "metric" : "month"} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="a" name={labelA} fill={primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="b" name={labelB} fill={secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </SafeResponsiveContainer>
          </div>
        </div>

        {/* Delta table */}
        {mode === "sessions" && (
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t("reports.comparison.metric")}</th>
                  <th className="px-3 py-2 text-left text-[11px] font-bold text-primary uppercase tracking-widest">{isContacts ? t("reports.comparison.targetA") : t("reports.comparison.sessionA")}</th>
                  <th className="px-3 py-2 text-left text-[11px] font-bold text-warning uppercase tracking-widest">{isContacts ? t("reports.comparison.targetB") : t("reports.comparison.sessionB")}</th>
                  <th className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t("reports.comparison.diff")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-left bg-transparent">
                {(translatedData as ComparisonDataItem[]).map((row) => {
                  const diff = parseFloat((row.a - row.b).toFixed(1));
                  
                  const formatVal = (val: number, key?: string) => {
                    if (key === "feeCollected") {
                      return formatCurrency(val);
                    }
                    if (key === "attendancePct" || key === "passRatePct") {
                      return `${val}%`;
                    }
                    return formatNumber(val);
                  };

                  const formatDiff = (d: number, key?: string) => {
                    const sign = d > 0 ? "+" : "";
                    if (key === "feeCollected") {
                      return `${sign}${formatCurrency(d)}`;
                    }
                    if (key === "attendancePct" || key === "passRatePct") {
                      return `${sign}${d}%`;
                    }
                    return `${sign}${formatNumber(d)}`;
                  };


                  return (
                    <tr key={row.metric} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3 font-bold text-foreground">{row.metric}</td>
                      <td className="px-3 py-3 text-primary font-bold">{formatVal(row.a, row.metricKey)}</td>
                      <td className="px-3 py-3 text-warning font-bold">{formatVal(row.b, row.metricKey)}</td>
                      <td className={`px-3 py-3 text-xs font-black ${diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {formatDiff(diff, row.metricKey)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
