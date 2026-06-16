export const ROLES = ["admin", "teacher", "accountant"] as const;
export type UserRole = typeof ROLES[number];

export interface StatCardItem {
  id: string;
  title: string;
  value: string;
  sub: string;
  trend: number;
  icon: string;
  color: "emerald" | "blue" | "violet" | "amber" | "red";
}

// ── Stats ──────────────────────────────────────────────────────────────────
export const adminStats: StatCardItem[] = [
  { id: "students",    title: "Total Students",      value: "312",      sub: "+14 this month",  trend: 14,   icon: "GraduationCap", color: "emerald" },
  { id: "sessions",   title: "Active Sessions",      value: "8",        sub: "2 starting soon", trend: 0,    icon: "CalendarCheck", color: "blue"    },
  { id: "classes",    title: "Active Classes",        value: "24",       sub: "6 departments",   trend: 4,    icon: "BookOpen",      color: "violet"  },
  { id: "attendance", title: "Attendance Today",      value: "87%",      sub: "271 of 312",      trend: -3,   icon: "UserCheck",     color: "amber"   },
  { id: "fees",       title: "Fee Collection",        value: "$18,420",  sub: "This month",      trend: 11,   icon: "DollarSign",    color: "emerald" },
  { id: "outstanding",title: "Outstanding Payments",  value: "$3,180",   sub: "42 students",     trend: -8,   icon: "AlertCircle",   color: "red"     },
  { id: "hasanat",    title: "Hasanat Awarded",       value: "5,640",    sub: "This week",       trend: 22,   icon: "Star",          color: "amber"   },
];

export const teacherStats: StatCardItem[] = [
  { id: "classes",    title: "My Classes",            value: "4",        sub: "All active",      trend: 0,    icon: "BookOpen",      color: "violet"  },
  { id: "sessions",   title: "Sessions Today",        value: "3",        sub: "Next: 2:00 PM",   trend: 0,    icon: "CalendarCheck", color: "blue"    },
  { id: "attendance", title: "Attendance Today",      value: "91%",      sub: "38 of 42",        trend: 5,    icon: "UserCheck",     color: "emerald" },
  { id: "hasanat",    title: "Hasanat Awarded",       value: "320",      sub: "This week",       trend: 12,   icon: "Star",          color: "amber"   },
];

export const accountantStats: StatCardItem[] = [
  { id: "fees",       title: "Fee Collection",        value: "$18,420",  sub: "This month",      trend: 11,   icon: "DollarSign",    color: "emerald" },
  { id: "outstanding",title: "Outstanding Payments",  value: "$3,180",   sub: "42 students",     trend: -8,   icon: "AlertCircle",   color: "red"     },
  { id: "revenue",    title: "Total Revenue (YTD)",   value: "$142,600", sub: "vs $128k last yr",trend: 11.4, icon: "TrendingUp",    color: "blue"    },
  { id: "expenses",   title: "Total Expenses (YTD)",  value: "$98,340",  sub: "Under budget",    trend: -2,   icon: "Receipt",       color: "violet"  },
];

// ── Charts ──────────────────────────────────────────────────────────────────
export interface EnrollmentPoint {
  month: string;
  students: number;
}

export const enrollmentData: EnrollmentPoint[] = [
  { month: "Jul", students: 240 },
  { month: "Aug", students: 255 },
  { month: "Sep", students: 270 },
  { month: "Oct", students: 262 },
  { month: "Nov", students: 278 },
  { month: "Dec", students: 268 },
  { month: "Jan", students: 285 },
  { month: "Feb", students: 292 },
  { month: "Mar", students: 300 },
  { month: "Apr", students: 312 },
];

export interface RevenuePoint {
  month: string;
  revenue: number;
  expenses: number;
}

export const revenueData: RevenuePoint[] = [
  { month: "Jul", revenue: 12400, expenses: 8200 },
  { month: "Aug", revenue: 14200, expenses: 9100 },
  { month: "Sep", revenue: 15800, expenses: 9800 },
  { month: "Oct", revenue: 13600, expenses: 8700 },
  { month: "Nov", revenue: 16200, expenses: 10200 },
  { month: "Dec", revenue: 11800, expenses: 7400 },
  { month: "Jan", revenue: 17400, expenses: 10800 },
  { month: "Feb", revenue: 16800, expenses: 9600 },
  { month: "Mar", revenue: 18200, expenses: 11200 },
  { month: "Apr", revenue: 18420, expenses: 10840 },
];

export interface AttendancePoint {
  day: string;
  rate: number;
}

export const attendanceData: AttendancePoint[] = [
  { day: "Mon", rate: 92 },
  { day: "Tue", rate: 88 },
  { day: "Wed", rate: 85 },
  { day: "Thu", rate: 90 },
  { day: "Fri", rate: 78 },
  { day: "Sat", rate: 94 },
  { day: "Sun", rate: 87 },
];

