import React, { useState, useMemo, useEffect } from "react";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { GitCompare, X } from "lucide-react";
import { DatePicker } from "../ui/DatePicker";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { useContactsReportAnalytics } from '@/hooks/useContacts';
import { computeContactsStageComparison } from '@mms/shared';
import { useSessionsCollection } from '@/hooks/useSessions';
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useAuth } from "@/lib/contexts/AuthContext";
import type { Session } from "@/lib/data/sessionsData";

interface ComparisonDataItem {
  metric: string;
  a: number;
  b: number;
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

/**
 * Comparison data generator for session-to-session metrics (non-contacts categories).
 */
function getSessionCompData(targetA: string, targetB: string): ComparisonDataItem[] {
  return [
    { metric: "Enrollment",   a: targetA === "s1" ? 21 : targetA === "s2" ? 18 : 10, b: targetB === "s1" ? 21 : targetB === "s2" ? 18 : 10 },
    { metric: "Attendance%",  a: targetA === "s1" ? 88 : targetA === "s2" ? 92 : 82, b: targetB === "s1" ? 88 : targetB === "s2" ? 92 : 82 },
    { metric: "Fee Collected",a: targetA === "s1" ? 73500 : targetA === "s2" ? 45000 : 40000, b: targetB === "s1" ? 73500 : targetB === "s2" ? 45000 : 40000 },
    { metric: "Pass Rate%",   a: targetA === "s1" ? 100 : targetA === "s2" ? 100 : 90, b: targetB === "s1" ? 100 : targetB === "s2" ? 100 : 90 },
    { metric: "Hasanat",      a: targetA === "s1" ? 1140 : targetA === "s2" ? 930 : 500, b: targetB === "s1" ? 1140 : targetB === "s2" ? 930 : 500 },
  ];
}

function computeDynamicSessionComparison(
  sessions: Session[],
  enrollments: any[],
  attendanceRecords: any[],
  financeInvoices: any[],
  hasanatDistributions: any[],
  examResults: any[],
  exams: any[],
  denoms: any[],
  targetA: string,
  targetB: string,
): ComparisonDataItem[] {
  const sessA = sessions.find(s => s.id === targetA);
  const sessB = sessions.find(s => s.id === targetB);

  const getMetrics = (session: Session | undefined) => {
    if (!session) {
      return { enrollment: 0, attendancePct: 0, feeCollected: 0, passRatePct: 0, hasanat: 0 };
    }

    const sessId = session.id;
    const sessName = session.name;

    const sessionEnrollments = enrollments.filter(e => e.sessionId === sessId && e.status !== "cancelled");
    const enrollment = sessionEnrollments.length;

    const classIds = new Set(session.classes?.map(c => c.id) || []);
    const sessionAttendance = attendanceRecords.filter(r => classIds.has(r.classId));
    const presentCount = sessionAttendance.filter(r => r.status === "present" || r.status === "late").length;
    const attendancePct = sessionAttendance.length > 0 
      ? Math.round((presentCount / sessionAttendance.length) * 100) 
      : 0;

    const sessionInvoices = financeInvoices.filter(inv => inv.session === sessId || inv.session === sessName);
    let feeCollected = 0;
    sessionInvoices.forEach(inv => {
      if (inv.status === "paid") {
        feeCollected += inv.finalAmt;
      } else if (inv.status === "partial") {
        feeCollected += inv.paidAmt !== undefined ? inv.paidAmt : Math.round(inv.finalAmt / 2);
      }
    });

    const sessionExams = exams.filter(ex => ex.classIds && ex.classIds.some((cid: string) => classIds.has(cid)));
    const sessionExamIds = new Set(sessionExams.map(ex => ex.id));
    const sessionResults = examResults.filter(r => sessionExamIds.has(r.examId));
    let passCount = 0;
    sessionResults.forEach(r => {
      const exam = sessionExams.find(ex => ex.id === r.examId);
      if (exam && r.marksObtained >= exam.passingMarks) {
        passCount++;
      }
    });
    const passRatePct = sessionResults.length > 0
      ? Math.round((passCount / sessionResults.length) * 100)
      : 0;

    const studentIds = new Set(sessionEnrollments.map(e => e.studentId));
    const pointsMap = new Map<string, number>();
    denoms.forEach(d => pointsMap.set(d.id, d.points));
    const getDenomPoints = (denomId: string) => {
      if (pointsMap.has(denomId)) return pointsMap.get(denomId)!;
      if (denomId === "den1") return 50;
      if (denomId === "den2") return 150;
      if (denomId === "den3") return 500;
      if (denomId === "den4") return 1000;
      if (denomId === "den5") return 2500;
      return 0;
    };
    let hasanat = 0;
    hasanatDistributions.forEach(d => {
      if (d.recipientStudentId && studentIds.has(d.recipientStudentId)) {
        hasanat += (d.quantity || 1) * getDenomPoints(d.denominationId);
      }
    });

    return { enrollment, attendancePct, feeCollected, passRatePct, hasanat };
  };

  const metricsA = getMetrics(sessA);
  const metricsB = getMetrics(sessB);

  return [
    { metric: "Enrollment",   a: metricsA.enrollment,     b: metricsB.enrollment },
    { metric: "Attendance%",  a: metricsA.attendancePct,  b: metricsB.attendancePct },
    { metric: "Fee Collected",a: metricsA.feeCollected,   b: metricsB.feeCollected },
    { metric: "Pass Rate%",   a: metricsA.passRatePct,    b: metricsB.passRatePct },
    { metric: "Hasanat",      a: metricsA.hasanat,        b: metricsB.hasanat },
  ];
}

function computeDynamicDateRangeComparison(
  category: string,
  enrollments: any[],
  attendanceRecords: any[],
  financeInvoices: any[],
  hasanatDistributions: any[],
  examResults: any[],
  exams: any[],
  denoms: any[],
  rangeA: DateRange,
  rangeB: DateRange,
): DateRangeDataItem[] {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const inRange = (dateStr: string, start: string, end: string) => {
    if (!dateStr) return false;
    return dateStr >= start && dateStr <= end;
  };

  const getMonthIndex = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? -1 : d.getMonth();
  };

