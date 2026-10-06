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
  CheckSquare,
  type LucideIcon,
} from "lucide-react";
import type { AppTranslationKey } from "@mms/shared";
import { ROUTES } from "@/lib/config/routes";

export interface NavSubItem {
  labelKey: AppTranslationKey;
  icon: LucideIcon;
  path: string;
}

export interface NavItem {
  labelKey: AppTranslationKey;
  icon: LucideIcon;
  path?: string;
  subItems?: NavSubItem[];
}

/** Primary sidebar / mobile navigation structure; access comes from `TENANT_APP_ROUTE_ACCESS`. */
export const NAV_ITEMS: NavItem[] = [
  {
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    path: ROUTES.home,
  },
  {
    labelKey: "nav.contacts",
    icon: Users,
    path: ROUTES.contacts,
  },
  {
    labelKey: "nav.faculty",
    icon: School,
    path: ROUTES.faculty,
  },
  {
    labelKey: "nav.messaging",
    icon: MessageSquare,
    path: ROUTES.messaging,
  },
  {
    labelKey: "nav.tasks",
    icon: CheckSquare,
    path: ROUTES.tasks,
  },
  {
    labelKey: "nav.academics",
    icon: BookOpen,
    subItems: [
      {
        labelKey: "nav.students",
        icon: GraduationCap,
        path: ROUTES.students,
      },
      {
        labelKey: "nav.sessions",
        icon: Calendar,
        path: ROUTES.sessions,
      },
      {
        labelKey: "nav.enrollments",
        icon: ClipboardList,
        path: ROUTES.enrollments,
      },
      {
        labelKey: "nav.attendance",
        icon: UserCheck,
        path: ROUTES.attendance,
      },
      {
        labelKey: "nav.hasanatCards",
        icon: Star,
        path: ROUTES.hasanatCards,
      },
      {
        labelKey: "nav.examinations",
        icon: FileText,
        path: ROUTES.examinations,
      },
      {
        labelKey: "nav.questionBank",
        icon: Library,
        path: ROUTES.questionBank,
      },
    ],
  },
  {
    labelKey: "nav.finance",
    icon: DollarSign,
    path: ROUTES.finance,
  },
  {
    labelKey: "nav.accounting",
    icon: TrendingUp,
    path: ROUTES.accounting,
  },
  {
    labelKey: "nav.obligations",
    icon: Scale,
    path: ROUTES.obligations,
  },
  {
    labelKey: "nav.users",
    icon: UserCog,
    path: ROUTES.users,
  },
  {
    labelKey: "nav.settings",
    icon: Settings,
    path: ROUTES.settings,
  },
];
