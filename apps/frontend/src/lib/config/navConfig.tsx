import {
  LayoutDashboard,
  Users,
  MessageSquare,
  GraduationCap,
  ClipboardList,
  Calendar,
  UserCheck,
  DollarSign,
  Star,
  FileText,
  Library,
  Settings,
  UserCog,
  Scale,
  TrendingUp,
  BookOpen,
  School,
  type LucideIcon,
} from "lucide-react";
import { type AppTranslationKey } from "@mms/shared";
import { ROUTES } from "@/lib/config/routes";

export interface NavSubItem {
  labelKey: AppTranslationKey;
  icon: LucideIcon;
  path: string;
  moduleId?: string;
}

export interface NavItem {
  labelKey: AppTranslationKey;
  icon: LucideIcon;
  path?: string;
  moduleId?: string;
  subItems?: NavSubItem[];
}

/** Primary sidebar / mobile navigation structure */
export const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard", icon: LayoutDashboard, path: ROUTES.home, moduleId: "dashboard" },
  { labelKey: "nav.contacts", icon: Users, path: ROUTES.contacts, moduleId: "contacts" },
  { labelKey: "nav.messaging", icon: MessageSquare, path: ROUTES.messaging, moduleId: "messaging" },
  {
    labelKey: "nav.academics",
    icon: BookOpen,
    subItems: [
      { labelKey: "nav.students", icon: GraduationCap, path: ROUTES.students, moduleId: "students" },
      { labelKey: "nav.teachers", icon: School, path: ROUTES.teachers, moduleId: "teachers" },
      { labelKey: "nav.sessions", icon: Calendar, path: ROUTES.sessions, moduleId: "sessions" },
      { labelKey: "nav.attendance", icon: UserCheck, path: ROUTES.attendance, moduleId: "attendance" },
      { labelKey: "nav.enrollments", icon: ClipboardList, path: ROUTES.enrollments, moduleId: "enrollment" },
      { labelKey: "nav.hasanatCards", icon: Star, path: ROUTES.hasanatCards, moduleId: "hasanat" },
      { labelKey: "nav.examinations", icon: FileText, path: ROUTES.examinations, moduleId: "examination" },
      { labelKey: "nav.questionBank", icon: Library, path: ROUTES.questionBank, moduleId: "questionBank" },
    ],
  },
  { labelKey: "nav.finance", icon: DollarSign, path: ROUTES.finance, moduleId: "finance" },
  { labelKey: "nav.accounting", icon: TrendingUp, path: ROUTES.accounting, moduleId: "accounting" },
  { labelKey: "nav.obligations", icon: Scale, path: ROUTES.obligations, moduleId: "finance" },
  { labelKey: "nav.users", icon: UserCog, path: ROUTES.users, moduleId: "users" },
  { labelKey: "nav.settings", icon: Settings, path: ROUTES.settings, moduleId: "settings" },
];

/** Quick-action translation key → route */
export const QUICK_ACTION_ROUTE_KEYS: Partial<Record<AppTranslationKey, string>> = {
  "action.addStudent": ROUTES.enrollments,
  "action.createSession": ROUTES.sessions,
  "action.recordPayment": ROUTES.finance,
  "action.takeAttendance": ROUTES.attendance,
  "action.awardHasanat": ROUTES.hasanatCards,
  "action.generateReport": ROUTES.accounting,
  "action.printReceipt": ROUTES.finance,
  "action.viewLedger": ROUTES.accounting,
};