  const bucketA = new Array(12).fill(0);
  const bucketB = new Array(12).fill(0);
  const countA = new Array(12).fill(0);
  const countB = new Array(12).fill(0);

  const lowerCat = category.toLowerCase();

  if (lowerCat === "financial") {
    financeInvoices.forEach(inv => {
      let paid = 0;
      if (inv.status === "paid") {
        paid = inv.finalAmt;
      } else if (inv.status === "partial") {
        paid = inv.paidAmt !== undefined ? inv.paidAmt : Math.round(inv.finalAmt / 2);
      }

      if (inRange(inv.dueDate, rangeA.from, rangeA.to)) {
        const m = getMonthIndex(inv.dueDate);
        if (m >= 0) bucketA[m] += paid;
      }
      if (inRange(inv.dueDate, rangeB.from, rangeB.to)) {
        const m = getMonthIndex(inv.dueDate);
        if (m >= 0) bucketB[m] += paid;
      }
    });
  } else if (lowerCat === "attendance") {
    attendanceRecords.forEach(rec => {
      const isPresent = rec.status === "present" || rec.status === "late";
      const val = isPresent ? 1 : 0;
      if (inRange(rec.date, rangeA.from, rangeA.to)) {
        const m = getMonthIndex(rec.date);
        if (m >= 0) {
          bucketA[m] += val;
          countA[m] += 1;
        }
      }
      if (inRange(rec.date, rangeB.from, rangeB.to)) {
        const m = getMonthIndex(rec.date);
        if (m >= 0) {
          bucketB[m] += val;
          countB[m] += 1;
        }
      }
    });
  } else if (lowerCat === "hasanat") {
    const pointsMap = new Map<string, number>();
    denoms.forEach(d => pointsMap.set(d.id, d.points));
    const getDenomPoints = (denomId: string) => {
      if (pointsMap.has(denomId)) return pointsMap.get(denomId)!;
      if (denomId === "den1") return 50;
      if (denomId === "den2") return 150;
      if (denomId === "den3") return 500;
      if (denomId === "den4") return 1000;
      if (denomId === "den5") return 2500;
      return 0;
    };

    hasanatDistributions.forEach(d => {
      const pts = (d.quantity || 1) * getDenomPoints(d.denominationId);
      if (inRange(d.issuedDate, rangeA.from, rangeA.to)) {
        const m = getMonthIndex(d.issuedDate);
        if (m >= 0) bucketA[m] += pts;
      }
      if (inRange(d.issuedDate, rangeB.from, rangeB.to)) {
        const m = getMonthIndex(d.issuedDate);
        if (m >= 0) bucketB[m] += pts;
      }
    });
  } else if (lowerCat === "students" || lowerCat === "enrollments") {
    enrollments.forEach(e => {
      const date = e.enrolledDate || e.createdDate || rangeA.from;
      if (inRange(date, rangeA.from, rangeA.to)) {
        const m = getMonthIndex(date);
        if (m >= 0) bucketA[m] += 1;
      }
      if (inRange(date, rangeB.from, rangeB.to)) {
        const m = getMonthIndex(date);
        if (m >= 0) bucketB[m] += 1;
      }
    });
  } else if (lowerCat === "examinations" || lowerCat === "academic") {
    const examMap = new Map<string, any>();
    exams.forEach(ex => examMap.set(ex.id, ex));

    examResults.forEach(r => {
      const ex = examMap.get(r.examId);
      if (!ex) return;
      const isPass = r.marksObtained >= ex.passingMarks;
      const val = isPass ? 1 : 0;
      if (inRange(ex.date, rangeA.from, rangeA.to)) {
        const m = getMonthIndex(ex.date);
        if (m >= 0) {
          bucketA[m] += val;
          countA[m] += 1;
        }
      }
      if (inRange(ex.date, rangeB.from, rangeB.to)) {
        const m = getMonthIndex(ex.date);
        if (m >= 0) {
          bucketB[m] += val;
          countB[m] += 1;
        }
      }
    });
  } else {
    return getMockDateRangeData();
  }