export interface HasanatPoint {
  name: string;
  value: number;
  color: string;
}

export const hasanatData: HasanatPoint[] = [
  { name: "Memorisation", value: 2800, color: "#047857" },
  { name: "Attendance",   value: 1400, color: "#D4A853" },
  { name: "Behaviour",    value: 840,  color: "#4F46E5" },
  { name: "Homework",     value: 600,  color: "#0891B2" },
];

// ── Sessions ─────────────────────────────────────────────────────────────
export interface UpcomingSessionItem {
  id: number;
  name: string;
  teacher: string;
  time: string;
  room: string;
  students: number;
  status: "live" | "upcoming";
}

export const upcomingSessions: UpcomingSessionItem[] = [
  { id: 1, name: "Quran Hifz – Level 3",     teacher: "Sh. Abdullah",   time: "09:00",  room: "A1",  students: 12, status: "live"     },
  { id: 2, name: "Tajweed Fundamentals",      teacher: "Ustadha Mariam", time: "10:30",  room: "B2",  students: 18, status: "upcoming" },
  { id: 3, name: "Fiqh – Intermediate",       teacher: "Sh. Yusuf",      time: "13:00",  room: "C3",  students: 22, status: "upcoming" },
  { id: 4, name: "Seerah & Islamic History",  teacher: "Ustadha Hafsa",  time: "14:30",  room: "A2",  students: 28, status: "upcoming" },
  { id: 5, name: "Arabic Grammar",            teacher: "Sh. Ibrahim",    time: "16:00",  room: "D1",  students: 15, status: "upcoming" },
];

// ── Notifications ─────────────────────────────────────────────────────────
export interface DashboardNotification {
  id: number;
  type: "fee" | "event" | "student" | "attendance";
  title: string;
  desc: string;
  time: string;
  urgent: boolean;
}

export const notifications: Record<UserRole, DashboardNotification[]> = {
  admin: [
    { id: 1, type: "fee",     title: "Overdue fee – Ahmad Hassan",    desc: "3 months outstanding – $450",       time: "2h ago",   urgent: true  },
    { id: 2, type: "event",   title: "Annual Quran competition",       desc: "Scheduled for 25 Apr – 48 entries", time: "1d ago",   urgent: false },
    { id: 3, type: "fee",     title: "12 pending fee approvals",       desc: "Awaiting admin review",             time: "3h ago",   urgent: true  },
    { id: 4, type: "student", title: "New enrolment request",          desc: "Yusuf Al-Farsi – Hifz Program",     time: "5h ago",   urgent: false },
    { id: 5, type: "event",   title: "Staff meeting – tomorrow 9 AM",  desc: "All teachers required to attend",   time: "8h ago",   urgent: false },
  ],
  teacher: [
    { id: 1, type: "attendance", title: "Low attendance – Tajweed class", desc: "Only 62% present today",           time: "1h ago",   urgent: true  },
    { id: 2, type: "event",      title: "Quran competition – sign up",    desc: "Register students by 20 Apr",      time: "2d ago",   urgent: false },
    { id: 3, type: "student",    title: "New student assigned",           desc: "Bilal Siddiqui added to your class",time: "3h ago",  urgent: false },
  ],
  accountant: [
    { id: 1, type: "fee",     title: "42 outstanding payments",        desc: "Total $3,180 overdue",               time: "now",      urgent: true  },
    { id: 2, type: "fee",     title: "Monthly report ready",           desc: "April fee collection complete",      time: "1d ago",   urgent: false },
    { id: 3, type: "fee",     title: "Refund request – Fatima Ali",    desc: "$150 refund pending approval",       time: "4h ago",   urgent: true  },
  ],
};

// ── Outstanding fees table ────────────────────────────────────────────────
export interface OutstandingFeeItem {
  id: number;
  student: string;
  class: string;
  amount: number;
  months: number;
  contact: string;
}

export const outstandingFees: OutstandingFeeItem[] = [
  { id: 1, student: "Ahmad Hassan",    class: "Hifz Level 2",       amount: 450, months: 3, contact: "+44 7700 1001" },
  { id: 2, student: "Sara Malik",      class: "Tajweed Basics",     amount: 150, months: 1, contact: "+44 7700 1002" },
  { id: 3, student: "Omar Siddiqui",   class: "Fiqh Intermediate",  amount: 300, months: 2, contact: "+44 7700 1003" },
  { id: 4, student: "Zainab Al-Nouri", class: "Arabic Grammar",     amount: 150, months: 1, contact: "+44 7700 1004" },
  { id: 5, student: "Bilal Rahman",    class: "Seerah & History",   amount: 450, months: 3, contact: "+44 7700 1005" },
];
