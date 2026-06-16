import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserCheck, DollarSign, TrendingUp, Star, 
  AlertCircle, GraduationCap, BarChart2, LucideIcon, 
  Target, Zap, Activity, SlidersHorizontal, Info, RefreshCw,
  Plus, Trash2, ShieldCheck, Receipt, CalendarCheck
} from "lucide-react";
import { getCollection } from "../../lib/db";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { useStudentsCollection } from "../../hooks/useStudents";
import { CONTACTS } from '@/lib/data/contactsData';
import { type Contact } from "../../lib/contactFields";
import { ATTENDANCE_RECORDS, type AttendanceRecord } from '@/lib/data/attendanceData';
import { INVOICES, type Invoice } from '@/lib/data/financeData';
import { STUDENTS, type Student } from '@/lib/data/studentsData';
import { EXAMS, EXAM_RESULTS } from '@/lib/data/examinationData';
import { SESSIONS_DATA, type Session } from '@/lib/data/sessionsData';
import { DISTRIBUTIONS, type Distribution } from '@/lib/data/hasanatData';
import { QUESTIONS, TESTS, RESULTS } from '@/lib/data/questionBankData';
import type { QuestionBankQuestion, QuestionBankResult, QuestionBankTest } from "@mms/shared";
import { METADATA_FIELDS, computeCustomCard as computeCustomCardShared, CustomCard, COLLECTION_OPTIONS } from "./reportMetadata";
import DynamicCardBuilder from "./DynamicCardBuilder";
import usePermissions from "@/hooks/usePermissions";

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

interface ColorScheme {
  bg: string;
  text: string;
}

const COLOR: Record<string, ColorScheme> = {
  primary: { bg: "bg-primary/10",   text: "text-primary"     },
  green:   { bg: "bg-emerald-50",   text: "text-emerald-600" },
  emerald: { bg: "bg-emerald-50",   text: "text-emerald-600" },
  blue:    { bg: "bg-blue-50",      text: "text-blue-600"    },
  red:     { bg: "bg-red-50",       text: "text-destructive"     },
  amber:   { bg: "bg-amber-50",     text: "text-amber-600"   },
  violet:  { bg: "bg-violet-50",    text: "text-violet-600"  },
};

interface TrendScheme {
  cls: string;
  arrow: string;
}

const TREND: Record<string, TrendScheme> = {
  up:   { cls: "text-emerald-500", arrow: "↑" },
  down: { cls: "text-destructive",     arrow: "↓" },
  flat: { cls: "text-muted-foreground", arrow: "→" },
};