  const result: DateRangeDataItem[] = [];
  for (let i = 0; i < 12; i++) {
    const hasData = countA[i] > 0 || countB[i] > 0 || bucketA[i] > 0 || bucketB[i] > 0;
    if (hasData) {
      let valA = bucketA[i];
      let valB = bucketB[i];

      if (lowerCat === "attendance" || lowerCat === "examinations" || lowerCat === "academic") {
        valA = countA[i] > 0 ? Math.round((bucketA[i] / countA[i]) * 100) : 0;
        valB = countB[i] > 0 ? Math.round((bucketB[i] / countB[i]) * 100) : 0;
      }

      result.push({
        month: monthNames[i],
        a: valA,
        b: valB
      });
    }
  }

  if (result.length === 0) {
    const startM = getMonthIndex(rangeA.from);
    const endM = getMonthIndex(rangeA.to);
    const s = startM >= 0 ? startM : 0;
    const e = endM >= 0 ? endM : 2;
    for (let i = s; i <= e; i++) {
      result.push({ month: monthNames[i], a: 0, b: 0 });
    }
  }

  return result;
}

function buildContactsDateRangeComparison(
  monthlyByYear: Array<{ year: number; months: { month: string; count: number }[] }> | undefined,
  rangeA: DateRange,
  rangeB: DateRange,
): DateRangeDataItem[] {
  const yearA = rangeA.from.slice(0, 4);
  const yearB = rangeB.from.slice(0, 4);
  const seriesA = monthlyByYear?.find((entry) => String(entry.year) === yearA)?.months ?? [];
  const seriesB = monthlyByYear?.find((entry) => String(entry.year) === yearB)?.months ?? [];
  return seriesA.map((entry, index) => ({
    month: entry.month,
    a: entry.count,
    b: seriesB[index]?.count ?? 0,
  }));
}

/**
 * Mock comparison data for non-contacts date ranges.
 */
