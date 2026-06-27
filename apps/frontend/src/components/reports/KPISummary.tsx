import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserCheck, DollarSign, TrendingUp, Star, 
  AlertCircle, GraduationCap, BarChart2, LucideIcon, 
  Target, Zap, Activity, SlidersHorizontal,
  Plus, Trash2, ShieldCheck, Receipt, CalendarCheck
} from "lucide-react";
import { useFinanceInvoicesCollection } from "@/hooks/useFinanceApi";
import { useExaminationsExamsCollection, useExaminationsResultsCollection } from "@/hooks/useExaminationsApi";
import { useHasanatDistributionsCollection, useHasanatDenomsCollection } from "@/hooks/useHasanatApi";
import {
  useQuestionBankQuestionsCollection,
  useQuestionBankTestsCollection,
  useQuestionBankResultsCollection,
} from "@/hooks/useQuestionBankApi";
import { getObject, saveObject } from "../../lib/db";
import { useContactsReportAnalytics, useContactsWidgetAggregates } from "@/hooks/useContacts";
import { useStudentsMetrics, useStudentsWidgetAggregates } from "../../hooks/useStudents";
import { useTeachersMetrics, useTeachersWidgetAggregates } from "../../hooks/useTeachers";
import { useAttendanceRecordsCollection } from "@/hooks/useAttendance";
import { useSessionsCollection } from "@/hooks/useSessions";
import { type Contact } from "@mms/shared";
import { type AttendanceRecord } from '@/lib/data/attendanceData';
import { type Invoice } from '@/lib/data/financeData';
import { type Student } from '@/lib/data/studentsData';
import { type Teacher } from '@/lib/data/teachersData';
import { type Session } from '@/lib/data/sessionsData';
import { type Distribution } from '@/lib/data/hasanatData';
import type { QuestionBankQuestion, QuestionBankResult, QuestionBankTest } from "@mms/shared";
import { computeCustomCard as computeCustomCardShared, CustomCard } from "./reportMetadata";
import DynamicCardBuilder from "./DynamicCardBuilder";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";

interface KPIItem {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  color: "primary" | "green" | "blue" | "red" | "amber" | "violet";
  trend: "up" | "down" | "flat";
  velocity?: string;
  isAvailable: boolean;
}

function areStringListsEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function areCustomCardsEqual(left: CustomCard[], right: CustomCard[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function formatAggregateCardValue(
  card: CustomCard,
  aggregate: { value: number; totalCount: number },
): { finalValue: string | number; totalCount: number } {
  return {
    finalValue: card.operation === "percentage" ? `${aggregate.value}%` : aggregate.value,
    totalCount: aggregate.totalCount,
  };
}

interface ColorScheme {
  bg: string;
  text: string;
}

const COLOR: Record<string, ColorScheme> = {
  primary: { bg: "bg-primary/10",   text: "text-primary"     },
  green:   { bg: "bg-success/10",   text: "text-success" },
  emerald: { bg: "bg-success/10",   text: "text-success" },
  blue:    { bg: "bg-info/10",      text: "text-info"    },
  red:     { bg: "bg-destructive/10",       text: "text-destructive"     },
  amber:   { bg: "bg-warning/10",     text: "text-warning"   },
  violet:  { bg: "bg-primary/10",    text: "text-primary"  },
};

interface TrendScheme {
  cls: string;
  arrow: string;
}

const TREND: Record<string, TrendScheme> = {
  up:   { cls: "text-success", arrow: "↑" },
  down: { cls: "text-destructive",     arrow: "↓" },
  flat: { cls: "text-muted-foreground", arrow: "→" },
};

// ---------------------------------------------------------------------------
// SubtextDisplay: defined outside KPISummary to prevent per-render recreation
// (inline component definitions inside .map() cause React to remount on every
// render, which triggers Radix ref callbacks → setState → infinite loop).
// ---------------------------------------------------------------------------
function SubtextDisplay({ text }: { text: string }): React.JSX.Element {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 30;
  if (!isLong) return <span className="truncate block font-semibold">{text}</span>;
  return (
    <span className="block leading-normal font-semibold whitespace-normal break-words">
      {expanded ? text : `${text.slice(0, 30)}...`}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
        className="ml-1 text-primary hover:underline font-extrabold inline-block cursor-pointer bg-transparent border-0 p-0 text-[9px]"
      >
        {expanded ? t("common.showLess") : t("common.readMore")}
      </button>
    </span>
  );
}



interface KPISummaryProps {
  category: string;
  role?: string;
}

/**
 * KPISummary component displays a row of KPI card metrics with trend indicators.
 * Filtered by both user role and module category.
 *
 * @param props - Component props.
 * @returns React.JSX.Element
 */
// CustomCard interface imported from reportMetadata

const ICONS: Record<string, React.ElementType> = {
  Users, UserCheck, DollarSign, TrendingUp, Star, 
  AlertCircle, GraduationCap, BarChart2, Target, Zap, Activity,
  CalendarCheck, Receipt, ShieldCheck
};

/**
 * Computes the value of a custom card.
 */
function computeCustomCard(
  card: CustomCard,
  collections: {
    students: Student[];
    teachers: Teacher[];
    sessions: Session[];
    finance_invoices: Invoice[];
    attendance_records: AttendanceRecord[];
    hasanat_distributions: Distribution[];
    contacts: Contact[];
    questions: QuestionBankQuestion[];
    tests: QuestionBankTest[];
    assessment_results: QuestionBankResult[];
    hasanat_denoms?: any[];
  }
): KPIItem & { categories: string[] } {
  const result = computeCustomCardShared(card, collections);
  return {
    label: result.title,
    value: String(result.value),
    sub: result.sub,
    icon: (ICONS[result.icon] || BarChart2) as LucideIcon,
    color: (result.color === "emerald" ? "green" : result.color) as KPIItem["color"],
    trend: "flat" as const,
    isAvailable: true,
    categories: [] as string[]
  };
}

/**
 * Resolves the configuration of a pre-built card by category and label.
 */
function getDefaultCardConfig(category: string, label: string): CustomCard {
  const id = `default-${label.toLowerCase().replace(/\s+/g, "-")}`;
  
  const config: CustomCard = {
    id,
    title: label,
    collection: "students",
    operation: "count",
    filterField: "status",
    filterOperator: "equals",
    filterValue: "active",
    icon: "GraduationCap",
    color: "emerald",
    subTextType: "dynamic",
    fixedSubText: ""
  };

  switch (label) {
    case "Total Students":
      if (category === "contacts") {
        config.collection = "contacts";
        config.filterField = "";
        config.icon = "Users";
        config.color = "blue";
      } else {
        config.collection = "students";
        config.filterField = "status";
        config.filterValue = "active";
        config.icon = "GraduationCap";
        config.color = "emerald";
      }
      break;
    case "Avg Attendance":
      config.collection = "attendance_records";
      config.operation = "percentage";
      config.filterField = "status";
      config.filterOperator = "equals";
      config.filterValue = "present";
      config.icon = "UserCheck";
      config.color = "emerald";
      break;
    case "Fee Collected":
      config.collection = "finance_invoices";
      config.operation = "sum";
      config.targetField = "finalAmt";
      config.filterField = "status";
      config.filterOperator = "equals";
      config.filterValue = "paid";
      config.icon = "DollarSign";
      config.color = "blue";
      break;
    case "Outstanding":
      config.collection = "finance_invoices";
      config.operation = "sum";
      config.targetField = "finalAmt";
      config.filterField = "status";
      config.filterOperator = "equals";
      config.filterValue = "unpaid";
      config.icon = "AlertCircle";
      config.color = "red";
      break;
    case "Hasanat Awarded":
      config.collection = "hasanat_distributions";
      config.operation = "sum";
      config.targetField = "points";
      config.filterField = "";
      config.icon = "Star";
      config.color = "amber";
      break;
    case "Pass Rate":
      config.collection = "students";
      config.operation = "percentage";
      config.filterField = "status";
      config.filterOperator = "equals";
      config.filterValue = "active";
      config.icon = "GraduationCap";
      config.color = "violet";
      break;
    case "Capacity Used":
      config.collection = "sessions";
      config.operation = "percentage";
      config.filterField = "status";
      config.filterOperator = "equals";
      config.filterValue = "active";
      config.icon = "BarChart2";
      config.color = "blue";
      break;
    case "Growth Rate":
      config.collection = "contacts";
      config.operation = "count";
      config.filterField = "";
      config.icon = "TrendingUp";
      config.color = "emerald";
      break;
    case "Lead Conversion":
      config.collection = "contacts";
      config.operation = "percentage";
      config.filterField = "lifecycleStage";
      config.filterOperator = "equals";
      config.filterValue = "Lead";
      config.icon = "Target";
      config.color = "violet";
      break;
    case "Active Enquiries":
      config.collection = "contacts";
      config.operation = "count";
      config.filterField = "lifecycleStage";
      config.filterOperator = "equals";
      config.filterValue = "Lead";
      config.icon = "Zap";
      config.color = "amber";
      break;
    case "Engagement Index":
      config.collection = "contacts";
      config.operation = "avg";
      config.targetField = "rating";
      config.filterField = "";
      config.icon = "Activity";
      config.color = "emerald";
      break;
  }

  return config;
}

export default function KPISummary({ category, role }: KPISummaryProps): React.JSX.Element {
  const { can } = usePermissions();
  const { t } = useTranslation();
  const isContactsCategory = category === "contacts";
  const isStudentsCategory = category === "students";
  const isTeachersCategory = category === "teachers" || category === "faculty";
  const needsContactAnalytics = isContactsCategory || category === "students" || category === "sessions";
  const { data: contactsReportData } = useContactsReportAnalytics({ enabled: needsContactAnalytics });
  const { data: studentMetrics } = useStudentsMetrics({ enabled: isStudentsCategory || category === "enrollments" });
  const { data: teacherMetrics } = useTeachersMetrics({ enabled: isTeachersCategory || category === "enrollments" });
  const { data: crossStudentMetrics } = useStudentsMetrics({
    enabled: !isStudentsCategory && !isContactsCategory && !isTeachersCategory && category !== "enrollments",
  });
  const { data: crossTeacherMetrics } = useTeachersMetrics({ enabled: !isTeachersCategory && category !== "enrollments" });
  const contactAnalytics = contactsReportData?.analytics;
  const auxiliaryStudentMetrics = category === "enrollments" ? studentMetrics : crossStudentMetrics;
  const auxiliaryTeacherMetrics = category === "enrollments" ? teacherMetrics : crossTeacherMetrics;
  const records = useAttendanceRecordsCollection();
  const invoices = useFinanceInvoicesCollection();
  const exams = useExaminationsExamsCollection();
  const examResults = useExaminationsResultsCollection();
  const sessions = useSessionsCollection();
  const distributions = useHasanatDistributionsCollection();
  const denoms = useHasanatDenomsCollection();
  const qbQuestions = useQuestionBankQuestionsCollection();
  const qbTests = useQuestionBankTestsCollection();
  const qbResults = useQuestionBankResultsCollection();

  const computedKPIs = useMemo(() => {
    // 1. Total Students
    let totalStudentsVal = "0";
    let totalStudentsSub = "No students";
    let totalStudentsTrend: "up" | "down" | "flat" = "flat";
    let totalStudentsVelocity = undefined;

    if (category === "contacts" && contactAnalytics) {
      totalStudentsVal = String(contactAnalytics.total);
      totalStudentsSub = `${contactAnalytics.newLast30Days} new recently`;
      totalStudentsTrend = contactAnalytics.newLast30Days >= contactAnalytics.newPrior30Days ? "up" : "down";
      totalStudentsVelocity =
        contactAnalytics.newPrior30Days > 0
          ? `${Math.round(((contactAnalytics.newLast30Days - contactAnalytics.newPrior30Days) / contactAnalytics.newPrior30Days) * 100)}%`
          : `+${contactAnalytics.newLast30Days}`;
    } else if (category === "contacts") {
      totalStudentsVal = "0";
      totalStudentsSub = "No contacts";
    } else if (isStudentsCategory && studentMetrics) {
      totalStudentsVal = String(studentMetrics.total);
      totalStudentsSub = `${studentMetrics.active} active now`;
      totalStudentsTrend = studentMetrics.newThisPeriod > 0 ? "up" : "flat";
    } else {
      const metrics = category === "enrollments" ? studentMetrics : crossStudentMetrics;
      totalStudentsVal = String(metrics?.total ?? 0);
      totalStudentsSub = `${metrics?.active ?? 0} active now`;
      totalStudentsTrend = (metrics?.newThisPeriod ?? 0) > 0 ? "up" : "flat";
    }

    // 2. Avg Attendance
    const present = records.filter(r => r.status === "present" || r.status === "late").length;
    const attRate = records.length > 0 ? Math.round((present / records.length) * 100) : 0;
    const avgAttendanceVal = `${attRate}%`;
    const avgAttendanceTrend = attRate > 85 ? "up" : "flat";

    // 3. Fee Collected
    const collected = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.finalAmt, 0);
    const feeCollectedVal = `PKR ${(collected/1000).toFixed(1)}k`;

    // 4. Outstanding
    const outstanding = invoices.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((sum, i) => sum + (i.finalAmt - (i.paidAmt || 0)), 0);
    const outstandingCount = invoices.filter(i => i.status !== "paid" && i.status !== "cancelled").length;
    const outstandingVal = `PKR ${(outstanding/1000).toFixed(1)}k`;
    const outstandingSub = `${outstandingCount} invoices`;

    // 5. Hasanat Awarded
    const totalHasanat = distributions.reduce((sum, dist) => {
      const denomName = (dist.denominationName || "").toLowerCase();
      const matchedDenom = denoms.find((d: any) => d.id === dist.denominationId);
      const points = matchedDenom ? matchedDenom.points : (
        denomName.includes("silver") ? 150 :
        denomName.includes("gold") ? 500 :
        denomName.includes("platinum") ? 1000 :
        denomName.includes("diamond") ? 2500 : 50
      );
      return sum + (dist.quantity || 1) * points;
    }, 0);
    const hasanatVal = totalHasanat.toLocaleString();

    // 6. Pass Rate
    let passesCount = 0;
    let totalResultsCount = 0;
    examResults.forEach(res => {
      const exam = exams.find(e => e.id === res.examId);
      if (exam) {
        totalResultsCount++;
        if (res.marksObtained >= exam.passingMarks) {
          passesCount++;
        }
      }
    });
    const passRate = totalResultsCount > 0 ? Math.round((passesCount / totalResultsCount) * 100) : 0;
    const passRateVal = `${passRate}%`;

    // Question bank metrics
    const qbQuestionCount = qbQuestions.length;
    const qbTestCount = qbTests.length;
    const qbSubmissionCount = qbResults.length;
    let qbTotalObtained = 0;
    let qbTotalMax = 0;
    qbResults.forEach((res: QuestionBankResult) => {
      const test = qbTests.find((t: QuestionBankTest) => t.id === res.testId);
      if (!test) return;
      const obtained = Object.values(res.scores).reduce((sum: number, v) => sum + (v as number), 0);
      const max = test.questionIds.reduce((sum: number, qid: string) => {
        const q = qbQuestions.find((item: QuestionBankQuestion) => item.id === qid);
        return sum + (q?.marks ?? 0);
      }, 0);
      qbTotalObtained += obtained;
      qbTotalMax += max;
    });
    const qbAvgScoreVal =
      qbTotalMax > 0 ? `${Math.round((qbTotalObtained / qbTotalMax) * 100)}%` : "0%";

    // 7. Capacity Used
    const activeSessionsList = sessions.filter(s => s.status === "active");
    const classesList = activeSessionsList.flatMap(s => s.classes || []);
    const enrolledSum = classesList.reduce((sum, c) => sum + (c.enrolled || 0), 0);
    const capacitySum = classesList.reduce((sum, c) => sum + (c.capacity || 0), 0);
    const capacityUsed = capacitySum > 0 ? Math.round((enrolledSum / capacitySum) * 100) : 0;
    const capacityVal = `${capacityUsed}%`;
    const capacitySub = `Across ${classesList.length} classes`;

    // 8. Growth Rate
    let growthVal = "+0%";
    let growthTrend: "up" | "down" | "flat" = "flat";
    let growthSub = "No signup dates";
    if (needsContactAnalytics && contactAnalytics?.hasSignupDates) {
      const recentSignups = contactAnalytics.growthRecentSignups30d;
      const priorSignups = contactAnalytics.growthPriorSignups30d;
      if (priorSignups === 0) {
        growthVal = recentSignups > 0 ? `+${recentSignups * 100}%` : "0%";
        growthTrend = recentSignups > 0 ? "up" : "flat";
        growthSub = `+${recentSignups} new (last 30d)`;
      } else {
        const pct = Math.round(((recentSignups - priorSignups) / priorSignups) * 100);
        growthVal = `${pct >= 0 ? "+" : ""}${pct}%`;
        growthTrend = pct > 0 ? "up" : (pct < 0 ? "down" : "flat");
        growthSub = `${recentSignups} vs ${priorSignups} (prev 30d)`;
      }
    } else if (needsContactAnalytics && contactAnalytics) {
      growthSub = "No signup dates";
    }

    // 9. Lead Conversion
    const conversionVal =
      contactAnalytics
        ? `${contactAnalytics.conversionRate}%`
        : "0%";

    // 10. Active Enquiries
    const enquiriesVal = contactAnalytics
      ? String(contactAnalytics.enquiriesCount)
      : "0";
    const recentEnquiries = contactAnalytics?.recentEnquiries7d ?? 0;
    const enquiriesSub = t("reports.contacts.kpi.activeEnquiriesSub", { count: recentEnquiries });

    // 11. Engagement Index
    const engagementVal = contactAnalytics?.engagementIndex ?? "0.0";
    const contactsRecent30 = contactAnalytics?.newThisPeriod ?? 0;

    const items: (KPIItem & { categories: string[] })[] = [
      {
        icon: Users,
        label: "Total Students",
        value: totalStudentsVal,
        sub: totalStudentsSub,
        color: "primary",
        trend: totalStudentsTrend,
        velocity: totalStudentsVelocity,
        categories: ["students", "enrollments"],
        isAvailable: category === "contacts"
          ? (contactAnalytics?.total ?? 0) > 0
          : isStudentsCategory
            ? (studentMetrics?.total ?? 0) > 0
            : (auxiliaryStudentMetrics?.total ?? 0) > 0
      },
      {
        icon: UserCheck,
        label: "Avg Attendance",
        value: avgAttendanceVal,
        sub: "Last 30 days",
        color: "green",
        trend: avgAttendanceTrend,
        categories: ["attendance"],
        isAvailable: records.length > 0
      },
      {
        icon: DollarSign,
        label: "Fee Collected",
        value: feeCollectedVal,
        sub: "All-time total",
        color: "blue",
        trend: "up",
        categories: ["financial", "accounting"],
        isAvailable: invoices.some(i => i.status === "paid")
      },
      {
        icon: AlertCircle,
        label: "Outstanding",
        value: outstandingVal,
        sub: outstandingSub,
        color: "red",
        trend: "down",
        categories: ["financial", "accounting"],
        isAvailable: invoices.some(i => i.status !== "paid" && i.status !== "cancelled")
      },
      {
        icon: Star,
        label: "Hasanat Awarded",
        value: hasanatVal,
        sub: "All students",
        color: "amber",
        trend: "up",
        categories: ["hasanat"],
        isAvailable: distributions.length > 0
      },
      {
        icon: GraduationCap,
        label: "Pass Rate",
        value: passRateVal,
        sub: "Last exam cycle",
        color: "violet",
        trend: "flat",
        categories: ["examinations", "students"],
        isAvailable: examResults.length > 0 && exams.length > 0
      },
      {
        icon: BarChart2,
        label: "Capacity Used",
        value: capacityVal,
        sub: capacitySub,
        color: "primary",
        trend: "up",
        categories: ["sessions", "enrollments"],
        isAvailable: sessions.length > 0
      },
      {
        icon: TrendingUp,
        label: "Growth Rate",
        value: growthVal,
        sub: growthSub,
        color: "green",
        trend: growthTrend,
        categories: ["students", "sessions"],
        isAvailable: needsContactAnalytics ? Boolean(contactAnalytics?.hasSignupDates) : false
      },
      {
        icon: Target,
        label: t("reports.contacts.kpi.leadConversion"),
        value: conversionVal,
        sub: t("reports.contacts.kpi.leadConversionSub"),
        color: "violet",
        trend: "up",
        categories: ["contacts"],
        isAvailable: (contactAnalytics?.total ?? 0) > 0
      },
      {
        icon: Zap,
        label: t("reports.contacts.kpi.activeEnquiries"),
        value: enquiriesVal,
        sub: enquiriesSub,
        color: "amber",
        trend: "up",
        categories: ["contacts"],
        isAvailable: (contactAnalytics?.enquiriesCount ?? 0) > 0
      },
      {
        icon: Activity,
        label: t("reports.contacts.kpi.engagementIndex"),
        value: engagementVal,
        sub: t("reports.contacts.kpi.engagementSub"),
        color: "green",
        trend: "flat",
        categories: ["contacts"],
        isAvailable: (contactAnalytics?.ratedCount ?? 0) > 0
      },
      {
        icon: Users,
        label: t("reports.contacts.kpi.totalContacts"),
        value: contactAnalytics ? String(contactAnalytics.total) : "0",
        sub: t("reports.contacts.kpi.newRecently", { count: contactsRecent30 }),
        color: "primary",
        trend: contactsRecent30 > 0 ? "up" : "flat",
        categories: ["contacts"],
        isAvailable: (contactAnalytics?.total ?? 0) > 0
      },
      {
        icon: BarChart2,
        label: "Total Questions",
        value: String(qbQuestionCount),
        sub: "In question bank",
        color: "primary",
        trend: "up",
        categories: ["questionBank"],
        isAvailable: qbQuestionCount > 0,
      },
      {
        icon: CalendarCheck,
        label: "Generated Tests",
        value: String(qbTestCount),
        sub: "Auto-built papers",
        color: "blue",
        trend: "flat",
        categories: ["questionBank"],
        isAvailable: qbTestCount > 0,
      },
      {
        icon: UserCheck,
        label: "Test Submissions",
        value: String(qbSubmissionCount),
        sub: "Graded attempts",
        color: "violet",
        trend: "up",
        categories: ["questionBank"],
        isAvailable: qbSubmissionCount > 0,
      },
      {
        icon: Target,
        label: "Avg Test Score",
        value: qbAvgScoreVal,
        sub: "Across submissions",
        color: "green",
        trend: "flat",
        categories: ["questionBank"],
        isAvailable: qbSubmissionCount > 0 && qbTotalMax > 0,
      },
      {
        icon: GraduationCap,
        label: "Total Faculty",
        value: String(isTeachersCategory ? (teacherMetrics?.total ?? 0) : (auxiliaryTeacherMetrics?.total ?? 0)),
        sub: `${isTeachersCategory ? (teacherMetrics?.active ?? 0) : (auxiliaryTeacherMetrics?.active ?? 0)} active`,
        color: "primary",
        trend: "flat",
        categories: ["teachers", "faculty"],
        isAvailable: isTeachersCategory
          ? (teacherMetrics?.total ?? 0) > 0
          : (auxiliaryTeacherMetrics?.total ?? 0) > 0,
      },
      {
        icon: Activity,
        label: "On Leave",
        value: String(isTeachersCategory ? (teacherMetrics?.onLeave ?? 0) : (auxiliaryTeacherMetrics?.onLeave ?? 0)),
        sub: "Faculty currently on leave",
        color: "amber",
        trend: "flat",
        categories: ["teachers", "faculty"],
        isAvailable: isTeachersCategory
          ? (teacherMetrics?.onLeave ?? 0) > 0
          : (auxiliaryTeacherMetrics?.onLeave ?? 0) > 0,
      },
    ];

    return items;
  }, [contactAnalytics, records, invoices, exams, examResults, sessions, distributions, qbQuestions, qbTests, qbResults, category, studentMetrics, isStudentsCategory, teacherMetrics, isTeachersCategory, auxiliaryStudentMetrics, auxiliaryTeacherMetrics, needsContactAnalytics, t]);

  // Determine standard possible cards for this category and user role
  const standardPossibleCards = useMemo(() => {
    return computedKPIs.filter((k) => {
      const isInCategory = k.categories.includes(category);
      if (!isInCategory) return false;

      if (can("attendance.write") && !can("finance.write")) {
        return ["Total Students", "Avg Attendance", "Hasanat Awarded", "Capacity Used"].includes(k.label);
      }
      if (can("finance.write") && !can("attendance.write")) {
        return ["Fee Collected", "Outstanding", "Growth Rate"].includes(k.label);
      }
      return true;
    });
  }, [computedKPIs, category, can]);

  // Load custom cards for this category
  const [customCards, setCustomCards] = useState<CustomCard[]>(() => {
    return getObject<CustomCard[]>(`kpi_custom_cards_${category}`, []);
  });

  const customCardWidgetInputs = useMemo(() => {
    return customCards.map((card) => ({
      id: card.id,
      collection: card.collection,
      operation: card.operation,
      targetField: card.targetField,
      filterField: card.filterField,
      filterOperator: card.filterOperator,
      filterValue: card.filterValue,
    }));
  }, [customCards]);

  const hasContactCustomCards = customCards.some((card) => card.collection === "contacts");
  const hasStudentCustomCards = customCards.some((card) => card.collection === "students");
  const hasTeacherCustomCards = customCards.some((card) => card.collection === "teachers");

  const { data: contactWidgetAggregates } = useContactsWidgetAggregates(
    customCardWidgetInputs,
    { enabled: isContactsCategory && hasContactCustomCards },
  );

  const { data: studentWidgetAggregates } = useStudentsWidgetAggregates(
    customCardWidgetInputs,
    { enabled: isStudentsCategory && hasStudentCustomCards },
  );

  const { data: teacherWidgetAggregates } = useTeachersWidgetAggregates(
    customCardWidgetInputs,
    { enabled: isTeachersCategory && hasTeacherCustomCards },
  );

  const defaultCollection = useMemo<CustomCard["collection"]>(() => {
    if (category === "students") return "students";
    if (category === "contacts") return "contacts";
    if (category === "attendance") return "attendance_records";
    if (category === "financial" || category === "accounting") return "finance_invoices";
    if (category === "hasanat") return "hasanat_distributions";
    if (category === "sessions") return "sessions";
    if (category === "examinations" || category === "enrollments") return "students";
    if (category === "questionBank") return "questions";
    if (category === "teachers" || category === "faculty") return "teachers";
    return "students";
  }, [category]);

  // Card builder form state
  const [editingCardConfig, setEditingCardConfig] = useState<CustomCard | null>(null);

  // Sync custom cards from localStorage when updated elsewhere
  useEffect(() => {
    const handleUpdate = () => {
      const nextCards = getObject<CustomCard[]>(`kpi_custom_cards_${category}`, []);
      setCustomCards((prev) => areCustomCardsEqual(prev, nextCards) ? prev : nextCards);
    };
    window.addEventListener("local-database-update", handleUpdate);
    return () => window.removeEventListener("local-database-update", handleUpdate);
  }, [category]);

  // Sync default collection on category change
  useEffect(() => {
    setEditingCardConfig(null);
  }, [category]);

  // Compute custom KPI items
  const computedCustomKPIs = useMemo(() => {
    return customCards.map((card) => {
      if (card.collection === "contacts") {
        const aggregate = contactWidgetAggregates?.[card.id];
        if (aggregate) {
          const aggregateValue = formatAggregateCardValue(card, aggregate);
          return {
            label: card.title,
            value: String(aggregateValue.finalValue),
            sub: card.fixedSubText || `${aggregateValue.totalCount} total`,
            icon: (ICONS[card.icon] || Users) as LucideIcon,
            color: (card.color === "emerald" ? "green" : card.color) as KPIItem["color"],
            trend: "flat" as const,
            isAvailable: aggregateValue.totalCount > 0,
            categories: [category],
          };
        }
      }
      if (card.collection === "students") {
        const aggregate = studentWidgetAggregates?.[card.id];
        if (aggregate) {
          const aggregateValue = formatAggregateCardValue(card, aggregate);
          return {
            label: card.title,
            value: String(aggregateValue.finalValue),
            sub: card.fixedSubText || `${aggregateValue.totalCount} total`,
            icon: (ICONS[card.icon] || Users) as LucideIcon,
            color: (card.color === "emerald" ? "green" : card.color) as KPIItem["color"],
            trend: "flat" as const,
            isAvailable: aggregateValue.totalCount > 0,
            categories: [category],
          };
        }
      }
      if (card.collection === "teachers") {
        const aggregate = teacherWidgetAggregates?.[card.id];
        if (aggregate) {
          const aggregateValue = formatAggregateCardValue(card, aggregate);
          return {
            label: card.title,
            value: String(aggregateValue.finalValue),
            sub: card.fixedSubText || `${aggregateValue.totalCount} total`,
            icon: (ICONS[card.icon] || Users) as LucideIcon,
            color: (card.color === "emerald" ? "green" : card.color) as KPIItem["color"],
            trend: "flat" as const,
            isAvailable: aggregateValue.totalCount > 0,
            categories: [category],
          };
        }
      }
      return computeCustomCard(card, {
        students: [],
        teachers: [],
        sessions,
        finance_invoices: invoices,
        attendance_records: records,
        hasanat_distributions: distributions,
        hasanat_denoms: denoms,
        contacts: [],
        questions: qbQuestions,
        tests: qbTests,
        assessment_results: qbResults,
      });
    });
  }, [
    customCards,
    category,
    contactWidgetAggregates,
    studentWidgetAggregates,
    teacherWidgetAggregates,
    sessions,
    invoices,
    records,
    distributions,
    qbQuestions,
    qbTests,
    qbResults,
  ]);

  // Merge standard and custom possible cards, preventing duplicates if standard label is overridden
  const possibleCards = useMemo(() => {
    const customLabels = computedCustomKPIs.map(c => c.label);
    const uniqueStandard = standardPossibleCards.filter(s => !customLabels.includes(s.label));
    return [...uniqueStandard, ...computedCustomKPIs];
  }, [standardPossibleCards, computedCustomKPIs]);

  const availableCardLabelsKey = useMemo(() => {
    return possibleCards
      .filter((card) => card.isAvailable)
      .map((card) => card.label)
      .join("\u0000");
  }, [possibleCards]);

  // Primary volume counts for the dynamic limit formula
  const primaryVolume = useMemo(() => {
    switch (category) {
      case "students": return studentMetrics?.total ?? 0;
      case "contacts": return contactAnalytics?.total ?? 0;
      case "attendance": return records.length;
      case "financial":
      case "accounting":
        return invoices.length;
      case "hasanat": return distributions.length;
      case "sessions": return sessions.length;
      case "examinations":
        return examResults.length + exams.length;
      case "questionBank":
        return qbQuestions.length + qbTests.length + qbResults.length;
      case "enrollments":
        return (studentMetrics?.total ?? 0) + sessions.length;
      case "teachers":
      case "faculty":
        return teacherMetrics?.total ?? 0;
      default:
        return 0;
    }
  }, [category, contactAnalytics, studentMetrics, teacherMetrics, records, invoices, distributions, examResults, exams, sessions, qbQuestions, qbTests, qbResults]);

  // User-configurable active visibility controls state
  const [selectedLabels, setSelectedLabels] = useState<string[]>(() => {
    return getObject<string[]>(`kpi_config_${category}_${role || "all"}`, []);
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Validate user selections reactively against database changes
  useEffect(() => {
    const availableLabels = availableCardLabelsKey ? availableCardLabelsKey.split("\u0000") : [];
    let updated = selectedLabels.filter((label) => availableLabels.includes(label));

    // Default to all available cards if no active selection is stored
    if (updated.length === 0 && availableLabels.length > 0) {
      updated = availableLabels;
    }

    if (areStringListsEqual(selectedLabels, updated)) return;

    saveObject(`kpi_config_${category}_${role || "all"}`, updated);
    setSelectedLabels(updated);
  }, [availableCardLabelsKey, category, role, selectedLabels]);

  const handleToggleCard = (label: string) => {
    setSelectedLabels((prev) => {
      let next: string[];
      if (prev.includes(label)) {
        next = prev.filter(l => l !== label);
      } else {
        next = [...prev, label];
      }
      saveObject(`kpi_config_${category}_${role || "all"}`, next);
      return next;
    });
  };

  // Automatically select newly added custom cards so they are visible immediately
  const prevCustomTitlesRef = useRef<string[]>(getObject<string[]>(`prev_kpi_titles_${category}`, []));
  const prevCustomTitlesCategoryRef = useRef(category);
  useEffect(() => {
    if (prevCustomTitlesCategoryRef.current !== category) {
      prevCustomTitlesCategoryRef.current = category;
      prevCustomTitlesRef.current = getObject<string[]>(`prev_kpi_titles_${category}`, []);
    }

    const currentTitles = customCards.map((c) => c.title);
    const prevTitles = prevCustomTitlesRef.current;
    const newlyAdded = currentTitles.filter((t) => !prevTitles.includes(t));
    prevCustomTitlesRef.current = currentTitles;
    saveObject(`prev_kpi_titles_${category}`, currentTitles);
    if (newlyAdded.length > 0) {
      const next = [...new Set([...selectedLabels, ...newlyAdded])];
      if (areStringListsEqual(selectedLabels, next)) return;

      saveObject(`kpi_config_${category}_${role || "all"}`, next);
      setSelectedLabels(next);
    }
  }, [customCards, category, role, selectedLabels]);

  const handleDeleteCustomCard = (label: string) => {
    const updatedCards = customCards.filter((c) => c.title !== label);
    setCustomCards(updatedCards);
    saveObject(`kpi_custom_cards_${category}`, updatedCards);
    
    const nextSelected = selectedLabels.filter((l) => l !== label);
    setSelectedLabels(nextSelected);
    saveObject(`kpi_config_${category}_${role || "all"}`, nextSelected);

    if (editingCardConfig && editingCardConfig.title === label) {
      setEditingCardConfig(null);
    }
    
    window.dispatchEvent(new Event("local-database-update"));
  };

  const handleEditCard = (label: string) => {
    const customCard = customCards.find((c) => c.title === label);
    if (customCard) {
      setEditingCardConfig(customCard);
    } else {
      const config = getDefaultCardConfig(category, label);
      setEditingCardConfig({
        ...config,
        id: "edit-default-" + Date.now()
      });
    }

    const el = document.getElementById(`config-panel-${category}`);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const visible = possibleCards.filter(kpi => selectedLabels.includes(kpi.label));

  const getCategoryLabelKey = (cat: string): string => {
    switch (cat) {
      case "contacts": return "nav.contacts";
      case "students": return "nav.students";
      case "attendance": return "nav.attendance";
      case "financial": return "nav.finance";
      case "hasanat": return "nav.hasanatCards";
      case "sessions": return "nav.sessions";
      case "examinations": return "nav.examinations";
      case "questionBank": return "nav.questionBank";
      case "enrollments": return "nav.enrollments";
      case "faculty":
      case "teachers": return "nav.teachers";
      case "accounting": return "nav.accounting";
      default: return "";
    }
  };

  const key = getCategoryLabelKey(category);
  const moduleLabel = key ? t(key as any) : category;

  return (
    <div className="space-y-3 w-full">
      {/* Configuration Header Bar */}
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-muted-foreground uppercase tracking-widest leading-none">
          {t("reports.kpiSectionTitle", { module: moduleLabel })}
        </span>
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card/60 backdrop-blur-md hover:bg-card hover:text-primary transition-all text-muted-foreground font-semibold shadow-sm cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {t("reports.kpiCustomize")}
        </button>
      </div>

      {/* Glassmorphic Settings Panel */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            id={`config-panel-${category}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-lg p-4 space-y-4 font-sans"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border">
              <div>
                <h4 className="text-sm font-bold text-foreground">{t("reports.kpiSettingsTitle")}</h4>
                <p className="text-[11px] text-muted-foreground">
                  {t("reports.kpiSettingsDesc")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-success/10 text-success font-bold border border-success/20 flex items-center gap-1">
                  {t("reports.kpiSelectedCount", { count: selectedLabels.length })}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                  {t("reports.kpiDataVolume", { count: primaryVolume })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-border">
              
              {/* Reusable State-of-the-Art Creator Form */}
              <div className="lg:col-span-2">
                <DynamicCardBuilder 
                  mode="kpi" 
                  category={category} 
                  initialCollection={defaultCollection}
                  editCardConfig={editingCardConfig}
                  onCancelEdit={() => setEditingCardConfig(null)}
                />
              </div>

              {/* Settings Checklist Column (1/3 width) */}
              <div className="rounded-2xl border border-border/50 bg-card/25 p-5 shadow-inner space-y-4 text-left flex flex-col justify-between">
                <div>
                  <div className="pb-2 border-b border-border">
                    <h4 className="text-xs font-black text-foreground uppercase tracking-widest leading-none">{t("reports.kpiVisibility")}</h4>
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-1.5 font-sans">
                    {t("reports.kpiVisibilityDesc")}
                  </p>

                  <div className="space-y-1.5 mt-3 max-h-[320px] overflow-y-auto pr-1">
                    {possibleCards.map((kpi) => {
                      const isSelected = selectedLabels.includes(kpi.label);
                      const isCustom = customCards.some((c) => c.title === kpi.label);

                      return (
                        <div
                          key={kpi.label}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-card/10 hover:bg-card/20 transition-all font-sans"
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleCard(kpi.label)}
                              className="rounded border-border text-primary focus:ring-primary/20 w-3.5 h-3.5 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-foreground truncate leading-tight">
                                {kpi.label}
                              </p>
                              <p className="text-[9px] text-muted-foreground leading-none mt-0.5 flex items-center gap-1 font-semibold">
                                {isCustom ? (
                                  <span className="text-primary">{t("reports.kpiCustomCard")}</span>
                                ) : (
                                  <span className="text-success">{t("reports.kpiActiveData")}</span>
                                )}
                              </p>
                            </div>
                          </label>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleEditCard(kpi.label)}
                              className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                              title={t("reports.kpiEditConfig")}
                              type="button"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {isCustom && (
                              <button
                                onClick={() => handleDeleteCustomCard(kpi.label)}
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                title={t("reports.kpiDeleteConfig")}
                                type="button"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-border mt-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                    <span>{t("reports.kpiActiveSelection")}</span>
                    <span className="text-foreground">{t("reports.kpiSelectionRatio", { current: selectedLabels.length, total: possibleCards.length })}</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-sans">
        {visible.map((kpi, i: number) => {
          const c = COLOR[kpi.color] || COLOR.primary;
          const trendInfo = TREND[kpi.trend] || TREND.flat;
          const Icon = kpi.icon;

          return (
            <motion.article
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-3.5 flex flex-col justify-between text-left shadow-sm hover:shadow-md hover:border-primary/20 transition-all group min-h-[120px]"
            >
              {/* Header Zone: Icon */}
              <header className="flex items-center justify-between gap-1.5 select-none">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center aspect-square flex-shrink-0 ${c.bg} group-hover:scale-115 transition-transform`}>
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
              </header>

              {/* Main Zone: Title and Statistical value */}
              <main className="mt-2 space-y-0.5 flex-1 min-w-0">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none truncate">
                  {kpi.label}
                </span>
                <p className={`text-lg font-black ${c.text} leading-tight mt-0.5 truncate`}>
                  {kpi.value}
                </p>
              </main>

              {/* Footer Zone: Subtitle metadata and trend arrow */}
              <footer className="mt-2 pt-1.5 border-t border-border/20 text-[9px] text-muted-foreground min-w-0">
                <div className="flex items-center gap-1 font-sans mb-0.5 select-none">
                  <span className={`text-[9px] font-black ${trendInfo.cls}`}>{trendInfo.arrow} {kpi.velocity || ""}</span>
                  {kpi.velocity && <span className="text-[8px] text-muted-foreground font-medium opacity-60">{t("reports.kpiVsPrev")}</span>}
                </div>
                <SubtextDisplay text={kpi.sub} />
              </footer>
            </motion.article>
          );
        })}

        {/* Add Custom Metric card */}
        <motion.button
          onClick={() => {
            setIsConfigOpen(true);
            setTimeout(() => {
              const el = document.getElementById(`config-panel-${category}`);
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }}
          className="rounded-2xl border border-dashed border-border/85 hover:border-primary/50 bg-card/25 hover:bg-primary/5 hover:text-primary transition-all duration-300 flex flex-col items-center justify-center p-3 text-muted-foreground min-h-[100px] text-center cursor-pointer"
        >
          <Plus className="w-5 h-5 mb-1 text-muted-foreground hover:text-primary" />
          <span className="text-[10px] font-bold">{t("reports.kpiAddCustom")}</span>
        </motion.button>
      </div>
    </div>
  );
}