const CATEGORY_NAMES: Record<string, string> = {
  contacts: "Contacts",
  students: "Students",
  attendance: "Attendance",
  financial: "Financial",
  hasanat: "Hasanat",
  sessions: "Sessions",
  examinations: "Examinations",
  questionBank: "Question Bank",
  enrollments: "Enrollments",
  faculty: "Faculty",
  accounting: "Accounting",
};

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
    sessions: Session[];
    finance_invoices: Invoice[];
    attendance_records: AttendanceRecord[];
    hasanat_distributions: Distribution[];
    contacts: Contact[];
    questions: QuestionBankQuestion[];
    tests: QuestionBankTest[];
    assessment_results: QuestionBankResult[];
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
  const contacts = useLiveCollection("contacts");
  const records = useLiveCollection("attendance_records");
  const invoices = useLiveCollection("finance_invoices");
  const students = useStudentsCollection();
  const exams = useLiveCollection("exams");
  const examResults = useLiveCollection("exam_results");
  const sessions = useLiveCollection("sessions");
  const distributions = useLiveCollection("hasanat_distributions");
  const qbQuestions = useLiveCollection("questions");
  const qbTests = useLiveCollection("tests");
  const qbResults = useLiveCollection("assessment_results");

  const computedKPIs = useMemo(() => {
    // 1. Total Students
    let totalStudentsVal = "0";
    let totalStudentsSub = "No students";
    let totalStudentsTrend: "up" | "down" | "flat" = "flat";
    let totalStudentsVelocity = undefined;

    if (category === "contacts") {
      const total = contacts.length;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recent = contacts.filter(c => c.createdAt && new Date(c.createdAt) >= thirtyDaysAgo).length;
      const older  = contacts.filter(c => c.createdAt && new Date(c.createdAt) >= sixtyDaysAgo && new Date(c.createdAt) < thirtyDaysAgo).length;
      
      totalStudentsVal = String(total);
      totalStudentsSub = `${recent} new recently`;
      totalStudentsTrend = recent >= older ? "up" : "down";
      totalStudentsVelocity = older > 0 ? `${Math.round(((recent - older) / older) * 100)}%` : `+${recent}`;
    } else {
      totalStudentsVal = String(students.length);
      totalStudentsSub = `${students.filter(s => s.status === "active").length} active now`;
      totalStudentsTrend = "up";
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
      let points = 50;
      const name = (dist.denominationName || "").toLowerCase();
      if (name.includes("silver")) points = 150;
      else if (name.includes("gold")) points = 500;
      else if (name.includes("platinum")) points = 1000;
      else if (name.includes("diamond")) points = 2500;
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
    const signupDates = contacts
      .map(c => c.createdAt ? new Date(c.createdAt).getTime() : 0)
      .filter(t => t > 0)
      .sort((a, b) => a - b);
    let growthVal = "+0%";
    let growthTrend: "up" | "down" | "flat" = "flat";
    let growthSub = "No signup dates";
    if (signupDates.length > 0) {
      const maxDate = new Date(signupDates[signupDates.length - 1]);
      const t0 = maxDate.getTime();
      const t30 = t0 - 30 * 24 * 60 * 60 * 1000;
      const t60 = t0 - 60 * 24 * 60 * 60 * 1000;
      
      const recentSignups = contacts.filter(c => {
        if (!c.createdAt) return false;
        const t = new Date(c.createdAt).getTime();
        return t >= t30 && t <= t0;
      }).length;
      
      const priorSignups = contacts.filter(c => {
        if (!c.createdAt) return false;
        const t = new Date(c.createdAt).getTime();
        return t >= t60 && t < t30;
      }).length;
      
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
    }

    // 9. Lead Conversion
    const totalContactsCount = contacts.length;
    const leadsCount = contacts.filter(c => (c.lifecycleStage || "Lead") === "Lead").length;
    const conversionRate = totalContactsCount > 0 ? Math.round(((totalContactsCount - leadsCount) / totalContactsCount) * 100) : 0;
    const conversionVal = `${conversionRate}%`;

    // 10. Active Enquiries
    const enquiriesCount = contacts.filter(c => (c.lifecycleStage || "Lead") === "Lead").length;
    let recentEnquiries = 0;
    if (signupDates.length > 0) {
      const maxDate = new Date(signupDates[signupDates.length - 1]);
      const sevenDaysAgo = new Date(maxDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      recentEnquiries = contacts.filter(c => {
        const isLead = (c.lifecycleStage || "Lead") === "Lead";
        if (!isLead) return false;
        if (!c.createdAt) return false;
        return new Date(c.createdAt) >= sevenDaysAgo;
      }).length;
    }
    const enquiriesVal = String(enquiriesCount);
    const enquiriesSub = `${recentEnquiries} new in 7 days`;

    // 11. Engagement Index
    const ratedContactsList = contacts.filter(c => typeof c.rating === "number" && c.rating > 0);
    const avgRatingVal = ratedContactsList.length > 0 ? ratedContactsList.reduce((sum, c) => sum + (c.rating || 0), 0) / ratedContactsList.length : 4.2;
    const engagementIndex = (avgRatingVal * 2).toFixed(1);
    const engagementVal = engagementIndex;

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
        isAvailable: category === "contacts" ? contacts.length > 0 : students.length > 0
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
        isAvailable: contacts.some(c => !!c.createdAt)
      },
      {
        icon: Target,
        label: "Lead Conversion",
        value: conversionVal,
        sub: "Lead → Active",
        color: "violet",
        trend: "up",
        categories: ["contacts"],
        isAvailable: contacts.length > 0
      },
      {
        icon: Zap,
        label: "Active Enquiries",
        value: enquiriesVal,
        sub: enquiriesSub,
        color: "amber",
        trend: "up",
        categories: ["contacts"],
        isAvailable: contacts.some(c => (c.lifecycleStage || "Lead") === "Lead")
      },
      {
        icon: Activity,
        label: "Engagement Index",
        value: engagementVal,
        sub: "/10 score",
        color: "green",
        trend: "flat",
        categories: ["contacts"],
        isAvailable: contacts.some(c => typeof c.rating === "number" && c.rating > 0)
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
    ];

    return items;
  }, [contacts, records, invoices, students, exams, examResults, sessions, distributions, qbQuestions, qbTests, qbResults, category]);

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
    try {
      const saved = localStorage.getItem(`kpi_custom_cards_${category}`);
      if (saved) {
        return JSON.parse(saved) as CustomCard[];
      }
    } catch (e) {
      console.error("Failed to load custom KPI cards", e);
    }
    return [];
  });

  const defaultCollection = useMemo<CustomCard["collection"]>(() => {
    if (category === "students") return "students";
    if (category === "contacts") return "contacts";
    if (category === "attendance") return "attendance_records";
    if (category === "financial" || category === "accounting") return "finance_invoices";
    if (category === "hasanat") return "hasanat_distributions";
    if (category === "sessions") return "sessions";
    if (category === "examinations" || category === "enrollments") return "students";
    if (category === "questionBank") return "questions";
    return "students";
  }, [category]);

  // Card builder form state
  const [editingCardConfig, setEditingCardConfig] = useState<CustomCard | null>(null);

  // Sync custom cards from localStorage when updated elsewhere
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem(`kpi_custom_cards_${category}`);
        setCustomCards(saved ? JSON.parse(saved) as CustomCard[] : []);
      } catch (e) {
        console.error("Failed to load custom KPI cards on storage sync", e);
      }
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
      return computeCustomCard(card, {
        students,
        sessions,
        finance_invoices: invoices,
        attendance_records: records,
        hasanat_distributions: distributions,
        contacts,
        questions: qbQuestions,
        tests: qbTests,
        assessment_results: qbResults,
      });
    });
  }, [customCards, students, sessions, invoices, records, distributions, contacts, qbQuestions, qbTests, qbResults]);

  // Merge standard and custom possible cards, preventing duplicates if standard label is overridden
  const possibleCards = useMemo(() => {
    const customLabels = computedCustomKPIs.map(c => c.label);
    const uniqueStandard = standardPossibleCards.filter(s => !customLabels.includes(s.label));
    return [...uniqueStandard, ...computedCustomKPIs];
  }, [standardPossibleCards, computedCustomKPIs]);

  // Check which are available (standard isAvailable or always true for custom)
  const availableCards = useMemo(() => {
    return possibleCards.filter(k => k.isAvailable);
  }, [possibleCards]);

  // Primary volume counts for the dynamic limit formula
  const primaryVolume = useMemo(() => {
    switch (category) {
      case "students": return students.length;
      case "contacts": return contacts.length;
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
        return students.length + sessions.length;
      case "faculty":
        return 0;
      default:
        return 0;
    }
  }, [category, students, contacts, records, invoices, distributions, examResults, sessions, qbQuestions, qbTests, qbResults]);

  // User-configurable active visibility controls state
  const [selectedLabels, setSelectedLabels] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`kpi_config_${category}_${role || "all"}`);
      if (saved) {
        return JSON.parse(saved) as string[];
      }
    } catch (e) {
      console.error("Failed to load KPI configs", e);
    }
    return [];
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Validate user selections reactively against database changes
  useEffect(() => {
    let updated = [...selectedLabels];
    
    // Filter out invalid/unavailable options
    updated = updated.filter(label => 
      possibleCards.some(p => p.label === label) && 
      possibleCards.find(p => p.label === label)?.isAvailable
    );

    // Default to all available cards if no active selection is stored
    if (updated.length === 0 && possibleCards.filter(p => p.isAvailable).length > 0) {
      updated = possibleCards.filter(p => p.isAvailable).map(a => a.label);
    }

    const currentSaved = localStorage.getItem(`kpi_config_${category}_${role || "all"}`);
    const nextSaved = JSON.stringify(updated);
    if (currentSaved !== nextSaved) {
      setSelectedLabels(updated);
      localStorage.setItem(`kpi_config_${category}_${role || "all"}`, nextSaved);
    }
  }, [possibleCards, category, role]);

  const handleToggleCard = (label: string) => {
    setSelectedLabels((prev) => {
      let next: string[];
      if (prev.includes(label)) {
        next = prev.filter(l => l !== label);
      } else {
        next = [...prev, label];
      }
      localStorage.setItem(`kpi_config_${category}_${role || "all"}`, JSON.stringify(next));
      return next;
    });
  };

  const handleReset = () => {
    const defaults = possibleCards.filter(a => a.isAvailable).map(a => a.label);
    setSelectedLabels(defaults);
    localStorage.setItem(`kpi_config_${category}_${role || "all"}`, JSON.stringify(defaults));
    
    // Also delete all custom cards on reset to match defaults
    setCustomCards([]);
    localStorage.removeItem(`kpi_custom_cards_${category}`);
  };

  // Automatically select newly added custom cards so they are visible immediately
  useEffect(() => {
    const prevTitlesStr = localStorage.getItem(`prev_kpi_titles_${category}`) || "[]";
    let prevTitles: string[] = [];
    try {
      prevTitles = JSON.parse(prevTitlesStr) as string[];
    } catch {
      prevTitles = [];
    }
    const currentTitles = customCards.map((c) => c.title);
    
    const newlyAdded = currentTitles.filter((t) => !prevTitles.includes(t));
    if (newlyAdded.length > 0) {
      const nextSelected = [...new Set([...selectedLabels, ...newlyAdded])];
      setSelectedLabels(nextSelected);
      localStorage.setItem(`kpi_config_${category}_${role || "all"}`, JSON.stringify(nextSelected));
    }
    
    localStorage.setItem(`prev_kpi_titles_${category}`, JSON.stringify(currentTitles));
  }, [customCards, category, role, selectedLabels]);

  const handleDeleteCustomCard = (label: string) => {
    const updatedCards = customCards.filter((c) => c.title !== label);
    setCustomCards(updatedCards);
    localStorage.setItem(`kpi_custom_cards_${category}`, JSON.stringify(updatedCards));
    
    const nextSelected = selectedLabels.filter((l) => l !== label);
    setSelectedLabels(nextSelected);
    localStorage.setItem(`kpi_config_${category}_${role || "all"}`, JSON.stringify(nextSelected));

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

  return (
    <div className="space-y-3 w-full">
      {/* Configuration Header Bar */}
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-muted-foreground uppercase tracking-widest leading-none">
          {(CATEGORY_NAMES[category] || category) + " Metrics"}
        </span>
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card/60 backdrop-blur-md hover:bg-card hover:text-primary transition-all text-muted-foreground font-semibold shadow-sm cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Customize Dashboard
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
                <h4 className="text-sm font-bold text-foreground">Dashboard Cards Settings</h4>
                <p className="text-[11px] text-muted-foreground">
                  Choose which metric cards to display in this module.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20 flex items-center gap-1">
                  Selected: {selectedLabels.length} Cards
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                  Data Volume: {primaryVolume} Records
                </span>
                <button
                  onClick={handleReset}
                  className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer bg-transparent border-0"
                >
                  <RefreshCw className="w-3 h-3" /> Reset to Defaults
                </button>
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
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <h4 className="text-xs font-black text-foreground uppercase tracking-widest leading-none">Card Visibility</h4>
                    <button
                      onClick={handleReset}
                      className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer bg-transparent border-0"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Reset All
                    </button>
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-1.5 font-sans">
                    Toggle which metrics appear on the active dashboard panel.
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
                                  <span className="text-primary">Custom Card</span>
                                ) : (
                                  <span className="text-emerald-500">● Active Data</span>
                                )}
                              </p>
                            </div>
                          </label>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleEditCard(kpi.label)}
                              className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                              title="Edit Card Configuration"
                              type="button"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {isCustom && (
                              <button
                                onClick={() => handleDeleteCustomCard(kpi.label)}
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                title="Delete Custom Card"
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
                    <span>Active Selection:</span>
                    <span className="text-foreground">{selectedLabels.length} of {possibleCards.length}</span>
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
          const t = TREND[kpi.trend] || TREND.flat;
          const Icon = kpi.icon;

          // Inner subtext handler with ellipsis / Read More trigger
          const SubtextDisplay = ({ text }: { text: string }) => {
            const [expanded, setExpanded] = React.useState(false);
            const isLong = text.length > 30;
            if (!isLong) return <span className="truncate block font-semibold">{text}</span>;
            return (
              <span className="block leading-normal font-semibold whitespace-normal break-words">
                {expanded ? text : `${text.slice(0, 30)}...`}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  className="ml-1 text-primary hover:underline font-extrabold inline-block cursor-pointer bg-transparent border-0 p-0 text-[9px]"
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              </span>
            );
          };

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
                  <span className={`text-[9px] font-black ${t.cls}`}>{t.arrow} {kpi.velocity || ""}</span>
                  {kpi.velocity && <span className="text-[8px] text-muted-foreground font-medium opacity-60">vs prev</span>}
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
          <span className="text-[10px] font-bold">Add Custom Metric</span>
        </motion.button>
      </div>
    </div>
  );
}
