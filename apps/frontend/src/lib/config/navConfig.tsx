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
import {
  ACCOUNTING_MODULE_MANIFEST,
  ATTENDANCE_MODULE_MANIFEST,
  CONTACTS_MODULE_MANIFEST,
  ENROLLMENTS_MODULE_MANIFEST,
  EXAMINATIONS_MODULE_MANIFEST,
  FINANCE_MODULE_MANIFEST,
  HASANAT_MODULE_MANIFEST,
  MESSAGING_MODULE_MANIFEST,
  OBLIGATIONS_MODULE_MANIFEST,
  QUESTION_BANK_MODULE_MANIFEST,
  SESSIONS_MODULE_MANIFEST,
  STUDENTS_MODULE_MANIFEST,
  TEACHERS_MODULE_MANIFEST,
  USERS_MODULE_MANIFEST,
  type AppTranslationKey,
  type Permission,
} from "@mms/shared";
import { ROUTES } from "@/lib/config/routes";

export interface NavSubItem {
  labelKey: AppTranslationKey;
  icon: LucideIcon;
  path: string;
  moduleId?: string;
  requiredPermission?: Permission;
}

export interface NavItem {
  labelKey: AppTranslationKey;
  icon: LucideIcon;
  path?: string;
  moduleId?: string;
  requiredPermission?: Permission;
  subItems?: NavSubItem[];
}

/** Primary sidebar / mobile navigation structure */
export const NAV_ITEMS: NavItem[] = [
  {
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    path: ROUTES.home,
    moduleId: "dashboard",
    requiredPermission: "analytics.view",
  },
  {
    labelKey: "nav.contacts",
    icon: Users,
    path: ROUTES.contacts,
    moduleId: "contacts",
    requiredPermission: CONTACTS_MODULE_MANIFEST.permissions.read,
  },
  {
    labelKey: "nav.messaging",
    icon: MessageSquare,
    path: ROUTES.messaging,
    moduleId: "messaging",
    requiredPermission: MESSAGING_MODULE_MANIFEST.permissions.read,
  },
  {
    labelKey: "nav.academics",
    icon: BookOpen,
    subItems: [
      {
        labelKey: "nav.students",
        icon: GraduationCap,
        path: ROUTES.students,
        moduleId: "students",
        requiredPermission: STUDENTS_MODULE_MANIFEST.permissions.read,
      },
      {
        labelKey: "nav.teachers",
        icon: School,
        path: ROUTES.teachers,
        moduleId: "teachers",
        requiredPermission: TEACHERS_MODULE_MANIFEST.permissions.read,
      },
      {
        labelKey: "nav.sessions",
        icon: Calendar,
        path: ROUTES.sessions,
        moduleId: "sessions",
        requiredPermission: SESSIONS_MODULE_MANIFEST.permissions.read,
      },
      {
        labelKey: "nav.attendance",
        icon: UserCheck,
        path: ROUTES.attendance,
        moduleId: "attendance",
        requiredPermission: ATTENDANCE_MODULE_MANIFEST.permissions.read,
      },
      {
        labelKey: "nav.enrollments",
        icon: ClipboardList,
        path: ROUTES.enrollments,
        moduleId: "enrollment",
        requiredPermission: ENROLLMENTS_MODULE_MANIFEST.permissions.read,
      },
      {
        labelKey: "nav.hasanatCards",
        icon: Star,
        path: ROUTES.hasanatCards,
        moduleId: "hasanat",
        requiredPermission: HASANAT_MODULE_MANIFEST.permissions.read,
      },
      {
        labelKey: "nav.examinations",
        icon: FileText,
        path: ROUTES.examinations,
        moduleId: "examination",
        requiredPermission: EXAMINATIONS_MODULE_MANIFEST.permissions.read,
      },
      {
        labelKey: "nav.questionBank",
        icon: Library,
        path: ROUTES.questionBank,
        moduleId: "questionBank",
        requiredPermission: QUESTION_BANK_MODULE_MANIFEST.permissions.read,
      },
    ],
  },
  {
    labelKey: "nav.finance",
    icon: DollarSign,
    path: ROUTES.finance,
    moduleId: "finance",
    requiredPermission: FINANCE_MODULE_MANIFEST.permissions.read,
  },
  {
    labelKey: "nav.accounting",
    icon: TrendingUp,
    path: ROUTES.accounting,
    moduleId: "accounting",
    requiredPermission: ACCOUNTING_MODULE_MANIFEST.permissions.read,
  },
  {
    labelKey: "nav.obligations",
    icon: Scale,
    path: ROUTES.obligations,
    moduleId: "finance",
    requiredPermission: OBLIGATIONS_MODULE_MANIFEST.permissions.read,
  },
  {
    labelKey: "nav.users",
    icon: UserCog,
    path: ROUTES.users,
    moduleId: "users",
    requiredPermission: USERS_MODULE_MANIFEST.permissions.read,
  },
  {
    labelKey: "nav.settings",
    icon: Settings,
    path: ROUTES.settings,
    moduleId: "settings",
    requiredPermission: "configuration.view",
  },
];