function getMockDateRangeData(): DateRangeDataItem[] {
  return [
    { month: "Jan", a: 18000, b: 15000 },
    { month: "Feb", a: 22000, b: 19000 },
    { month: "Mar", a: 19500, b: 21000 },
    { month: "Apr", a: 25000, b: 22500 },
    { month: "May", a: 28000, b: 26000 },
    { month: "Jun", a: 35000, b: 30000 },
  ];
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
  const { primary, secondary } = useBrandPalette();
  const { fieldConfig } = useContactConfig();
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
    return [yearA, yearB].filter((y) => Number.isFinite(y));
  }, [isContacts, mode, rangeA.from, rangeB.from]);

  const { isAuthenticated } = useAuth();
  const { data: reportData } = useContactsReportAnalytics({
    enabled: isContacts,
    compareYears,
  });
  const sessions = useSessionsCollection();
  const SESSIONS_OPTIONS = useMemo<{id: string, name: string}[]>(() => sessions.filter((s) => s.id !== "all").map(s => ({ id: s.id, name: s.name })), [sessions]);

  const enrollments = useLiveCollection("enrollments");
  const attendanceRecords = useLiveCollection("attendance_records");
  const financeInvoices = useLiveCollection("finance_invoices");
  const hasanatDistributions = useLiveCollection("hasanat_distributions");
  const examResults = useLiveCollection("exam_results");
  const exams = useLiveCollection("exams");
  const denoms = useLiveCollection("hasanat_denoms");

  const LIFECYCLE_OPTIONS = useMemo(() => {
    const field = (fieldConfig.fields?.basic || []).find((f) => f.key === "lifecycleStage");
    const opts = field?.options || ["Lead", "Active Student", "Alumnus", "Staff", "Donor", "Volunteer", "Parent"];
    return opts.map(opt => ({ id: opt, name: opt }));
  }, [fieldConfig]);

  // Sync targets when category changes
  useEffect(() => {
    if (isContacts) {
      setValA("Lead");
      setValB("Active Student");
    } else {
      setValA("s1");
      setValB("s2");
    }
  }, [category, isContacts]);

  const options = isContacts ? LIFECYCLE_OPTIONS : SESSIONS_OPTIONS;
  const labelA = mode === "sessions" ? options.find((s) => s.id === valA)?.name : `${rangeA.from} → ${rangeA.to}`;
  const labelB = mode === "sessions" ? options.find((s) => s.id === valB)?.name : `${rangeB.from} → ${rangeB.to}`;

  const data = useMemo(() => {
    if (mode === "sessions") {
      if (isContacts) {
        if (reportData?.analytics) {
          return computeContactsStageComparison(reportData.analytics, valA, valB);
        }
        return [];
      }
      if (isAuthenticated) {
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
        );
      }
      return getSessionCompData(valA, valB);
    }
    if (isContacts) {
      return buildContactsDateRangeComparison(reportData?.monthlyByYear, rangeA, rangeB);
    }
    if (isAuthenticated) {
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
    }
    return getMockDateRangeData();
  }, [
    mode,
    isContacts,
    reportData,
    valA,
    valB,
    rangeA,
    rangeB,
    isAuthenticated,
    sessions,
    enrollments,
    attendanceRecords,
    financeInvoices,
    hasanatDistributions,
    examResults,
    exams,
    denoms,
    category,
  ]);

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
          <span className="text-sm font-bold text-foreground">Comparison Mode</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border/50 overflow-hidden text-xs font-semibold">
            <button onClick={() => setMode("sessions")} className={`px-3 py-1.5 transition-colors ${mode === "sessions" ? "bg-primary text-primary-foreground" : "bg-card/50 backdrop-blur-md text-muted-foreground hover:text-foreground"}`} type="button">
              {isContacts ? "Stages" : "Sessions"}
            </button>
            <button onClick={() => setMode("daterange")} className={`px-3 py-1.5 transition-colors ${mode === "daterange" ? "bg-primary text-primary-foreground" : "bg-card/50 backdrop-blur-md text-muted-foreground hover:text-foreground"}`} type="button">Date Ranges</button>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors" type="button" aria-label="Close comparison">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Selectors */}
        {mode === "sessions" ? (
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { label: "A", val: valA, set: setValA, color: "text-primary" },
              { label: "B", val: valB, set: setValB, color: "text-warning" }
            ].map(({ label, val, set, color }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className={`text-[11px] font-bold uppercase tracking-wide ${color}`}>{isContacts ? "Stage" : "Session"} {label}</label>
                <select value={val} onChange={(e) => set(e.target.value)} className="text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {options.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              { label: "Range A", range: rangeA, set: setRangeA, color: "text-primary" },
              { label: "Range B", range: rangeB, set: setRangeB, color: "text-warning" }
            ].map(({ label, range, set, color }) => (
              <div key={label} className="space-y-2">
                <p className={`text-[11px] font-bold uppercase tracking-wide ${color}`}>{label}</p>
                <div className="flex gap-2 items-center">
                  <DatePicker
                    value={range.from}
                    onChange={(val) => set((r) => ({ ...r, from: val }))}
                    className="flex-1 text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-1.5"
                  />
                  <DatePicker
                    value={range.to}
                    onChange={(val) => set((r) => ({ ...r, to: val }))}
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
            Comparing: <span className="font-semibold text-primary">{labelA}</span> vs <span className="font-semibold text-warning">{labelB}</span>
          </p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <BarChart data={data as Array<ComparisonDataItem | DateRangeDataItem>} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey={mode === "sessions" ? "metric" : "month"} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="a" name={labelA} fill={primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="b" name={labelB} fill={secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delta table */}
        {mode === "sessions" && (
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Metric</th>
                  <th className="px-3 py-2 text-left text-[11px] font-bold text-primary uppercase tracking-widest">{isContacts ? "Target A" : "Session A"}</th>
                  <th className="px-3 py-2 text-left text-[11px] font-bold text-warning uppercase tracking-widest">{isContacts ? "Target B" : "Session B"}</th>
                  <th className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Δ Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-left bg-transparent">
                {(data as ComparisonDataItem[]).map((row) => {
                  const diff = parseFloat((row.a - row.b).toFixed(1));
                  return (
                    <tr key={row.metric} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3 font-bold text-foreground">{row.metric}</td>
                      <td className="px-3 py-3 text-primary font-bold">{row.a.toLocaleString()}</td>
                      <td className="px-3 py-3 text-warning font-bold">{row.b.toLocaleString()}</td>
                      <td className={`px-3 py-3 text-xs font-black ${diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {diff > 0 ? "+" : ""}{diff.toLocaleString()}
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
