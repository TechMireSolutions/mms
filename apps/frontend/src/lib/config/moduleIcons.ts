import {
  BookOpen,
  Boxes,
  Calendar,
  ClipboardList,
  DollarSign,
  FileText,
  GraduationCap,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  Star,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react';

/** Lucide icons referenced by {@link SYSTEM_MODULES} `icon` string keys. */
export const MODULE_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  GraduationCap,
  Users,
  MessageSquare,
  Calendar,
  UserCheck,
  FileText,
  DollarSign,
  Star,
  UserCog,
  ClipboardList,
  TrendingUp,
  BookOpen,
  Boxes,
};

export function resolveModuleIcon(iconName: string, fallback: LucideIcon = Boxes): LucideIcon {
  return MODULE_ICONS[iconName] ?? fallback;
}
